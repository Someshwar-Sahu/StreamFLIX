from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.db import get_db
from app.core.auth_dep import require_uploader
from app.models.category import Category
from app.models.content import Content
from app.models.series import Series
from app.schemas.category import CategoryResponse, CategoryCreate

router = APIRouter(prefix="/categories", tags=["categories"])

CLEAN_CATEGORIES = [
  "Action",
  "Thriller",
  "Sci-Fi",
  "Fantasy",
  "Comedy",
  "Drama",
  "Romance",
  "Horror",
  "Mystery",
  "Adventure",
  "Animation",
  "Anime",
  "Crime",
  "Documentary",
  "Family",
  "History",
  "Music",
  "Superhero",
  "War",
  "Western",
  "Biopic",
  "Short Film",
  "Sports",
  "Reality TV",
  "K-Drama"
]

DEPRECATED_COMBINED_NAMES = [
  "Action & Thrillers",
  "Sci-Fi & Fantasy",
  "Drama & Romance",
  "Animation & Anime",
  "Comedies",
  "Documentaries"
]

@router.get("", response_model=list[CategoryResponse])
async def list_categories(db: AsyncSession = Depends(get_db)):
    # Safely disassociate old deprecated categories from content/series before deletion
    dep_res = await db.execute(select(Category).where(Category.name.in_(DEPRECATED_COMBINED_NAMES)))
    deprecated_cats = dep_res.scalars().all()
    if deprecated_cats:
        for cat in deprecated_cats:
            await db.delete(cat)
        try:
            await db.commit()
        except Exception:
            await db.rollback()

    result = await db.execute(select(Category).order_by(Category.name))
    categories = result.scalars().all()
    
    # Ensure all 25 clean distinct categories exist
    existing_names = {c.name for c in categories}
    needed = [name for name in CLEAN_CATEGORIES if name not in existing_names]
    if needed:
        for name in needed:
            db.add(Category(name=name))
        await db.commit()
        result = await db.execute(select(Category).order_by(Category.name))
        categories = result.scalars().all()

    return categories

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

@router.delete("/{category_id}")
async def delete_category(
    category_id: int,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(require_uploader)
):
    cat = await db.get(Category, category_id)
    if not cat:
        raise HTTPException(404, "Category not found")
    await db.delete(cat)
    await db.commit()
    return {"status": "deleted"}