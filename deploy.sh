#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

BACKEND_ID="${BACKEND_ID:-saas-of-funqa}"
PROJECT_ID="${PROJECT_ID:-saas-of-funqa}"
DEPLOY_TARGET="${1:-}"
FIREBASE_TOKEN_ARGS=()
APPHOSTING_DEPLOY_MAX_ATTEMPTS="${APPHOSTING_DEPLOY_MAX_ATTEMPTS:-4}"
APPHOSTING_DEPLOY_RETRY_SECONDS="${APPHOSTING_DEPLOY_RETRY_SECONDS:-20}"
# Transient Firebase/Google Cloud deploy errors worth retrying with backoff.
# - "unable to queue the operation": App Hosting rollout queue busy
# - "concurrent policy changes" / "setIamPolicy" / ETag mismatch: IAM read-modify-write race
# - HTTP 409/429/503: conflict / rate limit / backend unavailable
RETRYABLE_DEPLOY_PATTERN="unable to queue the operation|concurrent policy changes|setiampolicy|did not match the current policy|http error: (409|429|503)"

if [[ -n "${FIREBASE_TOKEN:-}" ]]; then
  FIREBASE_TOKEN_ARGS=(--token "$FIREBASE_TOKEN")
fi

if command -v firebase >/dev/null 2>&1; then
  FIREBASE_BIN=(firebase)
else
  FIREBASE_BIN=(npx firebase-tools@latest)
fi

run_deploy_command() {
  local attempt=1
  local log_file
  local status

  while (( attempt <= APPHOSTING_DEPLOY_MAX_ATTEMPTS )); do
    log_file="$(mktemp)"
    set +e
    "$@" 2>&1 | tee "$log_file"
    status=${PIPESTATUS[0]}
    set -e

    if [[ "$status" -eq 0 ]]; then
      rm -f "$log_file"
      return 0
    fi

    if grep -Eqi "$RETRYABLE_DEPLOY_PATTERN" "$log_file" && (( attempt < APPHOSTING_DEPLOY_MAX_ATTEMPTS )); then
      local backoff=$(( APPHOSTING_DEPLOY_RETRY_SECONDS * attempt ))
      echo "Transient deploy error detected. Retrying in ${backoff}s (attempt ${attempt}/${APPHOSTING_DEPLOY_MAX_ATTEMPTS})..."
      rm -f "$log_file"
      sleep "$backoff"
      attempt=$((attempt + 1))
      continue
    fi

    rm -f "$log_file"
    return "$status"
  done

  echo "App Hosting deploy retries were exhausted"
  return 1
}

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
  DEPLOY_CMD=("${FIREBASE_BIN[@]}" deploy --project "$PROJECT_ID" --force --non-interactive)
  if [[ ${#FIREBASE_TOKEN_ARGS[@]} -gt 0 ]]; then
    DEPLOY_CMD+=("${FIREBASE_TOKEN_ARGS[@]}")
  fi
  DEPLOY_CMD+=(--only "apphosting:${BACKEND_ID}")
  run_deploy_command "${DEPLOY_CMD[@]}"
else
  echo "Deploying Firebase Functions, Firestore/Storage policy, and App Hosting backend ${BACKEND_ID} to project ${PROJECT_ID}"
  DEPLOY_CMD=("${FIREBASE_BIN[@]}" deploy --project "$PROJECT_ID" --force --non-interactive)
  if [[ ${#FIREBASE_TOKEN_ARGS[@]} -gt 0 ]]; then
    DEPLOY_CMD+=("${FIREBASE_TOKEN_ARGS[@]}")
  fi
  DEPLOY_CMD+=(--only "functions,firestore:rules,firestore:indexes,storage,apphosting:${BACKEND_ID}")
  run_deploy_command "${DEPLOY_CMD[@]}"
fi
