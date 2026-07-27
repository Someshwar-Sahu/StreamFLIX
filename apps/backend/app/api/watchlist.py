from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.dialects.postgresql import insert as pg_insert

from app.core.db import get_db
from app.core.auth_dep import get_current_profile_id
from app.models.watchlist import Watchlist
from app.models.content import Content
from app.models.series import Series
from app.schemas.watchlist import WatchlistAddIn, WatchlistOut

router = APIRouter(prefix="/watchlist", tags=["watchlist"])


@router.post("")
async def add_to_watchlist(
    payload: WatchlistAddIn,
    db: AsyncSession = Depends(get_db),
    profile_id: int = Depends(get_current_profile_id),
):
    if payload.content_id is not None:
        stmt = pg_insert(Watchlist).values(
            profile_id=profile_id, content_id=payload.content_id, series_id=None,
        ).on_conflict_do_nothing(
            index_elements=["profile_id", "content_id"],
            index_where=Watchlist.content_id.isnot(None),
        )
    else:
        stmt = pg_insert(Watchlist).values(
            profile_id=profile_id, content_id=None, series_id=payload.series_id,
        ).on_conflict_do_nothing(
            index_elements=["profile_id", "series_id"],
            index_where=Watchlist.series_id.isnot(None),
        )
    await db.execute(stmt)
    await db.commit()
    return {"status": "added"}

@router.get("", response_model=list[WatchlistOut])
async def get_watchlist(
    db: AsyncSession = Depends(get_db),
    profile_id: int = Depends(get_current_profile_id),
):
    movie_result = await db.execute(
        select(Watchlist.content_id, Content.title, Content.thumbnail_url, Watchlist.added_at)
        .join(Content, Content.id == Watchlist.content_id)
        .where(Watchlist.profile_id == profile_id)
        .where(Watchlist.content_id.isnot(None))
        .where(Content.status == "ready")
    )
    movies = [
        WatchlistOut(type="movie", id=row.content_id, title=row.title, poster_url=row.thumbnail_url, added_at=row.added_at)
        for row in movie_result.all()
    ]

    series_result = await db.execute(
        select(Watchlist.series_id, Series.title, Series.poster_url, Watchlist.added_at)
        .join(Series, Series.id == Watchlist.series_id)
        .where(Watchlist.profile_id == profile_id)
        .where(Watchlist.series_id.isnot(None))
    )
    series_items = [
        WatchlistOut(type="series", id=row.series_id, title=row.title, poster_url=row.poster_url, added_at=row.added_at)
        for row in series_result.all()
    ]

    combined = movies + series_items
    combined.sort(key=lambda x: x.added_at, reverse=True)
    return combined


@router.delete("/content/{content_id}")
async def remove_movie_from_watchlist(
    content_id: int,
    db: AsyncSession = Depends(get_db),
    profile_id: int = Depends(get_current_profile_id),
):
    result = await db.execute(
        delete(Watchlist).where(Watchlist.profile_id == profile_id).where(Watchlist.content_id == content_id)
    )
    await db.commit()
    if result.rowcount == 0:
        raise HTTPException(404, "Not in watchlist")
    return {"status": "removed"}


@router.delete("/series/{series_id}")
async def remove_series_from_watchlist(
    series_id: int,
    db: AsyncSession = Depends(get_db),
    profile_id: int = Depends(get_current_profile_id),
):
    result = await db.execute(
        delete(Watchlist).where(Watchlist.profile_id == profile_id).where(Watchlist.series_id == series_id)
    )
    await db.commit()
    if result.rowcount == 0:
        raise HTTPException(404, "Not in watchlist")
    return {"status": "removed"}