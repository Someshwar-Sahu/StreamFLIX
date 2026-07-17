from fastapi import APIRouter, Depends, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.db import get_db
from app.core.config import settings
from app.models.content import Content
from app.schemas.content import ContentResponse, ContentStatusResponse
from app.workers.tasks import transcode_video
import shutil
from sqlalchemy import select
from app.core.auth_dep import get_current_user_id

router = APIRouter(prefix="/content", tags=["content"])

@router.post("", response_model=ContentResponse)
async def upload_content(
    title: str = Form(...),
    description: str = Form(None),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    content = Content(title=title, description=description, status="processing", uploaded_by=user_id)
    db.add(content)
    await db.commit()  
    await db.refresh(content)

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
async def list_content(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Content).order_by(Content.created_at.desc()))
    return result.scalars().all()

@router.get("/{content_id}", response_model=ContentResponse)
async def get_content(content_id: int, db: AsyncSession = Depends(get_db)):
    content = await db.get(Content, content_id)
    return content