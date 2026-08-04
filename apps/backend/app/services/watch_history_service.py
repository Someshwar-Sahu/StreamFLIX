from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.watch_history import WatchHistory

async def get_resume_progress(db: AsyncSession, profile_id: int, content_id: int) -> int | None:
    result = await db.execute(
        select(WatchHistory.progress_seconds)
        .where(WatchHistory.profile_id == profile_id)
        .where(WatchHistory.content_id == content_id)
    )
    return result.scalar_one_or_none()
