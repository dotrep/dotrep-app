#!/bin/bash
set -euxo pipefail

echo "========================================="
echo "🔧 DEPLOYMENT BUILD STARTING"
echo "========================================="
echo "Node: $(node --version)"
echo "pnpm: $(pnpm --version)"
echo "PWD: $(pwd)"
echo "========================================="

echo "📦 Installing all dependencies..."
pnpm install 2>&1 || {
    echo "❌ pnpm install failed, trying without frozen lockfile..."
    pnpm install --no-frozen-lockfile 2>&1
}

echo "========================================="
echo "🏗️ Building Vite frontend in apps/web..."
echo "========================================="
cd apps/web
pnpm run build 2>&1

echo "========================================="
echo "✅ BUILD COMPLETED"
echo "========================================="
echo "Dist contents:"
ls -lah dist/ 2>&1 || echo "dist/ not found!"
echo "========================================="
