#!/bin/sh
set -eu

repo_root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
compose_file="$repo_root/infra/game-log-search/compose.yaml"
env_file=${GAME_LOG_SEARCH_ENV_FILE:-"$repo_root/.env"}

if ! command -v docker >/dev/null 2>&1; then
  echo "docker is required" >&2
  exit 1
fi
if ! docker compose version >/dev/null 2>&1; then
  echo "Docker Compose v2 is required" >&2
  exit 1
fi
if [ ! -f "$env_file" ]; then
  echo "missing Compose env file: $env_file" >&2
  echo "create it from .env.example and set GAME_LOG_SEARCH_SYNTHESIS_MODEL" >&2
  exit 1
fi

exec docker compose \
  --project-name funqa-game-log-search \
  --env-file "$env_file" \
  --file "$compose_file" \
  up --build --detach --remove-orphans --wait --wait-timeout 900
