import os
from pathlib import Path

# Directories
BASE_DIR = Path(os.environ.get("HB_DATA_DIR", "/tmp/harmony-buzzler"))
AUDIO_DIR = BASE_DIR / "audio"
SEPARATED_DIR = BASE_DIR / "separated"

# Create directories
AUDIO_DIR.mkdir(parents=True, exist_ok=True)
SEPARATED_DIR.mkdir(parents=True, exist_ok=True)

# Limits
MAX_DURATION_SECONDS = 600  # 10 minutes max
ALLOWED_HOSTS = os.environ.get(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,https://harmony-buzzler.vercel.app",
).split(",")
