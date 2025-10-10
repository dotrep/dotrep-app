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
- Homepage (`Home.tsx`) - Single continuous hero page matching design comp
- Reserve page (`Reserve.tsx`) - Name reservation placeholder
- Discover page (`Discover.tsx`) - Discovery placeholder

**Homepage Hero Design (Single Page):**
- **Top Section:** Absolute positioning layout
  - `.rep` emblem (left) with gradient ring (blue→teal→orange) and glow effects
  - "Your onchain reputation. Alive on Base." headline (center)
  - Dual CTAs: "Reserve your.rep" (primary) and "Discover.rep" (secondary)
  - Large transparent chameleon mascot (550x750px, right) with drop shadows and float animation
- **Bottom Section:** Left-aligned content flow
  - "Identity isn't minted. It's earned." headline in teal
  - People chips row (Olivia, Danibl, Ryan, Daniel)
  - "Composed on Base, verified by.rep" text
  - "● Built on Base. Defined by you." tagline with bullet
- Constellation star field background with twinkling animation
- Assets: `chameleon_transparent.png` (RGBA transparent PNG)

**Component Pattern:**
- Functional React components with hooks
- Inline SVG for graphics and animations
- CSS keyframes for animations (no external animation libraries)
- Simple client-side state management
- Motion preferences toggle respecting `prefers-reduced-motion`

### Backend Architecture (apps/api)

**Technology Stack:**
- Express.js with TypeScript
- ESM modules (type: "module")
- CORS enabled for cross-origin requests
- JSON request/body parsing

**API Design:**
- RESTful endpoints for `.rep` name operations
- `/rep/check` - GET endpoint to check name availability
- `/rep/reserve` - POST endpoint for mock name reservation
- In-memory storage using Set for reserved names (development/mock)
- Name validation: 3-30 characters, lowercase alphanumeric with optional hyphens/underscores

**Server Configuration:**
- Fixed port 5055 for stable Vite proxy integration
- Binds to 0.0.0.0 for containerized environments

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
- Wagmi v2 for blockchain interactions
- Viem for Ethereum operations
- WalletConnect for multi-wallet support
- Base Sepolia testnet deployment configured

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