import re
import math
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse, Response, RedirectResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.core.config import settings
from app.models.content import Content, ContentVariant
from app.services.jit_transcoder import get_or_generate_segment
from app.services.video_metadata import get_source_metadata
from app.services.storage import storage_manager

router = APIRouter(prefix="/content", tags=["streaming"])

@router.get("/{id}/video")
async def get_direct_video(id: int, db: AsyncSession = Depends(get_db)):
    content = await db.get(Content, id)
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")

    output_root = settings.media_storage_path / str(id)
    master_path = output_root / "master_source.mp4"
    if master_path.exists() and master_path.stat().st_size > 0:
        return FileResponse(master_path, media_type="video/mp4")

    result = await db.execute(select(ContentVariant).where(ContentVariant.content_id == id))
    variant = result.scalars().first()

    raw_s3_path = variant.hls_path if (variant and variant.hls_path) else None

    if raw_s3_path and raw_s3_path.startswith("/"):
        parts = raw_s3_path.lstrip("/").split("/", 1)
        if len(parts) == 2:
            bucket_name, s3_key = parts[0], parts[1]
            for bucket_provider in storage_manager.buckets:
                if bucket_provider.bucket_name == bucket_name and bucket_provider.client:
                    try:
                        presigned_url = bucket_provider.client.generate_presigned_url(
                            "get_object",
                            Params={"Bucket": bucket_name, "Key": s3_key},
                            ExpiresIn=7200
                        )
                        return RedirectResponse(url=presigned_url, status_code=302)
                    except Exception as e:
                        print(f"[DIRECT VIDEO PRESIGNED B2 ERROR] {e}")

    title_slug = content.title.lower() if content and content.title else str(id)
    for bucket_provider in storage_manager.buckets:
        if bucket_provider.client:
            try:
                paginator = bucket_provider.client.get_paginator("list_objects_v2")
                for page in paginator.paginate(Bucket=bucket_provider.bucket_name):
                    if "Contents" in page:
                        for obj in page["Contents"]:
                            key_lower = obj["Key"].lower()
                            if f"_{id}_" in key_lower or f"/{id}/" in key_lower or (len(title_slug) > 3 and title_slug in key_lower):
                                presigned_url = bucket_provider.client.generate_presigned_url(
                                    "get_object",
                                    Params={"Bucket": bucket_provider.bucket_name, "Key": obj["Key"]},
                                    ExpiresIn=7200
                                )
                                return RedirectResponse(url=presigned_url, status_code=302)
            except Exception as e:
                print(f"[DIRECT VIDEO B2 FALLBACK ERROR] {e}")

    raise HTTPException(status_code=404, detail="Video file not found")


@router.get("/{id}/stream/master.m3u8")
async def get_master_playlist(id: int, db: AsyncSession = Depends(get_db)):
    output_root = settings.media_storage_path / str(id)
    master_path = output_root / "master_source.mp4"
    old_master = output_root / "master.m3u8"

    if old_master.exists() and not master_path.exists():
        return FileResponse(old_master, media_type="application/x-mpegURL")

    if master_path.exists():
        result = await db.execute(select(ContentVariant).where(ContentVariant.content_id == id))
        variants = result.scalars().all()

        if not variants:
            raise HTTPException(status_code=404, detail="No video variants found.")

        playlist_lines = ["#EXTM3U", "#EXT-X-VERSION:3", "#EXT-X-INDEPENDENT-SEGMENTS"]
        for v in variants:
            raw_bitrate = str(v.bitrate) if v.bitrate is not None else "2200000"
            bandwidth = int(raw_bitrate.replace("k", "")) * 1000 if "k" in raw_bitrate else int(raw_bitrate)
            res_height = v.resolution.replace("p", "")
            playlist_lines.append(f"#EXT-X-STREAM-INF:BANDWIDTH={bandwidth},RESOLUTION=1280x{res_height}")
            playlist_lines.append(f"/content/{id}/stream/{v.resolution}/playlist.m3u8")

        return Response(content="\n".join(playlist_lines), media_type="application/x-mpegURL")

    # B2 Presigned Stream Fallback
    return await get_direct_video(id, db)


@router.get("/{id}/stream/{resolution}/playlist.m3u8")
async def get_variant_playlist(id: int, resolution: str, db: AsyncSession = Depends(get_db)):
    content = await db.get(Content, id)
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")

    output_root = settings.media_storage_path / str(id)
    master_path = output_root / "master_source.mp4"
    legacy_playlist = output_root / resolution / "playlist.m3u8"

    if legacy_playlist.exists() and not master_path.exists():
        return FileResponse(legacy_playlist, media_type="application/x-mpegURL")

    if not master_path.exists():
        return await get_direct_video(id, db)

    duration = content.duration
    if not duration or duration <= 0:
        try:
            meta = get_source_metadata(str(master_path))
            duration = int(meta["duration"])
        except Exception:
            duration = 0

    if not duration or duration <= 0:
        raise HTTPException(status_code=500, detail="Could not determine video duration.")

    num_segments = math.ceil(duration / 4.0)
    playlist_lines = [
        "#EXTM3U",
        "#EXT-X-VERSION:3",
        "#EXT-X-TARGETDURATION:4",
        "#EXT-X-MEDIA-SEQUENCE:0"
    ]

    for i in range(num_segments):
        seg_duration = min(4.0, duration - i * 4.0)
        playlist_lines.append(f"#EXTINF:{seg_duration:.6f},")
        playlist_lines.append(f"/content/{id}/stream/{resolution}/segment_{i}.ts")

    playlist_lines.append("#EXT-X-ENDLIST")
    return Response(content="\n".join(playlist_lines), media_type="application/x-mpegURL")


@router.get("/{id}/stream/{resolution}/{segment_file}")
async def stream_segment(id: int, resolution: str, segment_file: str):
    output_root = settings.media_storage_path / str(id)
    legacy_segment = output_root / resolution / segment_file
    if legacy_segment.exists():
        return FileResponse(legacy_segment, media_type="video/mp2t")

    match = re.search(r"(\d+)", segment_file)
    if not match:
        raise HTTPException(status_code=400, detail="Invalid segment filename")

    index = int(match.group(1))
    try:
        segment_path = get_or_generate_segment(content_id=id, resolution=resolution, segment_index=index)
        return FileResponse(segment_path, media_type="video/mp2t")
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Video master file not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
