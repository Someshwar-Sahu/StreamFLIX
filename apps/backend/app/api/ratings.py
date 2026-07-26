from fastapi import APIRouter, Depends
from sqlalchemy import select, delete, func, case
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.dialects.postgresql import insert as pg_insert

from app.core.db import get_db
from app.core.auth_dep import get_current_profile_id
from app.models.rating import Rating
from app.schemas.rating import RatingIn, RatingSummary

router = APIRouter(prefix="/ratings", tags=["ratings"])


@router.post("")
async def rate_content(
    payload: RatingIn,
    db: AsyncSession = Depends(get_db),
    profile_id: int = Depends(get_current_profile_id),
):
    stmt = pg_insert(Rating).values(
        profile_id=profile_id,
        content_id=payload.content_id,
        value=payload.value,
    )
    stmt = stmt.on_conflict_do_update(
        index_elements=["profile_id", "content_id"],
        set_={"value": payload.value},
    )
    await db.execute(stmt)
    await db.commit()
    return {"status": "ok"}


@router.delete("/{content_id}")
async def remove_rating(
    content_id: int,
    db: AsyncSession = Depends(get_db),
    profile_id: int = Depends(get_current_profile_id),
):
    await db.execute(
        delete(Rating).where(Rating.profile_id == profile_id).where(Rating.content_id == content_id)
    )
    await db.commit()
    return {"status": "removed"}


@router.get("/{content_id}", response_model=RatingSummary)
async def get_rating_summary(
    content_id: int,
    db: AsyncSession = Depends(get_db),
    profile_id: int = Depends(get_current_profile_id),
):
    result = await db.execute(
        select(
            func.count(case((Rating.value == 1, 1))),
            func.count(case((Rating.value == -1, 1))),
        ).where(Rating.content_id == content_id)
    )
    likes, dislikes = result.one()

    mine_result = await db.execute(
        select(Rating.value)
        .where(Rating.content_id == content_id)
        .where(Rating.profile_id == profile_id)
    )
    mine = mine_result.scalar_one_or_none()

    return RatingSummary(content_id=content_id, likes=likes or 0, dislikes=dislikes or 0, my_rating=mine)