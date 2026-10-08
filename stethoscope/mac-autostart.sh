#!/usr/bin/env bash
# macOS 백그라운드 상시 실행 등록 — 터미널을 닫아도, 재부팅해도 자동 실행됩니다.
#   설치: bash mac-autostart.sh        해제: bash mac-autostart.sh uninstall
set -e
SRC="$(cd "$(dirname "$0")" && pwd)"
DEST="$HOME/stethoscope"          # 다운로드 폴더는 macOS 권한 제한이 있어 홈 폴더로 옮겨 설치
LABEL="com.stethoscope.app"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"
PORT="${PORT:-8000}"

if [ "$1" = "uninstall" ]; then
  launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null || true
  rm -f "$PLIST"
  echo "✅ 백그라운드 실행을 해제했습니다. (데이터는 $DEST/data 에 그대로 있습니다)"
  exit 0
fi

launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null || true
if lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "❌ 이미 다른 창에서 실행 중입니다. 그 터미널 창에서 Ctrl+C로 끈 뒤 다시 실행하세요."
  exit 1
fi

if [ "$SRC" != "$DEST" ]; then
  echo "▶ $DEST 로 복사 (등록한 병원·데이터 포함)"
  mkdir -p "$DEST"
  rsync -a --exclude .venv "$SRC/" "$DEST/"
fi
cd "$DEST"
INSTALL_ONLY=1 bash ./start.sh
mkdir -p data "$HOME/Library/LaunchAgents"

cat > "$PLIST" <<PL
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>$LABEL</string>
  <key>WorkingDirectory</key><string>$DEST</string>
  <key>ProgramArguments</key><array>
    <string>/bin/bash</string><string>-c</string>
    <string>[ -f .env ] &amp;&amp; set -a &amp;&amp; . ./.env &amp;&amp; set +a; exec ./.venv/bin/python -m app serve --port $PORT</string>
  </array>
  <key>EnvironmentVariables</key><dict><key>PATH</key><string>/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin</string></dict>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>StandardOutPath</key><string>$DEST/data/server.log</string>
  <key>StandardErrorPath</key><string>$DEST/data/server.log</string>
</dict></plist>
PL

launchctl bootstrap "gui/$(id -u)" "$PLIST"
for _ in $(seq 1 30); do curl -s -o /dev/null "http://localhost:$PORT" && break; sleep 1; done
echo ""
echo "✅ 백그라운드 실행 완료 — 이제 터미널을 닫아도 됩니다. 맥을 재시동해도 자동으로 켜집니다."
echo "   주소: http://localhost:$PORT   로그: $DEST/data/server.log"
echo "   해제: bash $DEST/mac-autostart.sh uninstall"
open "http://localhost:$PORT" 2>/dev/null || true
