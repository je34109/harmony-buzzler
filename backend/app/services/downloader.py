import subprocess
import json
from pathlib import Path

from app.config import AUDIO_DIR, MAX_DURATION_SECONDS


def download_audio(url: str, video_id: str) -> tuple[Path, dict]:
    output_path = AUDIO_DIR / f"{video_id}.wav"

    if output_path.exists():
        # Still need metadata
        meta = _get_metadata(url)
        return output_path, meta

    AUDIO_DIR.mkdir(parents=True, exist_ok=True)

    # Get metadata first
    meta = _get_metadata(url)

    if meta.get("duration", 0) > MAX_DURATION_SECONDS:
        raise ValueError(f"Video too long (max {MAX_DURATION_SECONDS}s)")

    # Download as WAV
    subprocess.run(
        [
            "yt-dlp",
            "-x",
            "--audio-format", "wav",
            "--audio-quality", "0",
            "-o", str(output_path),
            "--no-playlist",
            url,
        ],
        check=True,
        capture_output=True,
    )

    return output_path, meta


def _get_metadata(url: str) -> dict:
    result = subprocess.run(
        [
            "yt-dlp",
            "--dump-json",
            "--no-download",
            url,
        ],
        capture_output=True,
        text=True,
        check=True,
    )

    info = json.loads(result.stdout)
    return {
        "title": info.get("title", "Unknown"),
        "duration": info.get("duration", 0),
        "thumbnail": info.get("thumbnail", ""),
    }
