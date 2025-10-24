#!/bin/bash
set -euxo pipefail

echo "========================================="
echo "🚀 STARTING PRODUCTION SERVER"
echo "========================================="
echo "Node: $(node --version)"
echo "pnpm: $(pnpm --version)"
echo "PWD: $(pwd)"
echo "========================================="

# CRITICAL: Set production environment BEFORE checking anything
export NODE_ENV=production
export PORT=${PORT:-5000}

echo "Environment Variables:"
echo "  NODE_ENV: $NODE_ENV"
echo "  PORT: $PORT"
echo "  DATABASE_URL: ${DATABASE_URL:+[SET]}"
echo "  SESSION_SECRET: ${SESSION_SECRET:+[SET]}"
echo "========================================="

cd apps/web

# Verify dist folder exists
echo "Checking dist folder..."
if [ -d "dist" ]; then
  echo "✅ dist/ folder found"
  ls -lah dist/ | head -5
else
  echo "❌ dist/ folder NOT found - build may have failed!"
  exit 1
fi

echo "========================================="
echo "Starting server on port $PORT..."
echo "Health check will be available at http://0.0.0.0:$PORT/"
echo "========================================="

# Start server and capture PID for health check
pnpm exec tsx server.ts &
SERVER_PID=$!

# Wait for server to be ready
echo "Waiting for server to start..."
READY=false
for i in {1..30}; do
  if curl -f -s -o /dev/null http://localhost:$PORT/api/health 2>/dev/null; then
    echo "✅ Server is responding to health checks!"
    READY=true
    break
  fi
  echo "  Attempt $i/30: Server not ready yet..."
  sleep 1
done

# Fail fast if server never became healthy
if [ "$READY" = false ]; then
  echo "❌ Server failed to respond after 30 seconds!"
  echo "Killing server process $SERVER_PID..."
  kill $SERVER_PID 2>/dev/null || true
  exit 1
fi

# Bring server to foreground
echo "Server is healthy, continuing to run..."
wait $SERVER_PID
