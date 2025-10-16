# .rep Platform

## Overview

.rep is a Web3 identity and reputation platform built on Base blockchain. The platform enables users to claim soulbound `.rep` names that serve as their onchain identity, with features for reputation tracking, social networking, and decentralized file storage. The project is structured as a monorepo with separate web and API applications.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Monorepo Structure
- **Turborepo-based monorepo** with workspace management
- **apps/web**: React + Vite frontend application (port 5000)
- **apps/api**: Express.js backend API (port 5055)
- **packages/shared**: Shared TypeScript types and utilities

### Frontend Architecture (apps/web)

**Core Technology Stack:**
- React 18.3.1 with TypeScript
- Vite 5.4.10 as build tool and dev server
- **Vanilla CSS** with CSS custom properties (no Tailwind, no external CSS frameworks)
- Client-side routing using path-based navigation

**Design System:**
- CSS variables defined in `apps/web/src/styles/tokens.css` for colors, spacing, typography
- Deep navy/space theme with neon blue (#0052ff), teal (#00d4aa), and orange (#ff6b35) accents
- Glow effects using CSS shadows and rgba colors
- Responsive design with mobile-first approach

**Key Pages:**
- Homepage (`Home.tsx`) - Single continuous hero page with floating particle background
- Claim page (`Claim.tsx`) - Name reservation page with real-time validation
- Reserve page (`Reserve.tsx`) - Placeholder (redirects to /claim)
- Discover page (`Discover.tsx`) - Discovery placeholder

**Homepage Hero Design:**
- **Top Section:** Absolute positioning layout
  - `.rep` emblem (left) with orange→blue gradient ring and smooth pulse animation
  - "Your onchain reputation. Alive on Base." headline (center)
  - Dual CTAs: "Reserve your.rep" (primary, navigates to /claim) and "Discover.rep" (secondary)
  - Large transparent chameleon mascot (500×625px, right) with blue rim light glow
- **Bottom Section:** Left-aligned content flow
  - "Identity isn't minted. It's earned." headline in teal
  - Name chips (hidden but preserve layout spacing)
- Floating particle background (30 particles in brand colors: teal, blue, orange) with upward drift animation
- Assets: `chameleon_transparent.png` (homepage chameleon)

**Claim Page Design:**
- Two-column layout: left content, right chameleon mascot
- **Single Button Flow:**
  - Initial state: "Reserve your .rep" button, input hidden
  - Click reveals name input field with fixed ".rep" suffix and orange border
  - Button updates through states based on validation/wallet:
    1. "Check availability" (invalid/empty, disabled)
    2. "Checking..." (checking, disabled)
    3. "Name is taken" (unavailable, disabled)
    4. "Connect wallet to claim" (available, not connected)
    5. "Switch to Base to claim" (connected, wrong chain)
    6. "Reserve your .rep" (connected on Base, ready to reserve → POST /rep/reserve → redirect to /wallet)
- **Left Column:**
  - "Reserve your.rep" title
  - Validation rules text
  - Step progress: "1 Claim • 2 Link • 3 Done"
  - Real-time validation (3-32 chars, lowercase letters/numbers/hyphens, must start with letter)
  - Availability indicator (checkmark + status message)
- **Right Column:** Chameleon mascot with matrix-style background
- Same floating particle background as homepage
- Assets: `chameleon_claim.png` (claim page chameleon)

**Component Pattern:**
- Functional React components with hooks
- Inline SVG for graphics and animations
- CSS keyframes for animations (no external animation libraries)
- Simple client-side state management
- Motion preferences toggle respecting `prefers-reduced-motion`

### Backend Architecture

**Technology Stack:**
- Combined Express + Vite server on port 5000
- Vite in middleware mode for development
- Express for API routes
- JSON request/body parsing

**API Design:**
- RESTful endpoints for `.rep` name operations
- `/api/rep/check` - GET endpoint to check name availability
- `/api/rep/reserve` - POST endpoint for name reservation with wallet validation
- In-memory storage using Set for reserved names (development/mock)
- Name validation: 3-32 characters, lowercase letters/numbers/hyphens only, must start with letter
- Wallet address validation: 0x followed by 40 hexadecimal characters
- HTTP status codes: 400 (invalid input), 409 (name already reserved), 200 (success)

**Server Configuration:**
- Single server on port 5000 (apps/web/server.js)
- Express middleware handles API routes before Vite
- Vite middleware handles frontend assets (HMR disabled for stability)
- Binds to 0.0.0.0 for Replit environment
- **Note:** HMR (hot module replacement) is disabled to prevent refresh loops in Replit's webview environment. The app runs stably but requires manual refresh after code changes during development.

### Data Architecture

**Database Integration (Drizzle):**
- Drizzle ORM configured in `drizzle.config.ts`
- PostgreSQL dialect with migrations in `/migrations`
- Schema defined in `./shared/schema.ts`
- Environment-based DATABASE_URL configuration

**Name Registry:**
- Client-side validation before API calls
- Backend validation with reserved name filtering
- Availability checking via Set-based lookup (mock)
- Future blockchain integration prepared

### Authentication & Identity

**FSN (FreeSpace Network) Legacy System:**
- Wallet-first architecture with MetaMask/Coinbase Wallet support
- Session-based authentication with user sessions
- `.fsn` identity system (being transitioned to `.rep`)
- Soulbound token model - one wallet per name enforcement
- Device fingerprinting and IP tracking for identity verification

**Web3 Integration:**
- Wagmi v2 for blockchain interactions (injected connector for MetaMask/browser wallets)
- Viem for Ethereum operations
- **Base Mainnet (8453)** configured as default network for wallet connection
- Wallet connection uses direct wagmi hooks (useAccount, useConnect, useSwitchChain) in Claim.tsx
- Connector selection via name-based filtering: `connector.name.toLowerCase().includes('metamask')`
- Current claim flow is **API-based** (no smart contract interaction yet):
  - POST /rep/reserve endpoint validates wallet addresses and stores reservations in-memory
  - Success redirect to /wallet page after reservation
- **Note:** @metamask/sdk pinned to v0.28.2 (compatibility fix for Vite pre-bundling). The injected() connector is used instead of metaMask() SDK connector since basic wallet connection doesn't require MetaMask-specific features.
- **Network Configuration:** Base Mainnet set for MetaMask compatibility; contract addresses reference local/sepolia but aren't used in current mock claim flow

### File Storage & Vault System

**Encryption Architecture:**
- Client-side AES-GCM 256-bit encryption
- Zero-knowledge server design (server never sees unencrypted files)
- Local encryption key storage
- Integrity verification on download

**IPFS Integration:**
- Pinata provider for decentralized storage
- STEALTH mode (local testing) and PUBLIC mode (Base Sepolia)
- File metadata stored in database for fast queries
- CID anchoring on blockchain (Files contract)

### XP & Gamification System

**Points System:**
- On-chain XP ledger via Points smart contract
- Daily XP minting with idempotent batch processing
- Cron endpoints for automated XP distribution
- Event-driven UI updates (no polling)
- Level progression with configurable thresholds

**Reward Mechanics:**
- File uploads grant XP
- Social interactions earn points
- Streak tracking for consecutive days
- Badge unlock system based on achievements
- Visual feedback with toasts and celebrations

## External Dependencies

### Blockchain & Web3
- **Base Network** - Layer 2 blockchain (Sepolia testnet and mainnet)
- **Wagmi** (v2.16.8+) - React hooks for Ethereum
- **Viem** (v2.36.0+) - TypeScript Ethereum library
- **Ethers.js** (v6.15.0) - Ethereum wallet operations
- **Hardhat** - Smart contract development and deployment
- **WalletConnect** - Multi-wallet connection protocol

### UI & Component Libraries
- **Radix UI** - Headless UI components (accordion, dialog, dropdown, etc.)
- **React Query** (@tanstack/react-query v5.60.5+) - Data fetching and caching
- **FingerprintJS** (v4.6.2) - Browser fingerprinting for identity verification

### Storage & Infrastructure
- **PostgreSQL** - Primary database (via Neon or similar providers)
- **Drizzle ORM** - Type-safe database operations
- **Pinata SDK** (v2.1.0) - IPFS file pinning service
- **IPFS** - Decentralized file storage protocol

### Development & Build Tools
- **TypeScript** (v5.9.3+) - Type safety across frontend and backend
- **Vite** (v5.4.10) - Frontend build tool and dev server
- **Turborepo** (v2.5.8) - Monorepo orchestration
- **TSX** (v4.19.1) - TypeScript execution for Node.js
- **esbuild** - Fast JavaScript bundler

### Email & Communications
- **SendGrid** (@sendgrid/mail v8.1.5) - Transactional email service

### Session & Authentication
- **express-session** - Session management middleware
- **connect-pg-simple** - PostgreSQL session store

### Smart Contracts
- **Solidity** - Contract programming language
- **OpenZeppelin** - Security-audited contract libraries via Hardhat toolbox
- Three core contracts: Registry (names), Points (XP), Files (IPFS anchoring)