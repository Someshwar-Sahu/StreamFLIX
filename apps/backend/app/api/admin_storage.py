import os
import anyio
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.core.config import settings
from app.core.auth_dep import require_admin
from app.models.content import Content
from app.services.storage import storage_manager

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

def _mb(val: int) -> float:
    return round(val / (1024 * 1024), 2)

def _gb(val: int) -> float:
    return round(val / (1024 * 1024 * 1024), 2)

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
    local_total_bytes = total_content_bytes + raw_bytes

    b2_buckets = []
    total_b2_used_bytes = 0
    total_b2_max_bytes = 0

    for idx, bucket in enumerate(storage_manager.buckets):
        used = bucket.get_used_bytes()
        max_bytes = bucket.max_bytes
        total_b2_used_bytes += used
        total_b2_max_bytes += max_bytes

        used_gb = _gb(used)
        max_gb = _gb(max_bytes)
        percent = round((used / max_bytes) * 100, 1) if max_bytes > 0 else 0.0

        b2_buckets.append({
            "id": idx + 1,
            "name": bucket.name,
            "bucket_name": bucket.bucket_name,
            "endpoint": bucket.endpoint,
            "used_gb": used_gb,
            "max_gb": max_gb,
            "percent_used": percent,
            "is_active_target": bucket.can_fit(100 * 1024 * 1024)
        })

    total_b2_used_gb = _gb(total_b2_used_bytes)
    total_b2_max_gb = _gb(total_b2_max_bytes)
    total_b2_free_gb = round(total_b2_max_gb - total_b2_used_gb, 2)
    overall_b2_percent = round((total_b2_used_bytes / total_b2_max_bytes) * 100, 1) if total_b2_max_bytes > 0 else 0.0

    return {
        "total_mb": _mb(local_total_bytes),
        "transcoded_content_mb": _mb(total_content_bytes),
        "raw_leftover_mb": _mb(raw_bytes),
        "raw_leftover_note": "Non-zero usually means orphaned pre-cleanup-fix or a stuck transcode job.",
        "per_content": sorted(per_content, key=lambda x: x["bytes"], reverse=True),
        "b2_pool": {
            "total_used_gb": total_b2_used_gb,
            "total_max_gb": total_b2_max_gb,
            "total_free_gb": total_b2_free_gb,
            "percent_used": overall_b2_percent,
            "buckets": b2_buckets
        }
    }