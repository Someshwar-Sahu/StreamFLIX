from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.db import get_db
from app.models.content import Content
from app.models.series import Series, Season, Episode
from app.models.watch_history import WatchHistory
from app.models.rating import Rating
from app.models.category import Category
from app.schemas.discover import DiscoverItem, TrendingResponse, LatestResponse

router = APIRouter(prefix="/content", tags=["discover"])

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
    )
    series_rows = (await db.execute(series_stmt)).all()

    movie_items = sorted(
        [(r.score or 0, DiscoverItem(type="movie", id=r.id, title=r.title or "Untitled", poster_url=r.thumbnail_url)) for r in movie_rows],
        key=lambda x: x[0], reverse=True,
    )
    series_items = sorted(
        [(r.score or 0, DiscoverItem(type="series", id=r.id, title=r.title or "Untitled", poster_url=r.poster_url)) for r in series_rows],
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
