FROM python:3.11-slim

# Install system dependencies
# - gcc/g++: needed for madmom C extensions
# - ffmpeg: audio processing
# - nodejs: JS runtime for yt-dlp (YouTube extraction)
# - libsndfile1/libfftw3: audio libraries
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    git \
    gcc \
    g++ \
    libsndfile1 \
    libfftw3-dev \
    nodejs \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Remove build tools to reduce image size
RUN apt-get purge -y --auto-remove gcc g++ && \
    rm -rf /var/lib/apt/lists/*

# Copy application
COPY app/ app/

# HuggingFace Spaces uses port 7860
EXPOSE 7860

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]
