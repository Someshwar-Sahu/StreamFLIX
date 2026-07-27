from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy import select, func, case
import shutil

from app.core.db import get_db
from app.core.config import settings
from app.core.auth_dep import require_uploader, get_current_profile_id

from app.models.series import Series, Season, Episode
from app.models.content import Content
from app.models.category import Category
from app.models.watchlist import Watchlist
from app.models.rating import Rating
from app.models.watch_history import WatchHistory

from app.schemas.series import SeriesOut, SeriesDetailOut, SeasonOut, EpisodeOut
from app.schemas.discover import DiscoverItem

from app.workers.tasks import transcode_video

router = APIRouter(prefix="/series", tags=["series"])


@router.post("", response_model=SeriesOut)
async def create_series(
    title: str = Form(...),
    description: str = Form(None),
    category_names: str = Form(None),
    poster: UploadFile = File(None),
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(require_uploader),
):
    series = Series(title=title, description=description, uploaded_by=user_id)

    if category_names:
        names = [n.strip() for n in category_names.split(",") if n.strip()]
        if names:
            result = await db.execute(select(Category).where(Category.name.in_(names)))
            series.categories = result.scalars().all()

    db.add(series)
    await db.commit()
    await db.refresh(series, attribute_names=["categories"])

    if poster:
        poster_dir = settings.media_storage_path / "series" / str(series.id)
        poster_dir.mkdir(parents=True, exist_ok=True)
        ext = poster.filename.split(".")[-1] if "." in poster.filename else "jpg"
        poster_path = poster_dir / f"poster.{ext}"
        with open(poster_path, "wb") as f:
            shutil.copyfileobj(poster.file, f)
        series.poster_url = f"/media/series/{series.id}/poster.{ext}"
        await db.commit()
        await db.refresh(series, attribute_names=["categories"])

    return series


@router.get("", response_model=list[SeriesOut])
async def list_series(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Series).options(selectinload(Series.categories)).order_by(Series.created_at.desc())
    )
    return result.scalars().all()


@router.get("/{series_id}", response_model=SeriesDetailOut)
async def get_series_detail(series_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Series)
        .options(
            selectinload(Series.categories),
            selectinload(Series.seasons).selectinload(Season.episodes),
        )
        .where(Series.id == series_id)
    )
    series = result.scalar_one_or_none()
    if not series:
        raise HTTPException(404, "Series not found")
    return series


@router.post("/{series_id}/seasons", response_model=SeasonOut)
async def create_season(
    series_id: int,
    season_number: int = Form(...),
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(require_uploader),
):
    series = await db.get(Series, series_id)
    if not series:
        raise HTTPException(404, "Series not found")

    existing = await db.execute(
        select(Season).where(Season.series_id == series_id).where(Season.season_number == season_number)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(400, f"Season {season_number} already exists for this series")

    season = Season(series_id=series_id, season_number=season_number)
    db.add(season)
    await db.commit()
    await db.refresh(season)
    return season


@router.post("/{series_id}/seasons/{season_id}/episodes", response_model=EpisodeOut)
async def upload_episode(
    series_id: int,
    season_id: int,
    episode_number: int = Form(...),
    title: str = Form(None),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(require_uploader),
):
    season = await db.get(Season, season_id)
    if not season or season.series_id != series_id:
        raise HTTPException(404, "Season not found for this series")

    existing = await db.execute(
        select(Episode).where(Episode.season_id == season_id).where(Episode.episode_number == episode_number)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(400, f"Episode {episode_number} already exists in this season")

    content = Content(
        title=title or f"Episode {episode_number}",
        status="processing",
        uploaded_by=user_id,
    )
    db.add(content)
    await db.commit()
    await db.refresh(content)

    raw_dir = settings.media_storage_path / "raw"
    raw_dir.mkdir(parents=True, exist_ok=True)
    raw_path = raw_dir / f"{content.id}_{file.filename}"
    with open(raw_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    transcode_video.delay(content.id, str(raw_path))

    episode = Episode(
        season_id=season_id,
        episode_number=episode_number,
        title=title,
        content_id=content.id,
    )
    db.add(episode)
    await db.commit()
    await db.refresh(episode)
    return episode

@router.get("/{series_id}/details")
async def get_series_full_details(
    series_id: int,
    db: AsyncSession = Depends(get_db),
    profile_id: int = Depends(get_current_profile_id),
):
    result = await db.execute(
        select(Series)
        .options(selectinload(Series.categories), selectinload(Series.seasons).selectinload(Season.episodes))
        .where(Series.id == series_id)
    )
    series = result.scalar_one_or_none()
    if not series:
        raise HTTPException(404, "Series not found")

    rating_result = await db.execute(
        select(func.count(case((Rating.value == 1, 1))), func.count(case((Rating.value == -1, 1))))
        .where(Rating.series_id == series_id)
    )
    likes, dislikes = rating_result.one()
    mine_result = await db.execute(
        select(Rating.value).where(Rating.series_id == series_id).where(Rating.profile_id == profile_id)
    )
    my_rating = mine_result.scalar_one_or_none()

    wl_result = await db.execute(
        select(Watchlist.id).where(Watchlist.profile_id == profile_id).where(Watchlist.series_id == series_id)
    )
    in_watchlist = wl_result.scalar_one_or_none() is not None

    episode_content_ids = [ep.content_id for season in series.seasons for ep in season.episodes]
    progress_map = {}
    if episode_content_ids:
        wh_result = await db.execute(
            select(WatchHistory.content_id, WatchHistory.progress_seconds)
            .where(WatchHistory.profile_id == profile_id)
            .where(WatchHistory.content_id.in_(episode_content_ids))
        )
        progress_map = {row.content_id: row.progress_seconds for row in wh_result.all()}

    return {
        "series": SeriesDetailOut.model_validate(series),
        "likes": likes or 0,
        "dislikes": dislikes or 0,
        "my_rating": my_rating,
        "in_watchlist": in_watchlist,
        "episode_progress": progress_map,
    }

@router.get("/{series_id}/similar", response_model=list[DiscoverItem])
async def get_series_similar(
    series_id: int,
    limit: int = 10,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Series).options(selectinload(Series.categories)).where(Series.id == series_id)
    )
    source = result.scalar_one_or_none()
    if not source:
        raise HTTPException(404, "Series not found")

    category_ids = [c.id for c in source.categories]
    if not category_ids:
        return []

    movie_likes = (
        select(Rating.content_id, func.sum(Rating.value).label("net_likes"))
        .where(Rating.content_id.isnot(None))
        .group_by(Rating.content_id)
        .subquery()
    )
    movie_stmt = (
        select(Content)
        .outerjoin(movie_likes, movie_likes.c.content_id == Content.id)
        .options(selectinload(Content.categories))
        .where(Content.categories.any(Category.id.in_(category_ids)))
        .where(Content.status == "ready")
        .order_by(func.coalesce(movie_likes.c.net_likes, 0).desc())
        .limit(limit)
    )
    movie_rows = (await db.execute(movie_stmt)).scalars().all()

    series_likes = (
        select(Rating.series_id, func.sum(Rating.value).label("net_likes"))
        .where(Rating.series_id.isnot(None))
        .group_by(Rating.series_id)
        .subquery()
    )
    series_stmt = (
        select(Series)
        .outerjoin(series_likes, series_likes.c.series_id == Series.id)
        .options(selectinload(Series.categories))
        .where(Series.categories.any(Category.id.in_(category_ids)))
        .where(Series.id != series_id)
        .order_by(func.coalesce(series_likes.c.net_likes, 0).desc())
        .limit(limit)
    )
    series_rows = (await db.execute(series_stmt)).scalars().all()

    combined = (
        [DiscoverItem(type="movie", id=c.id, title=c.title, poster_url=c.thumbnail_url) for c in movie_rows]
        + [DiscoverItem(type="series", id=s.id, title=s.title, poster_url=s.poster_url) for s in series_rows]
    )
    return combined[:limit]