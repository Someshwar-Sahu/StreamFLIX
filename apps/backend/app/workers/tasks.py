from app.workers.celery_app import celery_app
from app.core.config import settings
import subprocess
import json
from sqlalchemy import create_engine, text

sync_engine = create_engine(settings.database_url.replace("+asyncpg", ""))

RENDITIONS = [
    {"name": "1080p", "height": 1080, "bitrate": "5000k"},
    {"name": "720p", "height": 720, "bitrate": "2800k"},
    {"name": "480p", "height": 480, "bitrate": "1400k"},
]

def get_source_height(input_path: str) -> int:
    cmd = [
        "ffprobe", "-v", "error",
        "-select_streams", "v:0",
        "-show_entries", "stream=height",
        "-of", "json",
        input_path,
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    data = json.loads(result.stdout)
    return data["streams"][0]["height"]


@celery_app.task
def transcode_video(content_id: int, input_path: str):
    output_root = settings.media_storage_path / str(content_id)
    output_root.mkdir(parents=True, exist_ok=True)

    source_height = get_source_height(input_path)
    active_renditions = [r for r in RENDITIONS if r["height"] <= source_height]
    if not active_renditions:
        active_renditions = [RENDITIONS[-1]]

    variant_lines = []
    successful_variants = []

    for rendition in active_renditions:
        variant_dir = output_root / rendition["name"]
        variant_dir.mkdir(parents=True, exist_ok=True)
        variant_playlist = variant_dir / "playlist.m3u8"

        cmd = [
            "ffmpeg", "-i", input_path,
            "-vf", f"scale=-2:{rendition['height']}",
            "-c:v", "libx264", "-b:v", rendition["bitrate"],
            "-c:a", "aac", "-b:a", "128k",
            "-start_number", "0",
            "-hls_time", "6",
            "-hls_list_size", "0",
            "-f", "hls",
            str(variant_playlist),
        ]
        result = subprocess.run(cmd, capture_output=True, text=True)

        if result.returncode != 0:
            continue

        successful_variants.append(rendition)
        bandwidth = int(rendition["bitrate"].replace("k", "")) * 1000
        variant_lines.append(
            f"#EXT-X-STREAM-INF:BANDWIDTH={bandwidth},RESOLUTION=?x{rendition['height']}\n"
            f"{rendition['name']}/playlist.m3u8"
        )

    if not successful_variants:
        with sync_engine.connect() as conn:
            conn.execute(text("UPDATE content SET status = :status WHERE id = :id"),
                         {"status": "failed", "id": content_id})
            conn.commit()
        return {"status": "failed", "error": "All renditions failed to encode"}

    master_path = output_root / "master.m3u8"
    with open(master_path, "w") as f:
        f.write("#EXTM3U\n#EXT-X-VERSION:3\n")
        f.write("\n".join(variant_lines) + "\n")

    with sync_engine.connect() as conn:
        conn.execute(text("UPDATE content SET status = :status WHERE id = :id"),
                     {"status": "ready", "id": content_id})
        for rendition in successful_variants:
            conn.execute(
                text("""
                    INSERT INTO content_variants (content_id, resolution, hls_path, bitrate)
                    VALUES (:content_id, :resolution, :hls_path, :bitrate)
                """),
                {
                    "content_id": content_id,
                    "resolution": rendition["name"],
                    "hls_path": f"{rendition['name']}/playlist.m3u8",
                    "bitrate": int(rendition["bitrate"].replace("k", "")) * 1000,
                },
            )
        conn.commit()

    import os
    try:
        os.remove(input_path)
    except OSError:
        pass 

    return {"status": "success", "output_path": str(master_path), "renditions": [r["name"] for r in successful_variants]}