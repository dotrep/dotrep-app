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
- Claim page (`ClaimFSN.tsx`) - Production .rep name reservation with wallet integration at /claim route
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
  - Click reveals name input field with fixed ".rep" suffix
  - Button/UI updates through states based on validation/wallet:
    1. "Check availability" (invalid/empty, disabled)
    2. "Checking..." (checking, disabled)
    3. "Name is taken" (unavailable, disabled)
    4. **Shows WalletConnect component** (available, not connected - displays MetaMask/Coinbase buttons)
    5. "Switch to Base to claim" (connected, wrong chain)
    6. "Reserve your .rep" (connected on Base, ready to reserve → registerName → redirect to /wallet)
  - **Note:** WalletConnect component handles iframe detection - if running in Replit preview (iframe), shows "Open in New Tab" button since MetaMask blocks iframe connections for security
  - Iframe detection: `window.self !== window.top` check with try/catch
  - Error handling: Shows clear error messages instead of silent hangs
  - Connection failures inside iframes automatically trigger the "Open in New Tab" flow
- **Left Column:**
  - "Reserve your.rep" title (teal-blue gradient)
  - Validation rules text
  - Step progress: "1 Claim • 2 Link • 3 Done"
  - Real-time validation (3-32 chars, lowercase letters/numbers/hyphens, must start with letter)
  - Availability indicator (checkmark + status message)
- **Right Column:** Chameleon mascot
- Floating particle background (30 particles with @keyframes float animation - upward drift with scale/opacity changes)
- Uses inline styles with component-scoped <style> tag for keyframe animations
- Toast notifications for success/error feedback (shadcn/ui toast system)
- Assets: `chameleon_claim.png` (claim page chameleon)

**Wallet Dashboard (`/wallet`):**
- Three-state CTA flow with localStorage persistence:
  1. **Not Connected:** Shows WalletConnect component (MetaMask/Coinbase Wallet buttons)
  2. **Wrong Chain:** "Switch to Base" button (uses useSwitchChain hook)
  3. **Connected on Base:** "Link wallet to claim" button
  4. **Linked:** Success state with disabled secondary actions
- Status progression: reserved → linked → done
- Retrieves reservation from URL params (`?name=...&rid=...`) or localStorage
- Persists: rep:lastName, rep:address, rep:reservationId, rep:connectorId, rep:linked
- Auto-reconnect support via connector ID persistence
- Empty state with "Back to Claim" button if no reservation found

**Signed-In Header:**
- Shows wallet pill: "name.rep • 0xAb...1234" when connected
- Fixed position top-right with teal-blue gradient on hover
- Routes to /wallet on click
- Auto-reconnect logic: Checks localStorage for rep:address, rep:connected, rep:connectorId
- Reconnects using stored connector ID (supports both MetaMask and Coinbase Wallet)

**Footer:**
- "Built on Base" badge (no chain ID number)
- Links to Privacy and Terms stub pages
- Consistent styling with platform design

**Stub Pages:**
- `/privacy` - Privacy Policy placeholder
- `/terms` - Terms of Service placeholder
- Both styled consistently with teal-blue gradients and platform theme

**SEO & Meta Tags:**
- SEOHead component with dynamic title, description, OG image
- Applied to Home and Claim pages
- Twitter card support for social sharing

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
  - Returns server-issued reservationId: `rid_${timestamp}_${random}` format
  - Stores reservation in-memory Set (development/mock - database schema ready but awaiting dependency resolution)
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
- Schema defined in `./shared/schema.ts` (includes repReservations table for persistence)
- Environment-based DATABASE_URL configuration
- **Note:** Database schema ready but drizzle-orm installation blocked by peer dependency conflicts with @radix-ui/react-toast. In-memory Set used for MVP testing.

**Name Registry:**
- Client-side validation before API calls
- Backend validation with reserved name filtering
- Availability checking via Set-based lookup (in-memory for MVP)
- Server-issued reservation IDs with timestamp tracking
- Database persistence ready when dependencies resolved
- Future blockchain integration prepared

### Authentication & Identity

**FSN (FreeSpace Network) Legacy System:**
- Wallet-first architecture with MetaMask/Coinbase Wallet support
- Session-based authentication with user sessions
- `.fsn` identity system (being transitioned to `.rep`)
- Soulbound token model - one wallet per name enforcement
- Device fingerprinting and IP tracking for identity verification

**Web3 Integration:**
- Wagmi v2 for blockchain interactions (injected + walletConnect connectors)
- Viem for Ethereum operations
- **Base Mainnet (8453)** configured as default network for wallet connection
- Wallet connection uses direct wagmi hooks (useAccount, useConnect, useSwitchChain)
- **Connector Configuration:**
  - `injected()` - MetaMask browser extension and other injected providers
  - `walletConnect()` - Mobile wallet connections via WalletConnect protocol (Coinbase Wallet, Trust, etc.)
  - WalletConnect Project ID: 970eeb20c557717336e257b5a871fad2
  - **Note:** Previously used coinbaseWallet() SDK connector but removed due to timeout issues in mobile browsers and iframe environments (popups fail). WalletConnect protocol provides reliable mobile wallet connections.
- **Connector Persistence:** 
  - Stores connector.id in localStorage (rep:connectorId) for auto-reconnect
  - Supports MetaMask and mobile wallet session restoration
  - Auto-reconnect in SignedInHeader checks stored connector ID and reconnects on load
- **Iframe Detection:**
  - WalletConnect component detects iframe environment (`window.self !== window.top`)
  - Shows "Open in New Tab" button when in iframe (Replit app) to enable wallet connections
  - Prevents timeout errors by guiding users to open in browser tab
- Current claim flow is **API-based** (no smart contract interaction yet):
  - POST /rep/reserve endpoint validates wallet addresses and stores reservations
  - Returns server-issued reservationId (rid_timestamp_random format)
  - Success redirect to /wallet page with URL params and localStorage persistence
  - Toast notifications for user feedback
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