from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, field_validator
import re
import logging

from app.services.pipeline import run_pipeline

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
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("Analysis failed")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
