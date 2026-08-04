from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.category import Category

async def resolve_category_ids(db: AsyncSession, category_ids: str | None, category_names: str | None) -> list[int]:
    ids = []
    if category_ids:
        ids.extend([int(x) for x in category_ids.split(",") if x.strip()])
    if category_names:
        names = [n.strip() for n in category_names.split(",") if n.strip()]
        if names:
            result = await db.execute(select(Category.id).where(Category.name.in_(names)))
            ids.extend(result.scalars().all())
    return list(set(ids))
