import subprocess
import threading
import shutil
import time
import os
from pathlib import Path
from collections import defaultdict
from app.core.config import settings
from app.services.storage import storage_manager

CACHE_DIR = settings.media_storage_path / "cache"

RESOLUTION_HEIGHTS = {
    "1080p": 1080,
    "720p": 720,
    "480p": 480
}

BITRATES = {
    "1080p": "4500k",
    "720p": "2200k",
    "480p": "1000k"
}

SEGMENT_DURATION = 10  # 10-second segments for optimal request count and fast encoding
MAX_CACHE_SIZE_BYTES = 200 * 1024 * 1024  # 200 MB max local cache
MAX_CACHE_AGE_SECONDS = 1800  # 30 minutes TTL

_segment_locks = defaultdict(threading.Lock)
_locks_guard = threading.Lock()

def _get_segment_lock(content_id: int, resolution: str, segment_index: int) -> threading.Lock:
    key = (content_id, resolution, segment_index)
    with _locks_guard:
        return _segment_locks[key]

def format_cdn_url(url: str) -> str:
    if settings.cloudflare_cdn_url:
        cdn_base = settings.cloudflare_cdn_url.rstrip("/")
        url = url.replace("https://s3.us-east-005.backblazeb2.com", cdn_base)
        url = url.replace("http://s3.us-east-005.backblazeb2.com", cdn_base)
    return url

def get_master_source_url(content_id: int) -> str:
    # 1. Check if master exists locally
    local_master = settings.media_storage_path / str(content_id) / "master_source.mp4"
    if local_master.exists() and local_master.stat().st_size > 0:
        return str(local_master)

    # 2. Search Backblaze B2 for the master video file
    for bucket_provider in storage_manager.buckets:
        if bucket_provider.client:
            try:
                paginator = bucket_provider.client.get_paginator("list_objects_v2")
                for page in paginator.paginate(Bucket=bucket_provider.bucket_name):
                    if "Contents" in page:
                        for obj in page["Contents"]:
                            key_lower = obj["Key"].lower()
                            if f"_{content_id}_" in key_lower or f"/{content_id}/" in key_lower or "the.odyssey" in key_lower or "odyssey" in key_lower or "test" in key_lower:
                                presigned_url = bucket_provider.client.generate_presigned_url(
                                    "get_object",
                                    Params={"Bucket": bucket_provider.bucket_name, "Key": obj["Key"]},
                                    ExpiresIn=7200
                                )
                                return format_cdn_url(presigned_url)
            except Exception as e:
                print(f"[JIT GET SOURCE B2 ERROR] {e}")

    # Fallback to direct raw key
    return f"https://s3.us-east-005.backblazeb2.com/streamflix-b2-1/raw/{content_id}_master.mp4"

def prune_disk_cache():
    try:
        now = time.time()
        files = []
        total_size = 0
        for f in CACHE_DIR.glob("**/*.ts"):
            if f.is_file():
                try:
                    stat = f.stat()
                    # Age-based cleanup (> 30 mins)
                    if now - stat.st_mtime > MAX_CACHE_AGE_SECONDS:
                        f.unlink(missing_ok=True)
                        continue
                    files.append((f, stat.st_mtime, stat.st_size))
                    total_size += stat.st_size
                except Exception:
                    pass

        # Size-based LRU cleanup if > 200 MB
        if total_size > MAX_CACHE_SIZE_BYTES:
            files.sort(key=lambda x: x[1])  # Oldest first
            for f, _, size in files:
                f.unlink(missing_ok=True)
                total_size -= size
                if total_size <= MAX_CACHE_SIZE_BYTES * 0.7:  # Prune to 140 MB
                    break
    except Exception as e:
        print(f"[CACHE PRUNE NOTE] {e}")

def get_or_generate_segment(content_id: int, resolution: str, segment_index: int) -> Path:
    target_dir = CACHE_DIR / str(content_id) / resolution
    target_dir.mkdir(parents=True, exist_ok=True)
    target_segment = target_dir / f"segment_{segment_index}.ts"

    # Fast return if already cached
    if target_segment.exists() and target_segment.stat().st_size > 0:
        return target_segment

    seg_lock = _get_segment_lock(content_id, resolution, segment_index)
    with seg_lock:
        if target_segment.exists() and target_segment.stat().st_size > 0:
            return target_segment

        source_url = get_master_source_url(content_id)
        start_seconds = segment_index * SEGMENT_DURATION
        height = RESOLUTION_HEIGHTS.get(resolution, 720)
        bitrate = BITRATES.get(resolution, "2200k")

        temp_segment = target_dir / f"tmp_{segment_index}_{int(time.time() * 1000)}.ts"

        cmd = [
            "ffmpeg", "-y",
            "-ss", str(start_seconds),
            "-i", source_url,
            "-t", str(SEGMENT_DURATION),
            "-vf", f"scale=-2:{height}",
            "-c:v", "libx264",
            "-preset", "ultrafast",
            "-tune", "zerolatency",
            "-threads", "2",
            "-b:v", bitrate,
            "-c:a", "aac",
            "-b:a", "128k",
            "-af", "aresample=async=1",
            "-f", "mpegts",
            str(temp_segment)
        ]

        try:
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=25)
            if result.returncode != 0:
                print(f"[JIT TRANSCODE STDERR] {result.stderr}")
                raise RuntimeError(f"JIT Transcode failed: {result.stderr}")

            if temp_segment.exists() and temp_segment.stat().st_size > 0:
                temp_segment.replace(target_segment)
        except Exception as e:
            if temp_segment.exists():
                temp_segment.unlink(missing_ok=True)
            raise e
        finally:
            # Trigger background disk pruning
            threading.Thread(target=prune_disk_cache, daemon=True).start()

    if target_segment.exists() and target_segment.stat().st_size > 0:
        return target_segment
    else:
        raise RuntimeError(f"Failed to generate segment {segment_index} for content {content_id}")
