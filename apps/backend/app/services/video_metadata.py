import subprocess
import json

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
