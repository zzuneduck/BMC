#!/usr/bin/env bash
# 너만을 위한 청진기 — 설치 + 실행 (macOS / Linux)
set -e
cd "$(dirname "$0")"
PY=${PYTHON:-python3}
if ! command -v "$PY" >/dev/null 2>&1 || ! "$PY" -c 'import sys; sys.exit(0 if sys.version_info >= (3, 10) else 1)'; then
  echo "❌ Python 3.10 이상이 필요합니다. https://www.python.org/downloads/ 에서 설치 후 다시 실행하세요."
  exit 1
fi
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
[ "${INSTALL_ONLY:-}" = "1" ] && exit 0
[ -f .env ] && set -a && source .env && set +a
echo "▶ 브라우저에서 http://localhost:${PORT:-8000} 접속 → 설정 → 병원 등록 (종료: 이 창에서 Ctrl+C)"
(sleep 3; command -v open >/dev/null && open "http://localhost:${PORT:-8000}") &
exec python -m app serve
