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
- **Server Configuration**: Dual-process setup for same-origin cookie support:
  - **API Server**: Express on port 9000 (console output) - handles /api/* requests
  - **Vite Dev Server**: Port 5000 (webview output) - proxies /api/* to port 9000
  - This architecture ensures same-origin cookies work reliably without CORS issues
- **Session Management**: In-memory sessions using express-session with sameSite: 'lax' cookies, 7-day duration. Session stores { address, method, ts }.

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