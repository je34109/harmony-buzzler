import re
import logging
from pathlib import Path

import yt_dlp

from app.config import AUDIO_DIR, MAX_DURATION_SECONDS

logger = logging.getLogger(__name__)


def _clean_url(url: str) -> str:
    """Strip playlist/radio params, keep only the video URL."""
    m = re.search(r'(?:v=|youtu\.be/|shorts/)([a-zA-Z0-9_-]{11})', url)
    if m:
        return f"https://www.youtube.com/watch?v={m.group(1)}"
    return url


def _base_opts() -> dict:
    """Base yt-dlp options that bypass YouTube bot detection."""
    return {
        "quiet": True,
        "no_warnings": True,
        "noplaylist": True,
        "extractor_args": {"youtube": {"player_client": ["ios", "web"]}},
    }


def download_audio(url: str, video_id: str) -> tuple[Path, dict]:
    clean = _clean_url(url)
    output_path = AUDIO_DIR / f"{video_id}.wav"

    # Get metadata
    meta = _get_metadata(clean)

    if output_path.exists():
        return output_path, meta

    AUDIO_DIR.mkdir(parents=True, exist_ok=True)

    if meta.get("duration", 0) > MAX_DURATION_SECONDS:
        raise ValueError(f"Video too long (max {MAX_DURATION_SECONDS}s)")

    # Download as WAV using yt-dlp Python API
    ydl_opts = {
        **_base_opts(),
        "format": "bestaudio/best",
        "outtmpl": str(AUDIO_DIR / f"{video_id}.%(ext)s"),
        "postprocessors": [{
            "key": "FFmpegExtractAudio",
            "preferredcodec": "wav",
            "preferredquality": "0",
        }],
    }

    logger.info(f"Downloading audio: {clean}")
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        ydl.download([clean])

    # yt-dlp may output with different extension before postprocessing
    if not output_path.exists():
        # Try finding the output file
        for ext in ["wav", "webm", "m4a", "mp3"]:
            candidate = AUDIO_DIR / f"{video_id}.{ext}"
            if candidate.exists() and ext != "wav":
                candidate.rename(output_path)
                break

    if not output_path.exists():
        raise FileNotFoundError(f"Download completed but output not found at {output_path}")

    return output_path, meta


def _get_metadata(url: str) -> dict:
    """Extract video metadata using yt-dlp Python API."""
    ydl_opts = _base_opts()

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=False)

    return {
        "title": info.get("title", "Unknown"),
        "duration": info.get("duration", 0),
        "thumbnail": info.get("thumbnail", ""),
    }
