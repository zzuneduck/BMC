FROM python:3.12-slim
ENV PYTHONUNBUFFERED=1 TZ=Asia/Seoul STETHO_DATA_DIR=/data
RUN apt-get update && apt-get install -y --no-install-recommends fonts-nanum ffmpeg tzdata && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt && python -m playwright install --with-deps chromium
COPY app ./app
VOLUME /data
EXPOSE 8000
CMD ["python", "-m", "app", "serve"]
