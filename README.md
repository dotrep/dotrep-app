# .rep — Your onchain reputation. Alive on Base.

**Live:** https://dotrep.io  
**Chain:** Base (chainId **8453**)  
**Tagline:** Identity isn’t minted — it’s earned.

## What this is
.repprotocol app: claim your `.rep`, connect wallet, complete missions, and build a visible reputation graph. Backend exposes health and API routes; frontend is Next.js.

## Stack
- **Frontend:** Next.js (React)
- **Backend:** Node/Express (single server binding to `$PORT` on `0.0.0.0`)
- **Deploy:** Replit Deployments
- **Health:** `GET /api/health → 200 OK`

## Run locally
```bash
pnpm install
# web build (standalone) + optional api build
pnpm run build:web
pnpm run build:api || true
pnpm start
# server listens on $PORT (default 5000)
