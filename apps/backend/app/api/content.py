from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, Query

from sqlalchemy import case, select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.db import get_db
from app.core.config import settings
from app.core.auth_dep import require_uploader, get_current_profile_id

from app.models.content import Content
from app.models.watch_history import WatchHistory
from app.models.watchlist import Watchlist
from app.models.category import Category
from app.models.rating import Rating
from app.models.series import Series, Season, Episode

from app.schemas.content import ContentResponse, ContentStatusResponse
from app.schemas.discover import DiscoverItem, TrendingResponse, LatestResponse

from app.workers.tasks import transcode_video

import shutil
from datetime import datetime, timedelta

router = APIRouter(prefix="/content", tags=["content"])

@router.post("", response_model=ContentResponse)
async def upload_content(
    title: str = Form(...),
    description: str = Form(None),
    category_names: str = Form(None),
    file: UploadFile = File(...),
    poster: UploadFile = File(None),
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(require_uploader),
):
    content = Content(title=title, description=description, status="processing", uploaded_by=user_id)

    if category_names:
        names = [n.strip() for n in category_names.split(",") if n.strip()]
        if names:
            result = await db.execute(select(Category).where(Category.name.in_(names)))
            content.categories = result.scalars().all()

    db.add(content)
    await db.commit()
    await db.refresh(content, attribute_names=["categories"])

    raw_dir = settings.media_storage_path / "raw"
    raw_dir.mkdir(parents=True, exist_ok=True)
    raw_path = raw_dir / f"{content.id}_{file.filename}"
    with open(raw_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    if poster:
        poster_dir = settings.media_storage_path / str(content.id)
        poster_dir.mkdir(parents=True, exist_ok=True)
        ext = poster.filename.split(".")[-1] if "." in poster.filename else "jpg"
        poster_path = poster_dir / f"poster.{ext}"
        with open(poster_path, "wb") as f:
            shutil.copyfileobj(poster.file, f)
        content.thumbnail_url = f"/media/{content.id}/poster.{ext}"
        await db.commit()

    transcode_video.delay(content.id, str(raw_path))

    return content

@router.get("/{content_id}/status", response_model=ContentStatusResponse)
async def get_status(content_id: int, db: AsyncSession = Depends(get_db)):
    content = await db.get(Content, content_id)
    return ContentStatusResponse(id=content.id, status=content.status)

@router.get("", response_model=list[ContentResponse])
async def list_content(q: str | None = None, category: list[str] |  None = Query(None), db: AsyncSession = Depends(get_db)):
    
    stmt = select(Content).options(selectinload(Content.categories))

    if category:
        stmt = stmt.where(Content.categories.any(Category.name.in_(category)))

    if q:
        rank = case(
            (Content.title.ilike(q), 0),
            (Content.title.ilike(f"%{q}%"), 1),
            else_=2,
        )
        stmt = stmt.where(Content.title.ilike(f"%{q}%")).order_by(rank, Content.title)
    else:
        stmt = stmt.order_by(Content.created_at.desc())

    result = await db.execute(stmt)
    return result.scalars().all()

@router.get("/trending", response_model=TrendingResponse)
async def get_trending(
    days: int = 7,
    limit: int = 10,
    db: AsyncSession = Depends(get_db),
):
    since = datetime.utcnow() - timedelta(days=days)
    episode_content_ids_subq = select(Episode.content_id)

    movie_views = (
        select(WatchHistory.content_id, func.count(WatchHistory.id).label("views"))
        .where(WatchHistory.last_watched_at >= since)
        .group_by(WatchHistory.content_id)
        .subquery()
    )
    movie_likes = (
        select(Rating.content_id, func.sum(Rating.value).label("net_likes"))
        .where(Rating.content_id.isnot(None))
        .group_by(Rating.content_id)
        .subquery()
    )
    movie_score = (func.coalesce(movie_views.c.views, 0) * 2) + func.coalesce(movie_likes.c.net_likes, 0)

    movie_stmt = (
        select(Content.id, Content.title, Content.thumbnail_url, movie_score.label("score"))
        .outerjoin(movie_views, movie_views.c.content_id == Content.id)
        .outerjoin(movie_likes, movie_likes.c.content_id == Content.id)
        .where(Content.status == "ready")
        .where(Content.id.notin_(episode_content_ids_subq))
        .where(movie_views.c.views.isnot(None))
    )
    movie_rows = (await db.execute(movie_stmt)).all()

    ep_to_series = (
        select(Episode.content_id, Season.series_id)
        .join(Season, Season.id == Episode.season_id)
        .subquery()
    )
    series_views = (
        select(ep_to_series.c.series_id, func.count(WatchHistory.id).label("views"))
        .join(WatchHistory, WatchHistory.content_id == ep_to_series.c.content_id)
        .where(WatchHistory.last_watched_at >= since)
        .group_by(ep_to_series.c.series_id)
        .subquery()
    )
    series_likes = (
        select(Rating.series_id, func.sum(Rating.value).label("net_likes"))
        .where(Rating.series_id.isnot(None))
        .group_by(Rating.series_id)
        .subquery()
    )
    series_score = (func.coalesce(series_views.c.views, 0) * 2) + func.coalesce(series_likes.c.net_likes, 0)

    series_stmt = (
        select(Series.id, Series.title, Series.poster_url, series_score.label("score"))
        .outerjoin(series_views, series_views.c.series_id == Series.id)
        .outerjoin(series_likes, series_likes.c.series_id == Series.id)
        .where(series_views.c.views.isnot(None))
    )
    series_rows = (await db.execute(series_stmt)).all()

    movie_items = sorted(
        [(r.score or 0, DiscoverItem(type="movie", id=r.id, title=r.title, poster_url=r.thumbnail_url)) for r in movie_rows],
        key=lambda x: x[0], reverse=True,
    )
    series_items = sorted(
        [(r.score or 0, DiscoverItem(type="series", id=r.id, title=r.title, poster_url=r.poster_url)) for r in series_rows],
        key=lambda x: x[0], reverse=True,
    )
    overall = sorted(movie_items + series_items, key=lambda x: x[0], reverse=True)

    return TrendingResponse(
        movies=[item for _, item in movie_items[:limit]],
        series=[item for _, item in series_items[:limit]],
        overall=[item for _, item in overall[:limit]],
    )
   
@router.get("/latest", response_model=LatestResponse)
async def get_latest(
    limit: int = 10,
    db: AsyncSession = Depends(get_db),
):
    episode_content_ids_subq = select(Episode.content_id)

    movie_stmt = (
        select(Content.id, Content.title, Content.thumbnail_url, Content.created_at)
        .where(Content.status == "ready")
        .where(Content.id.notin_(episode_content_ids_subq))
        .order_by(Content.created_at.desc())
    )
    movie_rows = (await db.execute(movie_stmt)).all()

    series_stmt = (
        select(Series.id, Series.title, Series.poster_url, Series.created_at)
        .order_by(Series.created_at.desc())
    )
    series_rows = (await db.execute(series_stmt)).all()

    movie_items = [
        (r.created_at, DiscoverItem(type="movie", id=r.id, title=r.title, poster_url=r.thumbnail_url))
        for r in movie_rows
    ]
    series_items = [
        (r.created_at, DiscoverItem(type="series", id=r.id, title=r.title, poster_url=r.poster_url))
        for r in series_rows
    ]
    overall = sorted(movie_items + series_items, key=lambda x: x[0], reverse=True)

    return LatestResponse(
        movies=[item for _, item in movie_items[:limit]],
        series=[item for _, item in series_items[:limit]],
        overall=[item for _, item in overall[:limit]],
    )

@router.get("/{content_id}/similar", response_model=list[DiscoverItem])
async def get_similar(
    content_id: int,
    limit: int = 10,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Content).options(selectinload(Content.categories)).where(Content.id == content_id)
    )
    source = result.scalar_one_or_none()
    if not source:
        raise HTTPException(404, "Content not found")

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
        .where(Content.id != content_id)
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
        .order_by(func.coalesce(series_likes.c.net_likes, 0).desc())
        .limit(limit)
    )
    series_rows = (await db.execute(series_stmt)).scalars().all()

    combined = (
        [DiscoverItem(type="movie", id=c.id, title=c.title, poster_url=c.thumbnail_url) for c in movie_rows]
        + [DiscoverItem(type="series", id=s.id, title=s.title, poster_url=s.poster_url) for s in series_rows]
    )
    return combined[:limit]

@router.get("/{content_id}/details")
async def get_content_details(
    content_id: int,
    db: AsyncSession = Depends(get_db),
    profile_id: int = Depends(get_current_profile_id),
):
    result = await db.execute(
        select(Content).options(selectinload(Content.categories)).where(Content.id == content_id)
    )
    content = result.scalar_one_or_none()
    if not content:
        raise HTTPException(404, "Content not found")

    rating_result = await db.execute(
        select(func.count(case((Rating.value == 1, 1))), func.count(case((Rating.value == -1, 1))))
        .where(Rating.content_id == content_id)
    )
    likes, dislikes = rating_result.one()
    mine_result = await db.execute(
        select(Rating.value).where(Rating.content_id == content_id).where(Rating.profile_id == profile_id)
    )
    my_rating = mine_result.scalar_one_or_none()

    wl_result = await db.execute(
        select(Watchlist.id).where(Watchlist.profile_id == profile_id).where(Watchlist.content_id == content_id)
    )
    in_watchlist = wl_result.scalar_one_or_none() is not None

    wh_result = await db.execute(
        select(WatchHistory.progress_seconds).where(WatchHistory.profile_id == profile_id).where(WatchHistory.content_id == content_id)
    )
    resume_progress = wh_result.scalar_one_or_none()

    category_ids = [c.id for c in content.categories]
    similar = []
    if category_ids:
        sim_result = await db.execute(
            select(Content)
            .options(selectinload(Content.categories))
            .where(Content.categories.any(Category.id.in_(category_ids)))
            .where(Content.id != content_id)
            .where(Content.status == "ready")
            .limit(10)
        )
        similar = sim_result.scalars().all()

    return {
        "content": ContentResponse.model_validate(content),
        "likes": likes or 0,
        "dislikes": dislikes or 0,
        "my_rating": my_rating,
        "in_watchlist": in_watchlist,
        "resume_progress_seconds": resume_progress,
        "similar": [ContentResponse.model_validate(c) for c in similar],
    }

@router.get("/{content_id}", response_model=ContentResponse)
async def get_content(content_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Content).options(selectinload(Content.categories)).where(Content.id == content_id)
    )
    content = result.scalar_one_or_none()
    if not content:
        raise HTTPException(404, "Content not found")
    return content

@router.delete("/{content_id}")
async def delete_content(
    content_id: int,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(require_uploader)
):
    content = await db.get(Content, content_id)
    if not content:
        raise HTTPException(404, "Content not found")

    content_dir = settings.media_storage_path / str(content_id)
    if content_dir.exists():
        shutil.rmtree(content_dir)

    raw_dir = settings.media_storage_path / "raw"
    if raw_dir.exists():
        for f in raw_dir.glob(f"{content_id}_*"):
            f.unlink()
        
    await db.delete(content)
    await db.commit()
    return {"status": "deleted"}