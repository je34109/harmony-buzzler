import asyncio
import re
import logging
from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel, field_validator

from app.config import AUDIO_DIR
from app.services.downloader import (
    download_audio_as_mp3,
    YouTubeBlockedError,
)

router = APIRouter()
logger = logging.getLogger(__name__)


class DownloadRequest(BaseModel):
    url: str

    @field_validator("url")
    @classmethod
    def validate_youtube_url(cls, v):
        pattern = r"(youtube\.com/watch\?v=|youtu\.be/|youtube\.com/shorts/)"
        if not re.search(pattern, v):
            raise ValueError("Invalid YouTube URL")
        return v


def _extract_video_id(url: str) -> str:
    m = re.search(r"(?:v=|youtu\.be/|shorts/)([a-zA-Z0-9_-]{11})", url)
    if m:
        return m.group(1)
    raise ValueError("Cannot extract video ID")


@router.post("/download")
async def download(request: DownloadRequest):
    """Download YouTube audio and return as MP3 file."""
    try:
        video_id = _extract_video_id(request.url)
        mp3_path, title = await asyncio.to_thread(
            download_audio_as_mp3, request.url, video_id
        )

        safe_title = re.sub(r'[^\w\s\-\u4e00-\u9fff]', '', title).strip() or video_id
        filename = f"{safe_title}.mp3"

        return FileResponse(
            path=str(mp3_path),
            media_type="audio/mpeg",
            filename=filename,
        )
    except YouTubeBlockedError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("Download failed")
        raise HTTPException(status_code=500, detail=f"下載失敗: {str(e)}")
