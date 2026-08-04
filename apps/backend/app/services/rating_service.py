from sqlalchemy import select, func, case
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.rating import Rating

async def get_content_rating_summary(db: AsyncSession, content_id: int, profile_id: int | None = None):
    rating_result = await db.execute(
        select(
            func.count(case((Rating.value == 1, 1))),
            func.count(case((Rating.value == -1, 1)))
        )
        .where(Rating.content_id == content_id)
    )
    likes, dislikes = rating_result.one()

    my_rating = None
    if profile_id:
        mine_result = await db.execute(
            select(Rating.value)
            .where(Rating.content_id == content_id)
            .where(Rating.profile_id == profile_id)
        )
        my_rating = mine_result.scalar_one_or_none()

    return {
        "likes": likes or 0,
        "dislikes": dislikes or 0,
        "my_rating": my_rating
    }
