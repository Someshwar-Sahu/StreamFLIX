from app.workers.celery_app import celery_app
from app.core.config import settings
import subprocess
import json
from sqlalchemy import create_engine, text

sync_engine = create_engine(settings.database_url.replace("+asyncpg", ""))

RENDITIONS = [
    {"name": "1080p", "height": 1080, "bitrate": "4500k"},
    {"name": "720p", "height": 720, "bitrate": "2200k"},
    {"name": "480p", "height": 480, "bitrate": "1000k"},
]

def get_source_dimensions(input_path: str) -> tuple[int, int]:
    cmd = [
        "ffprobe", "-v", "error",
        "-select_streams", "v:0",
        "-show_entries", "stream=width,height",
        "-of", "json",
        input_path,
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    data = json.loads(result.stdout)
    stream = data["streams"][0]
    return stream["width"], stream["height"]

@celery_app.task
def transcode_video(content_id: int, input_path: str):
    output_root = settings.media_storage_path / str(content_id)
    output_root.mkdir(parents=True, exist_ok=True)

    try:
        source_width, source_height = get_source_dimensions(input_path)
    except Exception:
        source_width, source_height = 1280, 720

    active_renditions = [r for r in RENDITIONS if r["height"] <= source_height]
    if not active_renditions:
        active_renditions = [RENDITIONS[-1]]

    variant_lines = []
    successful_variants = []

    # High-speed ultrafast multi-threaded encoding (-preset ultrafast -threads 0)
    for rendition in active_renditions:
        variant_dir = output_root / rendition["name"]
        variant_dir.mkdir(parents=True, exist_ok=True)
        variant_playlist = variant_dir / "playlist.m3u8"

        cmd = [
            "ffmpeg", "-y", "-i", input_path,
            "-vf", f"scale=-2:{rendition['height']}",
            "-c:v", "libx264",
            "-preset", "ultrafast",
            "-tune", "zerolatency",
            "-threads", "0",
            "-b:v", rendition["bitrate"],
            "-c:a", "aac", "-b:a", "128k",
            "-start_number", "0",
            "-hls_time", "4",
            "-hls_list_size", "0",
            "-f", "hls",
            str(variant_playlist),
        ]
        result = subprocess.run(cmd, capture_output=True, text=True)

        if result.returncode != 0:
            print(f"Variant {rendition['name']} failed: {result.stderr}")
            continue

        successful_variants.append(rendition)
        bandwidth = int(rendition["bitrate"].replace("k", "")) * 1000
        target_width = round((source_width / source_height) * rendition["height"] / 2) * 2
        variant_lines.append(
            f"#EXT-X-STREAM-INF:BANDWIDTH={bandwidth},RESOLUTION={target_width}x{rendition['height']}\n"
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

    return {"status": "ready", "variants": len(successful_variants)}