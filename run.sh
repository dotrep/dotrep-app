set -euo pipefail
pkill -f "server/server.mjs" 2>/dev/null || true
pkill -f node 2>/dev/null || true
pnpm -v >/dev/null 2>&1 || npm i -g pnpm --force
pnpm --dir apps/web install
pnpm --dir apps/web build
node server/server.mjs
