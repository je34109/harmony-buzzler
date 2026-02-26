FROM python:3.11-slim

# Install system dependencies
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

# Create startup script that sets Google DNS before launching
RUN echo '#!/bin/bash\necho "nameserver 8.8.8.8" > /etc/resolv.conf\necho "nameserver 8.8.4.4" >> /etc/resolv.conf\nexec uvicorn app.main:app --host 0.0.0.0 --port 7860' > /app/start.sh && \
    chmod +x /app/start.sh

EXPOSE 7860

CMD ["/app/start.sh"]
