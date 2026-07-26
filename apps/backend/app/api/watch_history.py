from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.dialects.postgresql import insert as pg_insert

from app.core.db import get_db
from app.core.auth_dep import get_current_profile_id
from app.models.watch_history import WatchHistory
from app.models.content import Content
from app.schemas.history import WatchProgressIn, WatchHistoryOut

from datetime import datetime

router = APIRouter(prefix="/watch-history", tags=["watch-history"])

@router.post("")
async def update_progress(
    payload: WatchProgressIn,
    db: AsyncSession = Depends(get_db),
    profile_id: int = Depends(get_current_profile_id),
):
    stmt = pg_insert(WatchHistory).values(
        profile_id=profile_id,
        content_id=payload.content_id,
        progress_seconds=payload.progress_seconds,
        duration_seconds=payload.duration_seconds,
    )
    stmt = stmt.on_conflict_do_update(
        index_elements=["profile_id", "content_id"],
        set_={
            "progress_seconds": payload.progress_seconds,
            "duration_seconds": payload.duration_seconds,
            "last_watched_at": datetime.utcnow(),
        },
    )
    await db.execute(stmt)
    await db.commit()
    return {"status": "ok"}

@router.get("", response_model=list[WatchHistoryOut])
async def get_continue_watching(
    db: AsyncSession = Depends(get_db),
    profile_id: int = Depends(get_current_profile_id),
):
    result = await db.execute(
        select(WatchHistory.content_id, Content.title, WatchHistory.progress_seconds, WatchHistory.duration_seconds, WatchHistory.last_watched_at)
        .join(Content, Content.id == WatchHistory.content_id)
        .where(WatchHistory.profile_id == profile_id)
        .where(Content.status == "ready")
        .order_by(WatchHistory.last_watched_at.desc())
        .limit(20)
    )
    return result.mappings().all()

@router.delete("/{content_id}")
async def delete_watch_history_item(
    content_id: int,
    db: AsyncSession = Depends(get_db),
    profile_id: int = Depends(get_current_profile_id),
):
    result = await db.execute(
        delete(WatchHistory)
        .where(WatchHistory.profile_id == profile_id)
        .where(WatchHistory.content_id == content_id)
    )
    await db.commit()
    if result.rowcount == 0:
        raise HTTPException(404, "No watch history for this content")
    return {"status": "deleted"}

@router.delete("")
async def clear_watch_history(
    db: AsyncSession = Depends(get_db),
    profile_id: int = Depends(get_current_profile_id),
):
    await db.execute(
        delete(WatchHistory).where(WatchHistory.profile_id == profile_id)
    )
    await db.commit()
    return {"status": "cleared"}