from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.dialects.postgresql import insert as pg_insert

from app.core.db import get_db
from app.core.auth_dep import get_current_profile_id
from app.models.watchlist import Watchlist
from app.models.content import Content
from app.schemas.watchlist import WatchlistAddIn, WatchlistOut

router = APIRouter(prefix="/watchlist", tags=["watchlist"])


@router.post("")
async def add_to_watchlist(
    payload: WatchlistAddIn,
    db: AsyncSession = Depends(get_db),
    profile_id: int = Depends(get_current_profile_id),
):
    stmt = pg_insert(Watchlist).values(
        profile_id=profile_id,
        content_id=payload.content_id,
    ).on_conflict_do_nothing(index_elements=["profile_id", "content_id"])
    await db.execute(stmt)
    await db.commit()
    return {"status": "added"}


@router.get("", response_model=list[WatchlistOut])
async def get_watchlist(
    db: AsyncSession = Depends(get_db),
    profile_id: int = Depends(get_current_profile_id),
):
    result = await db.execute(
        select(Watchlist.content_id, Content.title, Watchlist.added_at)
        .join(Content, Content.id == Watchlist.content_id)
        .where(Watchlist.profile_id == profile_id)
        .where(Content.status == "ready")
        .order_by(Watchlist.added_at.desc())
    )
    return result.mappings().all()


@router.delete("/{content_id}")
async def remove_from_watchlist(
    content_id: int,
    db: AsyncSession = Depends(get_db),
    profile_id: int = Depends(get_current_profile_id),
):
    result = await db.execute(
        delete(Watchlist)
        .where(Watchlist.profile_id == profile_id)
        .where(Watchlist.content_id == content_id)
    )
    await db.commit()
    if result.rowcount == 0:
        raise HTTPException(404, "Not in watchlist")
    return {"status": "removed"}