#!/usr/bin/env bash

# Load .env if exists
if [ -f .env ]; then
  export $(cat .env | grep -v '#' | xargs)
fi

# Free ports 8000 and 3001 if previously occupied
kill -9 $(lsof -ti:8000) 2>/dev/null || true
kill -9 $(lsof -ti:3001) 2>/dev/null || true

echo "🚀 Starting KobeanAudio Unified Backend..."
source apps/api/.venv/bin/activate 2>/dev/null || true
(cd apps/api && .venv/bin/python3 -m uvicorn main:app --host 127.0.0.1 --port 8000) &
# Wait for API backend to be ready
echo "⏳ Waiting for API backend to be ready on http://127.0.0.1:8000..."
for i in {1..20}; do
  if curl -s http://127.0.0.1:8000/api/v1/engines >/dev/null 2>&1; then
    echo "✅ Backend is healthy and responding!"
    break
  fi
  sleep 0.4
done

echo "🌐 Starting KobeanAudio Next.js Studio on http://localhost:3001..."
pnpm --filter @kobeanaudio/web dev &
FRONTEND_PID=$!

trap "kill -9 $API_PID $FRONTEND_PID 2>/dev/null; exit 0" SIGINT SIGTERM EXIT

wait
