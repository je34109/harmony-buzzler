import asyncio
import json
import logging
from pathlib import Path

from app.config import AUDIO_DIR, SEPARATED_DIR
from app.services.downloader import download_audio
from app.services.separator import separate_vocals
from app.services.key_detector import detect_key
from app.services.tempo_detector import detect_tempo
from app.services.chord_detector import detect_chords

logger = logging.getLogger(__name__)


async def run_pipeline(url: str, video_id: str) -> dict:
    job_dir = SEPARATED_DIR / video_id
    cache_file = job_dir / "result.json"

    # Check cache
    if cache_file.exists():
        logger.info(f"Cache hit for {video_id}")
        with open(cache_file) as f:
            return json.load(f)

    # Step 1: Download
    logger.info(f"Downloading {video_id}")
    audio_path, metadata = await asyncio.to_thread(download_audio, url, video_id)

    # Step 2: Separate vocals
    logger.info(f"Separating vocals for {video_id}")
    vocals_path = await asyncio.to_thread(separate_vocals, audio_path, video_id)

    # Step 3: Detect key
    logger.info(f"Detecting key for {video_id}")
    key_result = await asyncio.to_thread(detect_key, vocals_path)

    # Step 4: Detect tempo
    logger.info(f"Detecting tempo for {video_id}")
    tempo_result = await asyncio.to_thread(detect_tempo, audio_path)

    # Step 5: Detect chords
    logger.info(f"Detecting chords for {video_id}")
    chord_result = await asyncio.to_thread(detect_chords, audio_path)

    result = {
        "metadata": metadata,
        "analysis": {
            "key": key_result,
            "tempo": tempo_result,
            "chords": chord_result,
        },
        "audio": {
            "vocalsUrl": f"/api/audio/{video_id}/vocals.wav",
        },
    }

    # Cache result
    job_dir.mkdir(parents=True, exist_ok=True)
    with open(cache_file, "w") as f:
        json.dump(result, f)

    return result


async def run_pipeline_from_file(audio_path: Path, job_id: str, metadata: dict) -> dict:
    """Run analysis pipeline on a pre-existing audio file (uploaded by user)."""
    # Step 2: Separate vocals
    logger.info(f"Separating vocals for {job_id}")
    vocals_path = await asyncio.to_thread(separate_vocals, audio_path, job_id)

    # Step 3: Detect key
    logger.info(f"Detecting key for {job_id}")
    key_result = await asyncio.to_thread(detect_key, vocals_path)

    # Step 4: Detect tempo
    logger.info(f"Detecting tempo for {job_id}")
    tempo_result = await asyncio.to_thread(detect_tempo, audio_path)

    # Step 5: Detect chords
    logger.info(f"Detecting chords for {job_id}")
    chord_result = await asyncio.to_thread(detect_chords, audio_path)

    return {
        "metadata": metadata,
        "analysis": {
            "key": key_result,
            "tempo": tempo_result,
            "chords": chord_result,
        },
        "audio": {
            "vocalsUrl": f"/api/audio/{job_id}/vocals.wav",
        },
    }
