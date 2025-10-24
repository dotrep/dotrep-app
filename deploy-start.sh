#!/bin/bash
set -e

echo "🚀 Starting production server..."
echo "Node version: $(node --version)"
echo "NODE_ENV: ${NODE_ENV:-not set}"
echo "PORT: ${PORT:-not set}"

cd apps/web

# Set production environment
export NODE_ENV=production

# Use PORT from environment or default to 8080
export PORT=${PORT:-8080}

echo "Starting server on port $PORT..."
pnpm exec tsx server.ts
