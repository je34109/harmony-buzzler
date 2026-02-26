from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel, field_validator
import re
import uuid
import shutil
import logging
from pathlib import Path

from app.config import AUDIO_DIR
from app.services.pipeline import run_pipeline, run_pipeline_from_file
from app.services.downloader import YouTubeBlockedError

router = APIRouter()
logger = logging.getLogger(__name__)


class AnalyzeRequest(BaseModel):
    url: str

    @field_validator("url")
    @classmethod
    def validate_youtube_url(cls, v):
        pattern = r"(youtube\.com/watch\?v=|youtu\.be/|youtube\.com/shorts/)"
        if not re.search(pattern, v):
            raise ValueError("Invalid YouTube URL")
        return v


def extract_video_id(url: str) -> str:
    patterns = [
        r"(?:v=|youtu\.be/|shorts/)([a-zA-Z0-9_-]{11})",
    ]
    for p in patterns:
        m = re.search(p, url)
        if m:
            return m.group(1)
    raise ValueError("Cannot extract video ID")


@router.post("/analyze")
async def analyze(request: AnalyzeRequest):
    try:
        video_id = extract_video_id(request.url)
        result = await run_pipeline(request.url, video_id)
        return result
    except YouTubeBlockedError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("Analysis failed")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@router.post("/analyze/upload")
async def analyze_upload(file: UploadFile = File(...), title: str = "Uploaded Audio"):
    """Analyze an uploaded audio file (WAV/MP3/M4A)."""
    try:
        # Validate file type
        allowed = {".wav", ".mp3", ".m4a", ".ogg", ".flac", ".webm"}
        ext = Path(file.filename or "audio.wav").suffix.lower()
        if ext not in allowed:
            raise ValueError(f"Unsupported format: {ext}. Use: {', '.join(allowed)}")

        # Save uploaded file
        job_id = f"upload_{uuid.uuid4().hex[:12]}"
        AUDIO_DIR.mkdir(parents=True, exist_ok=True)
        audio_path = AUDIO_DIR / f"{job_id}{ext}"

        with open(audio_path, "wb") as f:
            shutil.copyfileobj(file.file, f)

        logger.info(f"Uploaded file saved: {audio_path} ({audio_path.stat().st_size} bytes)")

        metadata = {"title": title, "duration": 0, "thumbnail": ""}
        result = await run_pipeline_from_file(audio_path, job_id, metadata)
        return result

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("Upload analysis failed")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
