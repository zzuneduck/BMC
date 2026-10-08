@echo off
chcp 65001 >nul
REM 너만을 위한 청진기 — 설치 + 실행 (Windows)
cd /d %~dp0
if not exist .venv (
  echo ▶ 가상환경 생성
  python -m venv .venv
)
call .venv\Scripts\activate.bat
if not exist .venv\.installed (
  echo ▶ 패키지 설치 (처음 한 번, 몇 분 걸립니다)
  python -m pip install -q --upgrade pip
  pip install -q -r requirements.txt
  python -m playwright install chromium
  type nul > .venv\.installed
)
echo ▶ 브라우저에서 http://localhost:8000 접속
start "" http://localhost:8000
python -m app serve
pause
