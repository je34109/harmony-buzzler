import re
import os
import base64
import logging
import tempfile
from pathlib import Path

import yt_dlp

from app.config import AUDIO_DIR, MAX_DURATION_SECONDS

logger = logging.getLogger(__name__)

# Decode YouTube cookies from env (set as HF Space secret)
_COOKIES_PATH: str | None = None
_cookies_b64 = os.environ.get("YT_COOKIES_B64")
if _cookies_b64:
    try:
        cookies_data = base64.b64decode(_cookies_b64).decode()
        tf = tempfile.NamedTemporaryFile(mode="w", suffix=".txt", delete=False)
        tf.write(cookies_data)
        tf.close()
        _COOKIES_PATH = tf.name
        logger.info(f"YouTube cookies loaded ({len(cookies_data)} bytes)")
    except Exception as e:
        logger.warning(f"Failed to decode YT_COOKIES_B64: {e}")


def _clean_url(url: str) -> str:
    """Strip playlist/radio params, keep only the video URL."""
    m = re.search(r'(?:v=|youtu\.be/|shorts/)([a-zA-Z0-9_-]{11})', url)
    if m:
        return f"https://www.youtube.com/watch?v={m.group(1)}"
    return url


def _base_opts() -> dict:
    """Base yt-dlp options with JS signature solving + cookies."""
    opts: dict = {
        "quiet": True,
        "no_warnings": True,
        "noplaylist": True,
    }
    if _COOKIES_PATH:
        opts["cookiefile"] = _COOKIES_PATH
    return opts


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
