# .rep Platform

## Overview
.rep is a Web3 identity and reputation platform built on the Base blockchain. Its purpose is to enable users to claim soulbound `.rep` names as their onchain identity, offering features for reputation tracking, social networking, and decentralized file storage. The project aims to provide a robust and decentralized identity layer, enhancing user interaction within the Web3 ecosystem.

## User Preferences
- Preferred communication style: Simple, everyday language.
- **UI Preference**: Use the slim UI from `/src` (index.html loads `/src/main.tsx`), NOT the feature-complete UI from `/client/src`. The slim UI is cleaner and preferred.

## System Architecture

### Monorepo Structure
The project utilizes a Turborepo-based monorepo, encompassing a React + Vite frontend (`apps/web`) and an Express.js backend API (`apps/api`), with shared TypeScript types in `packages/shared`.

### Frontend Architecture (apps/web)
- **Technology Stack**: React 18 with TypeScript, Vite 5, wouter for routing.
- **Routing**: Client-side routing using wouter's `<Route>` and `<Switch>` components. Routes: `/` (home), `/claim` and `/reserve` (claim page), `/discover`, `/wallet`.
- **Styling**: Vanilla CSS with custom properties for a deep navy/space theme, accented with neon blue, teal, and orange. Features glow effects and a responsive, mobile-first design.
- **Key Features**:
    - **Homepage**: A single-page hero layout with a floating particle background and dual calls to action for claiming and discovering `.rep` names.
    - **Claim Page**: A two-column layout for `.rep` name reservation, featuring real-time validation, a multi-state CTA flow, and integrated WalletConnect. It prioritizes Base Wallet connectivity.
    - **Rep Dashboard**: A session-protected dashboard at `/rep-dashboard` featuring:
      - **Pulse Gauge Hero**: Animated circular gauge showing user's pulse score (base 55 + activity bonuses)
      - **Live Stats Display**: XP points, signals sent, login streak
      - **Integrated Tabs**: Wallet, Messages (FSN), Vault (client-side encrypted IPFS storage), and Chat (AI agents)
      - **Session Guard**: Automatically redirects to /claim if not authenticated
      - **Auto-Redirect**: Users land here immediately after claiming their .rep name
- **Web3 Integration**: Uses Wagmi v2 and Viem for blockchain interactions, configured for Base Mainnet (8453). Wallet connection supports injected providers and WalletConnect, with auto-reconnect logic and iframe detection for Replit compatibility.
- **Component Design**: Functional React components, inline SVG for graphics, CSS keyframes for animations, and client-side state management.

### Backend Architecture (apps/web)
- **Technology Stack**: Express.js TypeScript server running via tsx on port 9000.
- **API Design**: RESTful endpoints for authentication and `.rep` name reservations. All endpoints persist to PostgreSQL via Drizzle ORM.
- **Server Configuration**: 
  - **Development**: Dual-process setup for same-origin cookie support:
    - API Server: Express on port 9000 (console output) - handles /api/* requests
    - Vite Dev Server: Port 5000 (webview output) - proxies /api/* to port 9000
    - This architecture ensures same-origin cookies work reliably without CORS issues
    - **IMPORTANT**: Vite uses `vite.config.mjs` (not `.ts`). Proxy config: `'/api': { target: 'http://localhost:9000' }`
  - **Production**: Single-process server configuration:
    - Server binds to 0.0.0.0 (all interfaces) and uses PORT environment variable
    - Serves built Vite static files from `dist/` directory
    - All API routes remain at `/api/*` prefix
    - SPA routing handled by serving index.html for non-API routes
- **Session Management**: PostgreSQL session store using connect-pg-simple with sameSite: 'lax' cookies, 7-day duration. Session stores { address, method, ts }.
- **Health Endpoints**: 
  - `GET /` - Root health check (returns "OK" 200) for Cloud Run
  - `GET /api/health` - Detailed health check with environment info
- **API Endpoint Pattern**: `/api/rep/check` - Real-time name availability checking with database lookup
- **Production Security**:
  - Rate limiting via express-rate-limit:
    - Wallet-based limits for authenticated endpoints (5 claims/hr, 10 social starts/day, 20 verifies/hr)
    - IP-based limits for auth endpoints (20 attempts/15min)
  - Environment validation at startup (DATABASE_URL, SESSION_SECRET required)
  - PostgreSQL session persistence (no session loss on restart)

### Data Architecture
- **Database**: Production PostgreSQL database using Drizzle ORM located in `apps/web/db/`
- **Name Registry**: `.rep` name reservations stored in `reservations` table with:
  - Text UUID primary key (gen_random_uuid)
  - Lowercase name and address fields for case-insensitive matching
  - Unique indexes on name_lower and (address_lower, name_lower) pair
  - Idempotent reserve logic: same wallet can re-claim same name
  - 409 conflicts on duplicate names or race conditions
- **Data Flow**: Authenticated claim flow creates reservation records tied to session wallet address.

### Authentication & Identity
- **Web3 Integration**: Utilizes Wagmi v2 for wallet connections, supporting MetaMask and WalletConnect. Auto-reconnect and iframe detection are implemented.
- **Claim Flow**: Simplified wallet-first authentication using window.ethereum. Available helper: `apps/web/src/loginFlow.ts` with:
  - `connectWallet()` - Requests wallet connection
  - `waitForSession()` - Polls /api/auth/me until session exists
  - `startLogin(name)` - Atomic flow: connect → verify → lookup → reserve → redirect
- **Session-Based Auth**: After verification, users receive a 7-day in-memory session.
- **Auth Routes**:
  - `POST /api/auth/verify` - Creates session with { address, method, ts }, returns 200 on success
  - `GET /api/auth/me` - Returns current session data or 401 if unauthorized
  - `GET /api/rep/lookup-wallet?address=0x...` - Finds existing reservations (prefers session address)
  - `POST /api/rep/reserve { name }` - **Session-protected** - reserves name for session.user.address only
  - `GET /api/health` - Health check endpoint
- **Security Implementation**:
  - **Session Enforcement**: /api/rep/reserve requires active session, ignores client-supplied address
  - **Address Normalization**: All wallet addresses lowercased before storage/comparison
  - **Database Constraints**: Unique indexes on name_lower and (address_lower, name_lower)
  - **Idempotent Reserve**: Same wallet claiming same name returns existing reservation
  - **Race Condition Handling**: PostgreSQL unique violations (23505) return 409 "name_taken"
  - **Session Security**: HttpOnly cookies, sameSite: 'lax', 7-day expiry

### File Storage & Vault System
- **Encryption**: Client-side AES-GCM 256-bit encryption with a zero-knowledge server design.
- **Decentralized Storage**: Production Pinata SDK integration for IPFS uploads. Files uploaded via Node.js buffer→Blob→File flow, with CIDs and metadata persisted to vault_items table.

### AI Integration
- **OpenAI Chat**: Production OpenAI API integration for AI assistant conversations. All user and assistant messages persisted to chat_history table for conversation continuity.

### Phase 0 Gamification System
- **Namespace Isolation**: All Phase 0 code isolated in `apps/web/src/rep_phase0/` to avoid touching existing claim/auth/wallet code
- **Mission System**: 5 missions with total of 240 XP:
  - Charge Signal (50 XP) - Verify wallet and activate .rep identity
  - Link Echo (40 XP) - Connect social account (gated by Charge Signal)
  - Go Live (60 XP) - Login on 3 different days within 7 days (gated by Charge Signal)
  - Leave Mark (60 XP) - Post first on-chain attestation (gated by Charge Signal)
  - Discover Network (30 XP) - View 3 other active Signals (gated by Charge Signal)
- **Database Tables** (in `shared/schema.ts`):
  - `rep_phase0_missions` - Mission definitions with slug, title, description, XP
  - `rep_phase0_progress` - User progress tracking with unique constraint on (user_wallet, mission_slug)
  - `rep_phase0_heartbeat` - Daily login tracking with unique constraint on (user_wallet, day)
- **XP Utilities** (`apps/web/src/rep_phase0/lib/xp.ts`):
  - `seedMissions()` - Idempotent mission seeding
  - `getUserState(user)` - Calculates mission state with gate logic
  - `setProgress(user, mission, status, meta)` - Updates mission progress
  - `recordHeartbeat(user, dayISO)` - Tracks daily logins
  - `countHeartbeatDays(user, fromISO)` - Counts login days for Go Live validation
- **API Routes** (session-protected):
  - `POST /api/rep_phase0/seed` - Seeds missions into database
  - `GET /api/rep_phase0/state` - Returns user's mission state and total XP
  - `POST /api/rep_phase0/progress` - Updates mission progress with server-side validation for Go Live
  - `POST /api/rep_phase0/heartbeat` - Records daily login heartbeat
- **Frontend**:
  - `/missions` route with MissionsDashboard component
  - Styled with .rep platform theme (dark navy/space with neon accents)
  - XP progress bar, mission cards with locked/available/completed states
  - Auto-heartbeat on page load for authenticated users
- **Feature Flag**: System can be gated by `DASHBOARD_PHASE0=1` environment variable (not currently enforced)

## External Dependencies

### Blockchain & Web3
- **Base Network**
- **Wagmi** (React hooks for Ethereum)
- **Viem** (TypeScript Ethereum library)
- **Ethers.js** (Ethereum wallet operations)
- **WalletConnect** (Multi-wallet connection protocol)

### UI & Component Libraries
- **Radix UI** (Headless UI components)
- **React Query** (@tanstack/react-query)
- **FingerprintJS** (Browser fingerprinting)

### Storage & Infrastructure
- **PostgreSQL**
- **Drizzle ORM**
- **Pinata SDK** (IPFS pinning service)
- **IPFS** (Decentralized file storage)

### Development & Build Tools
- **TypeScript**
- **Vite**
- **Turborepo**
- **Hardhat** (Smart contract development)

### Email & Communications
- **SendGrid**

### Session & Authentication
- **express-session**
- **connect-pg-simple**

### Smart Contracts
- **Solidity**
- **OpenZeppelin**

## Production Deployment

### Deployment Configuration
- **Target**: VM deployment (stateful server for session persistence)
- **Build Command**: `pnpm install && pnpm --filter web build` (installs deps and builds Vite frontend)
- **Run Command**: `cd apps/web && NODE_ENV=production pnpm exec tsx server.ts` (starts Express server in production mode)
- **Port**: Uses PORT environment variable from Cloud Run (defaults to 9000 for local dev)
- **Bind Address**: Binds to 0.0.0.0 in production for Cloud Run health checks
- **Package Manager**: Uses pnpm (monorepo-compatible)

### Required Environment Variables
```bash
# Critical (server won't start without these)
DATABASE_URL=postgresql://user:pass@host:5432/dbname  # Production PostgreSQL connection
SESSION_SECRET=<strong-random-secret-minimum-32-chars>  # Session encryption key

# Recommended
ADMIN_WALLETS=0xYourAdminAddress1,0xYourAdminAddress2  # Comma-separated admin addresses
ECHO_ENABLED=1                                          # Enable social proof features
ECHO_X_ENABLED=1                                        # Enable X/Twitter verification
NODE_ENV=production                                     # Optimizes startup and performance

# Optional (have defaults)
BASE_RPC_URL=https://mainnet.base.org                   # Base network RPC endpoint
PORT=8080                                               # Server port (Cloud Run provides this)
```

### Deployment Checklist
1. ✅ Set all required environment variables in deployment secrets
2. ✅ Generate strong SESSION_SECRET (use crypto.randomBytes(32).toString('hex'))
3. ✅ Configure production DATABASE_URL with connection pooling
4. ✅ Set NODE_ENV=production for optimized performance
5. ✅ Verify ADMIN_WALLETS contains your wallet address
6. ✅ Enable feature flags (ECHO_ENABLED, ECHO_X_ENABLED)
7. ✅ Test health endpoints: GET / (returns "OK") and GET /api/health

### Health Check Endpoints
- `GET /` - Returns "OK" 200 for Cloud Run health checks (fast response)
- `GET /api/health` - Returns JSON with environment info for monitoring

### Production Architecture
- Single Express server process serves both API and static files
- Vite build output (dist/) served as static files
- API routes remain at /api/* prefix
- Client-side routing handled by serving index.html for non-API routes
- Server binds to 0.0.0.0 to accept Cloud Run health checks
- PostgreSQL session store ensures no session loss on restart/scaling