import subprocess
import json
import re
from pathlib import Path

from app.config import AUDIO_DIR, MAX_DURATION_SECONDS


def _clean_url(url: str) -> str:
    """Strip playlist/radio params, keep only the video URL."""
    m = re.search(r'(?:v=|youtu\.be/|shorts/)([a-zA-Z0-9_-]{11})', url)
    if m:
        return f"https://www.youtube.com/watch?v={m.group(1)}"
    return url


def download_audio(url: str, video_id: str) -> tuple[Path, dict]:
    clean = _clean_url(url)
    output_path = AUDIO_DIR / f"{video_id}.wav"

    if output_path.exists():
        meta = _get_metadata(clean)
        return output_path, meta

    AUDIO_DIR.mkdir(parents=True, exist_ok=True)

    # Get metadata first
    meta = _get_metadata(clean)

    if meta.get("duration", 0) > MAX_DURATION_SECONDS:
        raise ValueError(f"Video too long (max {MAX_DURATION_SECONDS}s)")

    # Download as WAV
    result = subprocess.run(
        [
            "yt-dlp",
            "-x",
            "--audio-format", "wav",
            "--audio-quality", "0",
            "-o", str(output_path),
            "--no-playlist",
            clean,
        ],
        capture_output=True,
        text=True,
    )

    if result.returncode != 0:
        raise RuntimeError(f"yt-dlp download failed: {result.stderr[-500:]}")

    return output_path, meta


def _get_metadata(url: str) -> dict:
    result = subprocess.run(
        [
            "yt-dlp",
            "--dump-json",
            "--no-download",
            "--no-playlist",
            url,
        ],
        capture_output=True,
        text=True,
    )

    if result.returncode != 0:
        raise RuntimeError(f"yt-dlp metadata failed: {result.stderr[-500:]}")

    info = json.loads(result.stdout)
    return {
        "title": info.get("title", "Unknown"),
        "duration": info.get("duration", 0),
        "thumbnail": info.get("thumbnail", ""),
    }
