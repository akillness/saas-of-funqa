#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

if command -v firebase >/dev/null 2>&1; then
  FIREBASE_BIN=(firebase)
else
  FIREBASE_BIN=(npx firebase-tools@latest)
fi

if [[ ! -d node_modules ]]; then
  echo "Installing workspace dependencies..."
  npm install
fi

if [[ -f .env ]]; then
  set -a
  source .env
  set +a
fi

export NEXT_PUBLIC_API_BASE_URL="${NEXT_PUBLIC_API_BASE_URL:-http://127.0.0.1:5001/saas-of-funqa/asia-northeast3/api}"

echo "Building Firebase Functions bundle"
npm run build:functions

REQUIRED_PORTS=(3000 5001 9099 8080 9199)
for PORT in "${REQUIRED_PORTS[@]}"; do
  PIDS=$(lsof -ti:"$PORT" 2>/dev/null || true)
  if [[ -n "$PIDS" ]]; then
    echo "Port $PORT in use — killing conflicting process(es): $PIDS"
    echo "$PIDS" | xargs kill -9 2>/dev/null || true
    sleep 0.5
  fi
done

trap 'kill $(jobs -p) 2>/dev/null; exit' INT TERM EXIT

echo "Starting Next.js dev server"
npm --prefix apps/web run dev -- --port 3000 &
WEB_PID=$!

echo "Starting Firebase emulators (Functions + Auth + Firestore + Storage)"
"${FIREBASE_BIN[@]}" emulators:start --only functions,auth,firestore,storage &
EMULATOR_PID=$!

wait $WEB_PID $EMULATOR_PID
