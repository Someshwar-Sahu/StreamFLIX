import os
import anyio
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.core.config import settings
from app.core.auth_dep import require_admin
from app.models.content import Content

router = APIRouter(prefix="/admin/storage", tags=["admin"])

def _dir_size(path) -> int:
    total = 0
    if not path.exists():
        return 0
    for dirpath, _, filenames in os.walk(path):
        for f in filenames:
            fp = os.path.join(dirpath, f)
            if os.path.isfile(fp):
                total += os.path.getsize(fp)
    return total

def _mb(val):
    return round(val / (1024 * 1024), 2)

@router.get("")
async def get_storage_usage(db: AsyncSession = Depends(get_db), admin_id: int = Depends(require_admin)):
    root = settings.media_storage_path
    raw_dir = root / "raw"

    result = await db.execute(select(Content.id, Content.title))
    contents = result.all()

    per_content = []
    total_content_bytes = 0
    for content_id, title in contents:
        content_dir = root / str(content_id)
        size = await anyio.to_thread.run_sync(_dir_size, content_dir)
        total_content_bytes += size
        per_content.append({
            "content_id": content_id,
            "title": title,
            "bytes": size,
            "mb": _mb(size)
        })

    raw_bytes = await anyio.to_thread.run_sync(_dir_size, raw_dir)
    total_bytes = total_content_bytes + raw_bytes

    return {
        "total_mb": _mb(total_bytes),
        "transcoded_content_mb": _mb(total_content_bytes),
        "raw_leftover_mb": _mb(raw_bytes),
        "raw_leftover_note": "Non-zero usually means orphaned pre-cleanup-fix or a stuck transcode job.",
        "per_content": sorted(per_content, key=lambda x: x["bytes"], reverse=True),
    }