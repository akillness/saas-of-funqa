#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

BACKEND_ID="${BACKEND_ID:-funqa-web}"
PROJECT_ID="${PROJECT_ID:-saas-of-funqa}"

if command -v firebase >/dev/null 2>&1; then
  FIREBASE_BIN=(firebase)
else
  FIREBASE_BIN=(npx firebase-tools@latest)
fi

echo "Type checking before deploy..."
npm run typecheck

echo "Building web app before deploy..."
npm run build:web

echo "Deploying App Hosting backend ${BACKEND_ID} to project ${PROJECT_ID}"
"${FIREBASE_BIN[@]}" deploy --project "$PROJECT_ID" --only "apphosting:${BACKEND_ID}"
