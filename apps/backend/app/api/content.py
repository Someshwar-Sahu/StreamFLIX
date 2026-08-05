import shutil
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, Query, BackgroundTasks
from sqlalchemy import case, select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.db import get_db
from app.core.config import settings
from app.core.auth_dep import require_uploader, get_current_profile_id, get_current_user_role

from app.models.content import Content, ContentVariant
from app.models.watch_history import WatchHistory
from app.models.watchlist import Watchlist
from app.models.category import Category
from app.models.rating import Rating
from app.models.series import Episode

from app.schemas.content import ContentResponse, ContentStatusResponse

from app.services.storage import storage_manager
from app.services.category_service import resolve_category_ids
from app.services.rating_service import get_content_rating_summary
from app.services.watch_history_service import get_resume_progress
from app.workers.tasks import process_master_upload

from pydantic import BaseModel
from datetime import datetime

class PresignedUploadRequest(BaseModel):
    title: str
    description: str | None = None
    categoryNames: str | None = None
    filename: str
    file_size: int
    content_type: str = "video/mp4"

router = APIRouter(prefix="/content", tags=["content"])

@router.post("/presigned-upload-url")
async def get_presigned_upload_url(
    payload: PresignedUploadRequest,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(require_uploader),
):
    incoming_bytes = payload.file_size
    s3_key = f"raw/{int(datetime.utcnow().timestamp())}_{payload.filename}"
    
    presigned = storage_manager.generate_presigned_upload(s3_key, incoming_bytes, payload.content_type)
    
    content = Content(
        title=payload.title,
        description=payload.description,
        status="uploading",
        uploaded_by=user_id,
    )
    db.add(content)
    await db.commit()
    await db.refresh(content)

    resolved_ids = await resolve_category_ids(db, None, payload.categoryNames)
    if resolved_ids:
        categories = (await db.execute(select(Category).where(Category.id.in_(resolved_ids)))).scalars().all()
        content.categories = categories
        await db.commit()

    if presigned:
        return {
            "direct_b2": True,
            "content_id": content.id,
            "upload_url": presigned["upload_url"],
            "s3_key": presigned["s3_key"],
            "relative_path": presigned["relative_path"],
        }
    else:
        return {
            "direct_b2": False,
            "content_id": content.id,
            "upload_url": f"/content/{content.id}/proxy-upload",
        }

@router.post("/{content_id}/complete-direct-upload")
async def complete_direct_upload(
    content_id: int,
    background_tasks: BackgroundTasks,
    s3_path: str = Form(...),
    poster: UploadFile | None = File(None),
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(require_uploader),
):
    content = await db.get(Content, content_id)
    if not content:
        raise HTTPException(404, "Content not found")
    
    content.status = "processing"
    
    if poster:
        poster_dir = settings.media_storage_path / str(content.id)
        poster_dir.mkdir(parents=True, exist_ok=True)
        ext = poster.filename.split(".")[-1] if "." in poster.filename else "jpg"
        poster_path = poster_dir / f"poster.{ext}"
        CHUNK_SIZE = 8 * 1024 * 1024
        with open(poster_path, "wb") as f:
            while True:
                chunk = await poster.read(CHUNK_SIZE)
                if not chunk:
                    break
                f.write(chunk)
        content.thumbnail_url = f"/media/{content.id}/poster.{ext}"
    
    await db.commit()
    
    background_tasks.add_task(process_master_upload, content.id, s3_path)
    
    res = await db.execute(
        select(Content).options(selectinload(Content.categories)).where(Content.id == content.id)
    )
    return res.scalar_one()

@router.delete("/{content_id}/cancel-upload")
async def cancel_upload(
    content_id: int,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(require_uploader),
):
    content = await db.get(Content, content_id)
    if content:
        await db.delete(content)
        await db.commit()
    return {"status": "cancelled"}

@router.post("", response_model=ContentResponse)
async def upload_content(
    background_tasks: BackgroundTasks,
    title: str = Form(...),
    description: str | None = Form(None),
    category_ids: str | None = Form(None),
    categoryNames: str | None = Form(None),
    file: UploadFile = File(...),
    poster: UploadFile | None = File(None),
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(require_uploader),
):
    incoming_bytes = file.size or 0
    active_bucket = storage_manager.get_available_storage_bucket(incoming_bytes)
    if not active_bucket:
        raise HTTPException(status_code=400, detail="Upload blocked: Total free storage cap across Backblaze B2 buckets reached. Please add a new free bucket.")
    
    content = Content(
        title=title,
        description=description,
        status="processing",
        uploaded_by=user_id,
    )
    db.add(content)
    await db.commit()
    await db.refresh(content)

    resolved_ids = await resolve_category_ids(db, category_ids, categoryNames)
    if resolved_ids:
        categories = (await db.execute(select(Category).where(Category.id.in_(resolved_ids)))).scalars().all()
        content.categories = categories
        await db.commit()

    raw_dir = settings.media_storage_path / "raw"
    raw_dir.mkdir(parents=True, exist_ok=True)
    raw_path = raw_dir / f"{content.id}_{file.filename}"
    
    CHUNK_SIZE = 8 * 1024 * 1024
    with open(raw_path, "wb") as f:
        while True:
            chunk = await file.read(CHUNK_SIZE)
            if not chunk:
                break
            f.write(chunk)

    if poster:
        poster_dir = settings.media_storage_path / str(content.id)
        poster_dir.mkdir(parents=True, exist_ok=True)
        ext = poster.filename.split(".")[-1] if "." in poster.filename else "jpg"
        poster_path = poster_dir / f"poster.{ext}"
        with open(poster_path, "wb") as f:
            while True:
                chunk = await poster.read(CHUNK_SIZE)
                if not chunk:
                    break
                f.write(chunk)
        content.thumbnail_url = f"/media/{content.id}/poster.{ext}"
        await db.commit()

    background_tasks.add_task(process_master_upload, content.id, str(raw_path))

    res = await db.execute(
        select(Content).options(selectinload(Content.categories)).where(Content.id == content.id)
    )
    return res.scalar_one()


@router.get("/{content_id}/status", response_model=ContentStatusResponse)
async def get_status(content_id: int, db: AsyncSession = Depends(get_db)):
    content = await db.get(Content, content_id)
    if not content:
        raise HTTPException(404, "Content not found")
    return ContentStatusResponse(id=content.id, status=content.status)


@router.get("", response_model=list[ContentResponse])
async def list_content(
    q: str | None = None,
    category: list[str] | None = Query(None),
    include_episodes: bool = False,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Content).options(selectinload(Content.categories)).distinct()

    if not include_episodes and not q:
        episode_content_ids_subq = select(Episode.content_id)
        stmt = stmt.where(Content.id.notin_(episode_content_ids_subq))

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
    return result.scalars().unique().all()


@router.get("/{content_id}/details")
async def get_content_details(
    content_id: int,
    db: AsyncSession = Depends(get_db),
    profile_id: int = Depends(get_current_profile_id),
):
    result = await db.execute(
        select(Content).options(selectinload(Content.categories)).where(Content.id == content_id)
    )
    content = result.scalar_one_or_none()
    if not content:
        raise HTTPException(404, "Content not found")

    ratings = await get_content_rating_summary(db, content_id, profile_id)
    resume_progress = await get_resume_progress(db, profile_id, content_id)

    wl_result = await db.execute(
        select(Watchlist.id).where(Watchlist.profile_id == profile_id).where(Watchlist.content_id == content_id)
    )
    in_watchlist = wl_result.scalar_one_or_none() is not None

    category_ids = [c.id for c in content.categories]
    similar = []
    if category_ids:
        sim_result = await db.execute(
            select(Content)
            .options(selectinload(Content.categories))
            .where(Content.categories.any(Category.id.in_(category_ids)))
            .where(Content.id != content_id)
            .where(Content.status == "ready")
            .limit(10)
        )
        similar = sim_result.scalars().all()

    return {
        "content": ContentResponse.model_validate(content),
        "likes": ratings["likes"],
        "dislikes": ratings["dislikes"],
        "my_rating": ratings["my_rating"],
        "in_watchlist": in_watchlist,
        "resume_progress_seconds": resume_progress,
        "similar": [ContentResponse.model_validate(c) for c in similar],
    }


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
    user_id: int = Depends(require_uploader),
    user_role: str = Depends(get_current_user_role),
):
    content = await db.get(Content, content_id)
    if not content:
        raise HTTPException(404, "Content not found")

    if user_role != "admin" and content.uploaded_by != user_id:
        raise HTTPException(403, "You can only delete content that you uploaded")

    content_dir = settings.media_storage_path / str(content_id)
    if content_dir.exists():
        try:
            shutil.rmtree(content_dir)
        except Exception:
            pass

    raw_dir = settings.media_storage_path / "raw"
    if raw_dir.exists():
        for f in raw_dir.glob(f"{content_id}_*"):
            try:
                f.unlink()
            except Exception:
                pass
        
    await db.execute(delete(ContentVariant).where(ContentVariant.content_id == content_id))
    await db.execute(delete(Rating).where(Rating.content_id == content_id))
    await db.execute(delete(WatchHistory).where(WatchHistory.content_id == content_id))
    await db.execute(delete(Watchlist).where(Watchlist.content_id == content_id))
    await db.execute(delete(Episode).where(Episode.content_id == content_id))

    await db.delete(content)
    await db.commit()
    return {"status": "deleted"}
