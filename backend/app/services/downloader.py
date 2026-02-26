import re
import os
import base64
import json
import subprocess
import logging
import tempfile
from pathlib import Path

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


def _base_cmd() -> list[str]:
    """Base yt-dlp command with cookies and JS runtime."""
    cmd = ["python", "-m", "yt_dlp", "--no-playlist", "--remote-components", "ejs:github"]
    if _COOKIES_PATH:
        cmd += ["--cookies", _COOKIES_PATH]
    return cmd


def download_audio(url: str, video_id: str) -> tuple[Path, dict]:
    clean = _clean_url(url)
    output_path = AUDIO_DIR / f"{video_id}.wav"
    meta_path = AUDIO_DIR / f"{video_id}.meta.json"

    # Use cached metadata if available
    if meta_path.exists():
        with open(meta_path) as f:
            meta = json.load(f)
    else:
        meta = _get_metadata(clean)
        # Cache metadata
        AUDIO_DIR.mkdir(parents=True, exist_ok=True)
        with open(meta_path, "w") as f:
            json.dump(meta, f)

    if output_path.exists():
        return output_path, meta

    AUDIO_DIR.mkdir(parents=True, exist_ok=True)

    if meta.get("duration", 0) > MAX_DURATION_SECONDS:
        raise ValueError(f"Video too long (max {MAX_DURATION_SECONDS}s)")

    # Download as WAV
    cmd = _base_cmd() + [
        "-x",
        "--audio-format", "wav",
        "--audio-quality", "0",
        "-o", str(output_path),
        clean,
    ]

    logger.info(f"Downloading audio: {clean}")
    result = subprocess.run(cmd, capture_output=True, text=True)

    if result.returncode != 0:
        logger.error(f"yt-dlp stderr: {result.stderr}")
        stderr = result.stderr
        if "Sign in to confirm" in stderr or "bot" in stderr.lower():
            raise YouTubeBlockedError(
                "YouTube 封鎖了伺服器的下載請求。請改用「上傳音檔」功能："
                "先在本地下載歌曲音檔，再上傳到本站分析。"
            )
        raise RuntimeError(f"yt-dlp download failed: {stderr[-500:]}")

    if not output_path.exists():
        raise FileNotFoundError(f"Download completed but output not found at {output_path}")

    return output_path, meta


class YouTubeBlockedError(Exception):
    """Raised when YouTube blocks the download (bot detection)."""
    pass


def download_audio_as_mp3(url: str, video_id: str) -> tuple[Path, str]:
    """Download YouTube audio as MP3 for user download. Returns (path, title)."""
    clean = _clean_url(url)
    output_path = AUDIO_DIR / f"{video_id}.mp3"
    meta_path = AUDIO_DIR / f"{video_id}.meta.json"

    # Get metadata (for title and duration check)
    if meta_path.exists():
        with open(meta_path) as f:
            meta = json.load(f)
    else:
        meta = _get_metadata(clean)
        AUDIO_DIR.mkdir(parents=True, exist_ok=True)
        with open(meta_path, "w") as f:
            json.dump(meta, f)

    title = meta.get("title", "Unknown")

    if output_path.exists():
        return output_path, title

    AUDIO_DIR.mkdir(parents=True, exist_ok=True)

    if meta.get("duration", 0) > MAX_DURATION_SECONDS:
        raise ValueError(f"影片太長（最長 {MAX_DURATION_SECONDS} 秒）")

    cmd = _base_cmd() + [
        "-x",
        "--audio-format", "mp3",
        "--audio-quality", "0",
        "-o", str(output_path),
        clean,
    ]

    logger.info(f"Downloading MP3: {clean}")
    result = subprocess.run(cmd, capture_output=True, text=True)

    if result.returncode != 0:
        logger.error(f"yt-dlp stderr: {result.stderr}")
        stderr = result.stderr
        if "Sign in to confirm" in stderr or "bot" in stderr.lower():
            raise YouTubeBlockedError(
                "YouTube 封鎖了伺服器的下載請求。"
                "雲端伺服器無法下載 YouTube 影片，請在本地電腦使用此功能。"
            )
        raise RuntimeError(f"下載失敗: {stderr[-500:]}")

    if not output_path.exists():
        raise FileNotFoundError("下載完成但找不到輸出檔案")

    return output_path, title


def _get_metadata(url: str) -> dict:
    """Extract video metadata using yt-dlp CLI."""
    cmd = _base_cmd() + ["--dump-json", "--no-download", url]

    result = subprocess.run(cmd, capture_output=True, text=True)

    if result.returncode != 0:
        logger.error(f"yt-dlp metadata stderr: {result.stderr}")
        stderr = result.stderr
        if "Sign in to confirm" in stderr or "bot" in stderr.lower():
            raise YouTubeBlockedError(
                "YouTube 封鎖了伺服器的下載請求。請改用「上傳音檔」功能："
                "先在本地下載歌曲音檔，再上傳到本站分析。"
            )
        raise RuntimeError(f"yt-dlp metadata failed: {stderr[-500:]}")

    info = json.loads(result.stdout)
    return {
        "title": info.get("title", "Unknown"),
        "duration": info.get("duration", 0),
        "thumbnail": info.get("thumbnail", ""),
    }
