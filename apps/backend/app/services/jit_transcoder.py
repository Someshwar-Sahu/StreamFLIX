import subprocess
import threading
import shutil
import time
from pathlib import Path
from collections import defaultdict
from app.core.config import settings

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

_group_locks = defaultdict(threading.Lock)
_locks_guard = threading.Lock()

def _get_group_lock(content_id: int, resolution: str, group_index: int) -> threading.Lock:
    key = (content_id, resolution, group_index)
    with _locks_guard:
        return _group_locks[key]

def get_or_generate_segment(content_id: int, resolution: str, segment_index: int) -> Path:
    target_dir = CACHE_DIR / str(content_id) / resolution
    target_dir.mkdir(parents=True, exist_ok=True)
    target_segment = target_dir / f"segment_{segment_index}.ts"

    if target_segment.exists() and target_segment.stat().st_size > 0:
        return target_segment

    master_path = settings.media_storage_path / str(content_id) / "master_source.mp4"
    if not master_path.exists():
        raise FileNotFoundError(f"Master source for content {content_id} not found.")

    group_index = segment_index // 5
    group_start_index = group_index * 5
    group_start_seconds = group_start_index * 4

    group_lock = _get_group_lock(content_id, resolution, group_index)

    with group_lock:
        if target_segment.exists() and target_segment.stat().st_size > 0:
            return target_segment

        height = RESOLUTION_HEIGHTS.get(resolution, 720)
        bitrate = BITRATES.get(resolution, "2200k")

        temp_dir = target_dir / f"tmp_{group_index}_{int(time.time() * 1000)}"
        temp_dir.mkdir(parents=True, exist_ok=True)

        cmd = [
            "ffmpeg", "-y",
            "-ss", str(group_start_seconds),
            "-i", str(master_path),
            "-t", "20",
            "-vf", f"scale=-2:{height}",
            "-c:v", "libx264",
            "-preset", "ultrafast",
            "-tune", "zerolatency",
            "-x264-params", "keyint=96:min-keyint=96:scenecut=0",
            "-threads", "2",
            "-b:v", bitrate,
            "-c:a", "aac",
            "-b:a", "128k",
            "-af", "aresample=async=1",
            "-output_ts_offset", str(group_start_seconds),
            "-start_number", str(group_start_index),
            "-hls_time", "4",
            "-hls_list_size", "0",
            "-hls_segment_filename", str(temp_dir / "segment_%d.ts"),
            "-f", "hls",
            str(temp_dir / f"playlist_{group_start_index}.m3u8")
        ]

        try:
            result = subprocess.run(cmd, capture_output=True, text=True)
            if result.returncode != 0:
                raise RuntimeError(f"JIT Transcode failed: {result.stderr}")

            for f in temp_dir.glob("segment_*.ts"):
                target_f = target_dir / f.name
                if not target_f.exists() or target_f.stat().st_size == 0:
                    shutil.move(str(f), str(target_f))
        finally:
            shutil.rmtree(temp_dir, ignore_errors=True)

    if target_segment.exists() and target_segment.stat().st_size > 0:
        return target_segment
    else:
        raise RuntimeError(f"Failed to generate segment {segment_index} for content {content_id}")

