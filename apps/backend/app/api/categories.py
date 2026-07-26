from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import  AsyncSession

from app.core.db import get_db
from app.core.auth_dep import require_uploader
from app.models.category import Category
from app.schemas.category import CategoryResponse, CategoryCreate

router = APIRouter(prefix="/categories", tags=["categories"])

@router.get("", response_model=list[CategoryResponse])
async def list_categories(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Category).order_by(Category.name))
    return result.scalars().all()

@router.post("", response_model=CategoryResponse)
async def create_category(
    payload: CategoryCreate,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(require_uploader)
):
    existing = await db.execute(select(Category).where(Category.name == payload.name))
    if existing.scalar_one_or_none():
        raise HTTPException(400, "Category already exists")
    category = Category(name=payload.name)
    db.add(category)
    await db.commit()
    await db.refresh(category)
    return category