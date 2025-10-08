#!/usr/bin/env bash
set -euo pipefail
# start API in background
pnpm --filter ./apps/api dev &

# wait a moment so API binds, then start Web (foreground)
sleep 1
pnpm --filter ./apps/web dev
