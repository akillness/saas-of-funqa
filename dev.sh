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

export PORT="${PORT:-4300}"
export NEXT_PUBLIC_API_BASE_URL="${NEXT_PUBLIC_API_BASE_URL:-http://127.0.0.1:${PORT}}"

cleanup() {
  local exit_code="$?"
  if [[ -n "${API_PID:-}" ]]; then
    kill "$API_PID" >/dev/null 2>&1 || true
  fi
  exit "$exit_code"
}

trap cleanup EXIT INT TERM

echo "Starting API on :${PORT}"
npm run dev:api &
API_PID="$!"

echo "Starting Firebase App Hosting emulator on :5002"
"${FIREBASE_BIN[@]}" emulators:start --only apphosting,auth,firestore
