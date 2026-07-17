from app.workers.celery_app import celery_app
from app.core.config import settings
import subprocess
from sqlalchemy import create_engine, text

sync_engine = create_engine(settings.database_url.replace("+asyncpg", ""))

@celery_app.task
def transcode_video(content_id: int, input_path: str):
    output_dir = settings.media_storage_path / str(content_id)
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / "master.m3u8"

    cmd = [
        "ffmpeg", "-i", input_path,
        "-c", "copy",
        "-start_number", "0",
        "-hls_time", "6",
        "-hls_list_size", "0",
        "-f", "hls",
        str(output_path),
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)

    new_status = "ready" if result.returncode == 0 else "failed"

    with sync_engine.connect() as conn:
        conn.execute(
            text("UPDATE content SET status = :status WHERE id = :id"),
            {"status": new_status, "id": content_id},
        )
        conn.commit()

    if result.returncode != 0:
        return {"status": "failed", "error": result.stderr[-1000:]}

    return {"status": "success", "output_path": str(output_path)}