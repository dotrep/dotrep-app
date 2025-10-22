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

### Backend Architecture (apps/api)
- **Technology Stack**: Express.js TypeScript server running via tsx, integrated with Vite in middleware mode for development.
- **API Design**: RESTful endpoints for `.rep` names, wallet management, messaging, vault storage, and AI chat. All endpoints persist to PostgreSQL via Drizzle ORM.
- **Server Configuration**: Single server on port 5000 (apps/web/server.ts); HMR is disabled in development for stability in the Replit environment.
- **Session Management**: PostgreSQL-backed sessions using express-session + connect-pg-simple with 7-day session duration and secure cookie settings.

### Data Architecture
- **Database**: Production PostgreSQL database using Drizzle ORM. Schema includes tables for users, FSN domains, wallet addresses, transactions, messages, contacts, vault items, and chat history.
- **Name Registry**: `.rep` name reservations stored in PostgreSQL with conflict handling and automatic wallet provisioning.
- **Data Flow**: All mock data replaced with real database operations - claim flow creates user + domain + wallet records; dashboard tabs query live PostgreSQL data.

### Authentication & Identity
- **Web3 Integration**: Utilizes Wagmi v2 for wallet connections, supporting MetaMask and WalletConnect. Auto-reconnect and iframe detection are implemented.
- **Claim Flow**: Production-ready wallet-first authentication with cryptographic signature verification. Users must connect wallet, sign a message proving ownership, and pass backend verification before claiming. Each wallet can only claim one .rep name (enforced at both application and database levels).
- **Session-Based Auth**: After claiming, users receive a 7-day PostgreSQL-backed session. Returning users can reconnect wallet to authenticate without re-claiming.
- **Auth Routes**:
  - `POST /api/auth/connect` - Verifies wallet signature and creates session for returning users
  - `GET /api/auth/me` - Returns current session data (userId, walletAddress, repName)
  - `POST /api/auth/logout` - Destroys session
  - `GET /api/user/stats` - Returns pulse score, XP, signals, beacon status (session-protected)
- **Security Implementation**:
  - **Exact Message Matching**: Backend reconstructs and validates exact message content (`Claim {name}.rep on Base\n\nWallet: {address}\nTimestamp: {timestamp}`)
  - **Signature Verification**: Uses viem's `recoverMessageAddress` to cryptographically verify wallet ownership
  - **Timestamp Freshness**: 5-minute window prevents replay attacks
  - **Database Constraint**: Unique index `rep_reservations_wallet_unique` on `wallet_address` enforces one wallet = one .rep name
  - **Multi-Layer Validation**: Format check → exact match → timestamp check → signature verification → duplicate check → database constraint
  - **Session Security**: HttpOnly cookies, 7-day expiry, PostgreSQL persistence via connect-pg-simple

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