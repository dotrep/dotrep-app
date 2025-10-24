#!/bin/bash
set -euo pipefail

echo "========================================="
echo "🚀 STARTING PRODUCTION SERVER"
echo "========================================="
echo "Node: $(node --version)"
echo "PWD: $(pwd)"
echo "========================================="

# CRITICAL: Set production environment BEFORE starting server
export NODE_ENV=production
export PORT=${PORT:-5000}

echo "Environment:"
echo "  NODE_ENV: $NODE_ENV"
echo "  PORT: $PORT"
echo "  DATABASE_URL: ${DATABASE_URL:+[SET]}"
echo "  SESSION_SECRET: ${SESSION_SECRET:+[SET]}"
echo "========================================="

cd apps/web

# Verify dist folder exists (quick check, no expensive operations)
if [ ! -d "dist" ]; then
  echo "❌ ERROR: dist/ folder not found!"
  exit 1
fi

echo "✅ dist/ folder exists"
echo "Starting server on port $PORT..."
echo "========================================="

# Start server immediately - let Cloud Run handle health checks
exec pnpm exec tsx server.ts
