#!/usr/bin/env bash
# 너만을 위한 청진기 — 설치 + 실행 (macOS / Linux)
set -e
cd "$(dirname "$0")"
PY=${PYTHON:-python3}
if [ ! -d .venv ]; then
  echo "▶ 가상환경 생성"; $PY -m venv .venv
fi
source .venv/bin/activate
if [ ! -f .venv/.installed ] || [ requirements.txt -nt .venv/.installed ]; then
  echo "▶ 패키지 설치 (처음 한 번, 몇 분 걸립니다)"
  pip install -q --upgrade pip
  pip install -q -r requirements.txt
  python -m playwright install chromium
  touch .venv/.installed
fi
[ -f .env ] && set -a && source .env && set +a
echo "▶ 브라우저에서 http://localhost:${PORT:-8000} 접속 → 설정 → 병원 등록"
exec python -m app serve
