# Cloud Run Deployment Configuration

## ✅ Changes Made

1. **Switched to Autoscale deployment** (better for web apps than VM)
2. **Health check endpoints ready**:
   - `/` - Instant 200 OK for non-browser requests
   - `/healthz` - Instant 200 OK  
   - `/api/health` - JSON response with status

## 🚀 Deploy Settings (Configure in Replit Deploy)

### Required Deployment Secrets
Set these in **Deploy → Deployment Secrets**:

```
DATABASE_URL=<your-postgres-connection-string>
SESSION_SECRET=<at-least-32-characters>
ADMIN_WALLETS=<comma-separated-wallet-addresses>
```

### Optional Feature Flags
```
ECHO_ENABLED=1
ECHO_X_ENABLED=1
TWITTER_ENABLED=1
DASHBOARD_PHASE0=1
```

### Health Check Configuration
**Set these in Deploy → Advanced Settings → Health Check**:

- **Health check path**: `/healthz`
- **Initial delay**: 10 seconds
- **Interval**: 5 seconds
- **Timeout**: 2 seconds
- **Success threshold**: 1
- **Failure threshold**: 3

**CRITICAL**: Use `/healthz` (NOT `/api/health`) - this endpoint responds instantly without database checks.

### Port Configuration
The server automatically binds to:
- **Production**: Port 5000 (or $PORT from Cloud Run)
- **Development**: Port 9000 (local API server)

## 🔍 How to Deploy

1. **Set deployment secrets** (see above)
2. **Click Deploy button** in Replit
3. **Wait for build** (2-3 minutes)
4. **Health checks should pass** within 30 seconds
5. **Your site will be live!**

## 🐛 If Deployment Fails

### Check deployment logs for:
1. **Environment validation errors** - Missing required secrets
2. **Build errors** - Check deploy-build.sh output
3. **Health check timeouts** - Increase initial delay to 60s

### Quick fix commands:
```bash
# Test environment validation locally
pnpm dlx tsx scripts/check-env.ts

# Test production server locally
NODE_ENV=production PORT=5000 pnpm exec tsx apps/web/server.ts
```

## 📊 Server Startup Sequence

1. ✅ Environment validation (deploy-start.sh)
2. ✅ Server binds to port 5000
3. ✅ Health endpoints respond instantly
4. ✅ Deferred validation runs asynchronously
5. ✅ Server fully initialized

The server responds to health checks **immediately** even if environment validation is still running.
