#!/usr/bin/env bash
set -euo pipefail

NODE_BIN="${NODE_BIN:-$(command -v node || true)}"

if [[ -z "$NODE_BIN" ]]; then
  echo "node executable not found in PATH" >&2
  exit 127
fi

"$NODE_BIN" scripts/build-functions.mjs
