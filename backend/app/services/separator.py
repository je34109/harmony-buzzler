import subprocess
from pathlib import Path

from app.config import SEPARATED_DIR


def separate_vocals(audio_path: Path, video_id: str) -> Path:
    output_dir = SEPARATED_DIR / video_id
    vocals_path = output_dir / "vocals.wav"

    if vocals_path.exists():
        return vocals_path

    output_dir.mkdir(parents=True, exist_ok=True)

    # Run demucs
    subprocess.run(
        [
            "python", "-m", "demucs",
            "--two-stems", "vocals",
            "-n", "htdemucs",
            "--out", str(output_dir / "_raw"),
            str(audio_path),
        ],
        check=True,
        capture_output=True,
    )

    # Demucs outputs to _raw/htdemucs/<filename>/vocals.wav
    stem_name = audio_path.stem
    demucs_vocals = output_dir / "_raw" / "htdemucs" / stem_name / "vocals.wav"

    if not demucs_vocals.exists():
        # Try alternative path patterns
        candidates = list((output_dir / "_raw").rglob("vocals.wav"))
        if candidates:
            demucs_vocals = candidates[0]
        else:
            raise FileNotFoundError("Demucs did not produce vocals output")

    # Move to expected location
    demucs_vocals.rename(vocals_path)

    return vocals_path
