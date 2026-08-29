#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

cleanup() {
  rm -f functions/.env.local functions/.secret.local
}
trap cleanup EXIT

npm run build:functions
cat > functions/.env.local <<'EOF'
DISABLE_AUTH=true
RAG_LIVE_EMBEDDINGS=0
EOF
cat > functions/.secret.local <<'EOF'
SECRET_ENCRYPTION_KEY=local-dev-secret-key-32-bytes
GEMINI_API_KEY=local-smoke-dummy-gemini-key
EOF

npx firebase-tools@latest emulators:exec --only functions,firestore,storage \
  "node scripts/smoke-functions.mjs"
