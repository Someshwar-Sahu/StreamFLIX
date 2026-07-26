from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, Query

from sqlalchemy import case, select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.db import get_db
from app.core.config import settings

from app.models.content import Content
from app.models.watch_history import WatchHistory
from app.models.category import Category
from app.models.rating import Rating

from app.schemas.content import ContentResponse, ContentStatusResponse
from app.core.auth_dep import require_uploader

from app.workers.tasks import transcode_video

import shutil
from datetime import datetime, timedelta

router = APIRouter(prefix="/content", tags=["content"])

@router.post("", response_model=ContentResponse)
async def upload_content(
    title: str = Form(...),
    description: str = Form(None),
    category_names: str = Form(None),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(require_uploader),
):
    content = Content(title=title, description=description, status="processing", uploaded_by=user_id)

    if category_names: 
        names = [n.strip() for n in category_names.split(",") if n.strip()]
        if names:
            result = await db.execute(select(Category).where(Category.name.in_(names)))
            content.categories = result.scalars().all()
    
    db.add(content)
    await db.commit()
    await db.refresh(content, attribute_names=["categories"])

    raw_dir = settings.media_storage_path / "raw"
    raw_dir.mkdir(parents=True, exist_ok=True)
    raw_path = raw_dir / f"{content.id}_{file.filename}"
    with open(raw_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    transcode_video.delay(content.id, str(raw_path))

    return content

@router.get("/{content_id}/status", response_model=ContentStatusResponse)
async def get_status(content_id: int, db: AsyncSession = Depends(get_db)):
    content = await db.get(Content, content_id)
    return ContentStatusResponse(id=content.id, status=content.status)

@router.get("", response_model=list[ContentResponse])
async def list_content(q: str | None = None, category: list[str] |  None = Query(None), db: AsyncSession = Depends(get_db)):
    
    stmt = select(Content).options(selectinload(Content.categories))

    if category:
        stmt = stmt.where(Content.categories.any(Category.name.in_(category)))

    if q:
        rank = case(
            (Content.title.ilike(q), 0),
            (Content.title.ilike(f"%{q}%"), 1),
            else_=2,
        )
        stmt = stmt.where(Content.title.ilike(f"%{q}%")).order_by(rank, Content.title)
    else:
        stmt = stmt.order_by(Content.created_at.desc())

    result = await db.execute(stmt)
    return result.scalars().all()

@router.get("/trending", response_model=list[ContentResponse])
async def get_trending(
    days: int = 7,
    limit: int = 10,
    db: AsyncSession = Depends(get_db),
):
    since = datetime.utcnow() - timedelta(days=days)

    view_counts = (
        select(WatchHistory.content_id, func.count(WatchHistory.id).label("views"))
        .where(WatchHistory.last_watched_at >= since)
        .group_by(WatchHistory.content_id)
        .subquery()
    )
    rating_scores = (
        select(Rating.content_id, func.sum(Rating.value).label("net_likes"))
        .group_by(Rating.content_id)
        .subquery()
    )

    score = (func.coalesce(view_counts.c.views, 0) * 2) + func.coalesce(rating_scores.c.net_likes, 0)

    stmt = (
        select(Content)
        .outerjoin(view_counts, view_counts.c.content_id == Content.id)
        .outerjoin(rating_scores, rating_scores.c.content_id == Content.id)
        .options(selectinload(Content.categories))
        .where(Content.status == "ready")
        .where(view_counts.c.views.isnot(None)) 
        .order_by(score.desc())
        .limit(limit)
    )
    result = await db.execute(stmt)
    return result.scalars().all()

@router.get("/latest", response_model=list[ContentResponse])
async def get_latest(
    limit: int = 10,
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(Content)
        .options(selectinload(Content.categories))
        .where(Content.status == "ready")
        .order_by(Content.created_at.desc())
        .limit(limit)
    )
    result = await db.execute(stmt)
    return result.scalars().all()

@router.get("/{content_id}/similar", response_model=list[ContentResponse])
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

    rating_scores = (
        select(Rating.content_id, func.sum(Rating.value).label("net_likes"))
        .group_by(Rating.content_id)
        .subquery()
    )

    stmt = (
        select(Content)
        .outerjoin(rating_scores, rating_scores.c.content_id == Content.id)
        .options(selectinload(Content.categories))
        .where(Content.categories.any(Category.id.in_(category_ids)))
        .where(Content.id != content_id)
        .where(Content.status == "ready")
        .order_by(func.coalesce(rating_scores.c.net_likes, 0).desc())
        .limit(limit)
    )
    result = await db.execute(stmt)
    return result.scalars().all()

@router.get("/{content_id}", response_model=ContentResponse)
async def get_content(content_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Content).options(selectinload(Content.categories)).where(Content.id == content_id)
    )
    content = result.scalar_one_or_none()
    if not content:
        raise HTTPException(404, "Content not found")
    return content

@router.delete("/{content_id}")
async def delete_content(
    content_id: int,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(require_uploader)
):
    content = await db.get(Content, content_id)
    if not content:
        raise HTTPException(404, "Content not found")

    content_dir = settings.media_storage_path / str(content_id)
    if content_dir.exists():
        shutil.rmtree(content_dir)

    raw_dir = settings.media_storage_path / "raw"
    if raw_dir.exists():
        for f in raw_dir.glob(f"{content_id}_*"):
            f.unlink()
        
    await db.delete(content)
    await db.commit()
    return {"status": "deleted"}