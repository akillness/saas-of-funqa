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

echo "Starting Firebase emulators (App Hosting + Functions + Auth + Firestore)"
"${FIREBASE_BIN[@]}" emulators:start --only apphosting,functions,auth,firestore
