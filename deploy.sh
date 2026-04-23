#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

BACKEND_ID="${BACKEND_ID:-saas-of-funqa}"
PROJECT_ID="${PROJECT_ID:-saas-of-funqa}"
DEPLOY_TARGET="${1:-}"
FIREBASE_TOKEN_ARGS=()

if [[ -n "${FIREBASE_TOKEN:-}" ]]; then
  FIREBASE_TOKEN_ARGS=(--token "$FIREBASE_TOKEN")
fi

if command -v firebase >/dev/null 2>&1; then
  FIREBASE_BIN=(firebase)
else
  FIREBASE_BIN=(npx firebase-tools@latest)
fi

echo "Type checking before deploy..."
npm run typecheck

echo "Building web app before deploy..."
npm run build:web

if [[ "$DEPLOY_TARGET" != "--apphosting" ]]; then
  echo "Building Firebase Functions bundle before deploy..."
  npm run build:functions
fi

echo "Removing local build artifacts before source upload..."
rm -rf apps/web/.next apps/web/.turbo

if [[ "$DEPLOY_TARGET" == "--apphosting" ]]; then
  echo "Deploying App Hosting backend ${BACKEND_ID} to project ${PROJECT_ID}"
  DEPLOY_CMD=("${FIREBASE_BIN[@]}" deploy --project "$PROJECT_ID")
  if [[ ${#FIREBASE_TOKEN_ARGS[@]} -gt 0 ]]; then
    DEPLOY_CMD+=("${FIREBASE_TOKEN_ARGS[@]}")
  fi
  DEPLOY_CMD+=(--only "apphosting:${BACKEND_ID}")
  "${DEPLOY_CMD[@]}"
else
  echo "Deploying Firebase Functions and App Hosting backend ${BACKEND_ID} to project ${PROJECT_ID}"
  DEPLOY_CMD=("${FIREBASE_BIN[@]}" deploy --project "$PROJECT_ID")
  if [[ ${#FIREBASE_TOKEN_ARGS[@]} -gt 0 ]]; then
    DEPLOY_CMD+=("${FIREBASE_TOKEN_ARGS[@]}")
  fi
  DEPLOY_CMD+=(--only "functions,apphosting:${BACKEND_ID}")
  "${DEPLOY_CMD[@]}"
fi
