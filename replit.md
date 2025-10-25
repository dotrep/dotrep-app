# .rep Platform

## Overview
.rep is a Web3 identity and reputation platform built on the Base blockchain. It enables users to claim soulbound `.rep` names as their onchain identity, offering features for reputation tracking, social networking, and decentralized file storage. The project aims to provide a robust and decentralized identity layer, enhancing user interaction within the Web3 ecosystem.

## User Preferences
- Preferred communication style: Simple, everyday language.
- **UI Preference**: Use the slim UI from `/src` (index.html loads `/src/main.tsx`), NOT the feature-complete UI from `/client/src`. The slim UI is cleaner and preferred.

## System Architecture

### Monorepo Structure
The project uses a Turborepo monorepo, including a React + Vite frontend (`apps/web`), an Express.js backend API (`apps/api`), and shared TypeScript types (`packages/shared`).

### Frontend Architecture (apps/web)
- **Technology Stack**: React 18 with TypeScript, Vite 5, wouter for routing.
- **Styling**: Vanilla CSS with a deep navy/space theme, neon accents, glow effects, and a responsive, mobile-first design.
- **Key Features**:
    - **Homepage**: Single-page hero layout with a floating particle background and calls to action.
    - **Claim Page**: Two-column layout for `.rep` name reservation, including real-time validation and integrated WalletConnect, prioritizing Base Wallet.
    - **Rep Dashboard**: Session-protected dashboard at `/rep-dashboard` featuring a Pulse Gauge Hero, live stats display, integrated tabs (Wallet, Messages, Vault, Chat), session guard, and auto-redirect post-claim.
- **Web3 Integration**: Uses Wagmi v2 and Viem for Base Mainnet blockchain interactions. Supports injected providers and WalletConnect with auto-reconnect.

### Backend Architecture (apps/web)
- **Technology Stack**: Express.js TypeScript server running via `tsx`.
- **API Design**: RESTful endpoints for authentication and `.rep` name reservations, persisting data to PostgreSQL via Drizzle ORM.
- **Server Configuration**:
  - **Development**: Dual-process setup (Express on port 9000, Vite Dev Server on port 5000 with proxy) for same-origin cookie support.
  - **Production**: Single-process server optimized for Cloud Run, serving built Vite static files and API routes, binding to 0.0.0.0 on port 5000.
- **Session Management**: PostgreSQL session store using `connect-pg-simple` with `sameSite: 'lax'` cookies and a 7-day duration.
- **Health Endpoints**: `/healthz` (instant "OK"), `/` (instant "OK" for non-browser requests, serves app to browsers), `/api/health` (detailed info).
- **Startup Sequence** (Cloud Run optimized):
  1. `deploy-start.sh` validates environment variables with Zod schema (`scripts/check-env.ts`) - fails fast with clear error messages if secrets missing
  2. Server binds to port IMMEDIATELY (before any validation or database setup)
  3. Health check endpoints `/` and `/healthz` respond instantly (<1ms)
  4. Environment validation happens AFTER server is listening (deferred async)
  5. If validation fails in production, server stays alive 5 seconds for health checks, then exits for Cloud Run restart
- **Environment Variables**: Validates DATABASE_URL (required), SESSION_SECRET (≥32 chars required), feature flags (ECHO_ENABLED, TWITTER_ENABLED, etc.), with conditional validation for dependent secrets.
- **Security**: Rate limiting (wallet-based and IP-based), Zod-based environment validation, and PostgreSQL session persistence.

### Data Architecture
- **Database**: PostgreSQL with Drizzle ORM.
- **Name Registry**: `.rep` name reservations stored in the `reservations` table with UUIDs, lowercase name/address fields, and unique indexes for case-insensitive matching and conflict resolution.

### Authentication & Identity
- **Web3 Integration**: Wagmi v2 for wallet connections (MetaMask, WalletConnect) with auto-reconnect.
- **Claim Flow**: Simplified wallet-first authentication with `loginFlow.ts` helper functions.
- **Session-Based Auth**: 7-day in-memory session after verification.
- **Auth Routes**: `POST /api/auth/verify`, `GET /api/auth/me`, `GET /api/rep/lookup-wallet`, `POST /api/rep/reserve`.
- **Security**: Session enforcement, address normalization, database constraints, idempotent reserve logic, race condition handling, and secure HttpOnly cookies.

### File Storage & Vault System
- **Encryption**: Client-side AES-GCM 256-bit encryption.
- **Decentralized Storage**: Pinata SDK integration for IPFS uploads, with CIDs and metadata stored in `vault_items`.

### AI Integration
- **OpenAI Chat**: OpenAI API integration for AI assistant conversations, with chat history persisted to `chat_history`.

### Phase 0 Gamification System
- **Namespace Isolation**: Code isolated in `apps/web/src/rep_phase0/`.
- **Mission System**: 5 missions totaling 240 XP with gate logic (Charge Signal, Link Echo, Go Live, Leave Mark, Discover Network).
- **Database Tables**: `rep_phase0_missions`, `rep_phase0_progress`, `rep_phase0_heartbeat`.
- **XP Utilities**: `seedMissions()`, `getUserState()`, `setProgress()`, `recordHeartbeat()`, `countHeartbeatDays()`.
- **API Routes**: `POST /api/rep_phase0/seed`, `GET /api/rep_phase0/state`, `POST /api/rep_phase0/progress`, `POST /api/rep_phase0/heartbeat`.
- **Frontend**: `/missions` route with `MissionsDashboard` component, XP progress bar, and mission cards.

## External Dependencies

### Blockchain & Web3
- **Base Network**
- **Wagmi**
- **Viem**
- **Ethers.js**
- **WalletConnect**

### UI & Component Libraries
- **Radix UI**
- **React Query** (`@tanstack/react-query`)
- **FingerprintJS**

### Storage & Infrastructure
- **PostgreSQL**
- **Drizzle ORM**
- **Pinata SDK**
- **IPFS**

### Development & Build Tools
- **TypeScript**
- **Vite**
- **Turborepo**
- **Hardhat**

### Email & Communications
- **SendGrid**

### Session & Authentication
- **express-session**
- **connect-pg-simple**

### Smart Contracts
- **Solidity**
- **OpenZeppelin**