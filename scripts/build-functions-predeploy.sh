#!/usr/bin/env bash
set -euo pipefail

REAL_NODE=""

if [[ -n "${NVM_BIN:-}" && -x "${NVM_BIN}/node" ]]; then
  REAL_NODE="${NVM_BIN}/node"
fi

if [[ -z "$REAL_NODE" ]]; then
  for candidate in "/opt/homebrew/bin/node" "/usr/local/bin/node" "/usr/bin/node"; do
    if [[ -x "$candidate" ]]; then
      REAL_NODE="$candidate"
      break
    fi
  done
fi

if [[ -z "$REAL_NODE" ]]; then
  REAL_NODE="$(command -v node || true)"
fi

if [[ -z "$REAL_NODE" ]]; then
  echo "node executable not found" >&2
  exit 127
fi

echo "Predeploy: compiling functions using Node at $REAL_NODE"
"$REAL_NODE" scripts/build-functions.mjs
