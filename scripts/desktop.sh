#!/usr/bin/env bash

# Load .env if exists
if [ -f .env ]; then
  export $(cat .env | grep -v '#' | xargs)
fi

# Free ports 8000 and 3001 if previously occupied
kill -9 $(lsof -ti:8000) 2>/dev/null || true
kill -9 $(lsof -ti:3001) 2>/dev/null || true

echo "🚀 [1/2] Starting KobeanAudio Studio Backend on http://127.0.0.1:8000..."
source apps/api/.venv/bin/activate 2>/dev/null || true
(cd apps/api && python3 -m uvicorn main:app --host 127.0.0.1 --port 8000) &
BACKEND_PID=$!

trap "kill -9 $BACKEND_PID 2>/dev/null; exit 0" SIGINT SIGTERM EXIT

# Wait a moment for API backend to boot
sleep 1.2

echo "🖥️ [2/2] Launching KobeanAudio Native macOS Desktop App (Tauri 2.x)..."
pnpm --filter @kobeanaudio/desktop tauri dev
