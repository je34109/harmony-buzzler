FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    git \
    gcc \
    g++ \
    curl \
    unzip \
    libsndfile1 \
    libfftw3-dev \
    && rm -rf /var/lib/apt/lists/*

# Install deno (required by yt-dlp for YouTube JS signature solving)
RUN curl -fsSL https://deno.land/install.sh | sh
ENV DENO_DIR="/root/.deno"
ENV PATH="${DENO_DIR}/bin:${PATH}"

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Pre-download yt-dlp remote components for YouTube JS challenges
RUN python -m yt_dlp --remote-components ejs:github --version || true

# Remove build tools to reduce image size
RUN apt-get purge -y --auto-remove gcc g++ && \
    rm -rf /var/lib/apt/lists/*

# Copy application
COPY app/ app/

# Create startup script (set Google DNS at runtime)
RUN printf '#!/bin/bash\necho "nameserver 8.8.8.8" > /etc/resolv.conf\necho "nameserver 8.8.4.4" >> /etc/resolv.conf\nexec uvicorn app.main:app --host 0.0.0.0 --port 7860\n' > /app/start.sh && \
    chmod +x /app/start.sh

EXPOSE 7860

CMD ["/app/start.sh"]
