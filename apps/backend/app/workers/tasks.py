from app.workers.celery_app import celery_app
from app.core.config import settings
import subprocess
import json
from sqlalchemy import create_engine, text
from sqlalchemy.pool import NullPool

sync_engine = create_engine(
    settings.database_url.replace("+asyncpg", ""),
    poolclass=NullPool
)

RENDITIONS = [
    {"name": "1080p", "height": 1080, "bitrate": 4500000},
    {"name": "720p", "height": 720, "bitrate": 2200000},
    {"name": "480p", "height": 480, "bitrate": 1000000},
]

def get_source_metadata(input_path: str) -> dict:
    cmd = [
        "ffprobe", "-v", "error",
        "-select_streams", "v:0",
        "-show_entries", "stream=width,height,duration",
        "-of", "json",
        input_path,
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(f"ffprobe failed: {result.stderr}")
    
    data = json.loads(result.stdout)
    stream = data["streams"][0]
    return {
        "width": int(stream.get("width", 1280)),
        "height": int(stream.get("height", 720)),
        "duration": float(stream.get("duration", 0.0))
    }

@celery_app.task
def process_master_upload(content_id: int, input_path: str):
    output_root = settings.media_storage_path / str(content_id)
    output_root.mkdir(parents=True, exist_ok=True)
    master_path = output_root / "master_source.mp4"

    effective_input = input_path
    if input_path.startswith("/"):
        parts = input_path.lstrip("/").split("/", 1)
        if len(parts) == 2:
            bucket_name, s3_key = parts[0], parts[1]
            try:
                from app.services.storage import storage_manager
                for b in storage_manager.buckets:
                    if b.bucket_name == bucket_name and b.client:
                        effective_input = b.client.generate_presigned_url(
                            "get_object",
                            Params={"Bucket": bucket_name, "Key": s3_key},
                            ExpiresIn=7200
                        )
                        break
            except Exception as e:
                print(f"[PRESIGNED GET URL GENERATION ERROR] {e}")
                effective_input = f"https://s3.us-east-005.backblazeb2.com{input_path}"
        else:
            effective_input = f"https://s3.us-east-005.backblazeb2.com{input_path}"

    try:
        metadata = get_source_metadata(effective_input)
        source_height = metadata["height"]
        duration = metadata["duration"]

        active_renditions = [r for r in RENDITIONS if r["height"] <= source_height]
        if not active_renditions:
            active_renditions = [RENDITIONS[-1]]

        cmd_copy = [
            "ffmpeg", "-y", "-i", effective_input,
            "-c", "copy",
            "-movflags", "+faststart+frag_keyframe+empty_moov",
            str(master_path)
        ]
        result = subprocess.run(cmd_copy, capture_output=True, text=True)

        if result.returncode != 0 or not master_path.exists() or master_path.stat().st_size == 0:
            cmd_encode = [
                "ffmpeg", "-y", "-i", effective_input,
                "-c:v", "libx264",
                "-preset", "ultrafast",
                "-g", "96",
                "-keyint_min", "96",
                "-sc_threshold", "0",
                "-movflags", "+faststart+frag_keyframe+empty_moov",
                "-c:a", "aac", "-b:a", "128k",
                "-ar", "48000",
                "-af", "aresample=async=1",
                str(master_path)
            ]
            result = subprocess.run(cmd_encode, capture_output=True, text=True)
            if result.returncode != 0:
                raise RuntimeError(f"Master encoding failed: {result.stderr}")

        with sync_engine.connect() as conn:
            conn.execute(
                text("UPDATE content SET status = :status, duration = :duration WHERE id = :id"),
                {"status": "ready", "duration": int(duration), "id": content_id}
            )
            
            conn.execute(text("DELETE FROM content_variants WHERE content_id = :id"), {"id": content_id})
            hls_path_val = str(master_path) if (master_path.exists() and master_path.stat().st_size > 0) else input_path
            for rendition in active_renditions:
                conn.execute(
                    text("""
                        INSERT INTO content_variants (content_id, resolution, hls_path, bitrate)
                        VALUES (:content_id, :resolution, :hls_path, :bitrate)
                    """),
                    {
                        "content_id": content_id,
                        "resolution": rendition["name"],
                        "hls_path": hls_path_val,
                        "bitrate": rendition["bitrate"]
                    }
                )
            conn.commit()

        return {"status": "success", "active_renditions": [r["name"] for r in active_renditions]}

    except Exception as e:
        with sync_engine.connect() as conn:
            conn.execute(
                text("UPDATE content SET status = :status WHERE id = :id"),
                {"status": "failed", "id": content_id}
            )
            conn.commit()
        return {"status": "failed", "error": str(e)}
