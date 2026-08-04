import os
import time
from pathlib import Path
from app.services.jit_transcoder import CACHE_DIR
from app.workers.celery_app import celery_app

MAX_AGE_SECONDS = 15 * 60

MAX_CACHE_BYTES = 10 * 1024 * 1024 * 1024

def clean_cache_dir(max_age_seconds: int = MAX_AGE_SECONDS, max_bytes: int = MAX_CACHE_BYTES):
    if not CACHE_DIR.exists():
        return {"status": "skipped", "reason": "Cache directory does not exist"}

    now = time.time()
    deleted_files = 0
    freed_bytes = 0
    cached_files = []

    for root, _, files in os.walk(CACHE_DIR):
        for file in files:
            file_path = Path(root) / file
            try:
                stat = file_path.stat()
                file_age = now - stat.st_atime

                if file_age > max_age_seconds:
                    file_size = stat.st_size
                    file_path.unlink()
                    deleted_files += 1
                    freed_bytes += file_size
                else:
                    cached_files.append((stat.st_atime, stat.st_size, file_path))

            except Exception as e:
                print(f"Error checking cache file {file_path}: {e}")

    total_cache_size = sum(size for _, size, _ in cached_files)
    if total_cache_size > max_bytes:
        cached_files.sort(key=lambda x: x[0])
        for atime, size, file_path in cached_files:
            if total_cache_size <= max_bytes:
                break
            try:
                file_path.unlink()
                total_cache_size -= size
                deleted_files += 1
                freed_bytes += size
            except Exception as e:
                print(f"Error evicting file {file_path}: {e}")

    for root, dirs, _ in os.walk(CACHE_DIR, topdown=False):
        for d in dirs:
            dir_path = Path(root) / d
            try:
                if not any(dir_path.iterdir()):
                    dir_path.rmdir()
            except Exception:
                pass
    return {
        "status": "success",
        "deleted_files_count": deleted_files,
        "freed_megabytes": round(freed_bytes / (1024 * 1024), 2)
    }

@celery_app.task
def run_periodic_cache_cleanup():
    return clean_cache_dir()