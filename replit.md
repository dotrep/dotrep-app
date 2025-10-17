# .rep Platform

## Overview
.rep is a Web3 identity and reputation platform built on the Base blockchain. Its purpose is to enable users to claim soulbound `.rep` names as their onchain identity, offering features for reputation tracking, social networking, and decentralized file storage. The project aims to provide a robust and decentralized identity layer, enhancing user interaction within the Web3 ecosystem.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Monorepo Structure
The project utilizes a Turborepo-based monorepo, encompassing a React + Vite frontend (`apps/web`) and an Express.js backend API (`apps/api`), with shared TypeScript types in `packages/shared`.

### Frontend Architecture (apps/web)
- **Technology Stack**: React 18 with TypeScript, Vite 5.
- **Styling**: Vanilla CSS with custom properties for a deep navy/space theme, accented with neon blue, teal, and orange. Features glow effects and a responsive, mobile-first design.
- **Key Features**:
    - **Homepage**: A single-page hero layout with a floating particle background and dual calls to action for claiming and discovering `.rep` names.
    - **Claim Page**: A two-column layout for `.rep` name reservation, featuring real-time validation, a multi-state CTA flow, and integrated WalletConnect. It prioritizes Base Wallet connectivity.
    - **Rep Dashboard**: A post-claim integrated dashboard at `/rep-dashboard` with tabs for Wallet, Messages (FSN), Vault (client-side encrypted IPFS storage), and Chat (AI agents).
- **Web3 Integration**: Uses Wagmi v2 and Viem for blockchain interactions, configured for Base Mainnet (8453). Wallet connection supports injected providers and WalletConnect, with auto-reconnect logic and iframe detection for Replit compatibility.
- **Component Design**: Functional React components, inline SVG for graphics, CSS keyframes for animations, and client-side state management.

### Backend Architecture (apps/api)
- **Technology Stack**: Express.js, integrated with Vite in middleware mode for development.
- **API Design**: RESTful endpoints for `.rep` name operations, including `/api/rep/check` for availability and `/api/rep/reserve` for reservations. Features name and wallet address validation.
- **Server Configuration**: Single server on port 5000; HMR is disabled in development for stability in the Replit environment.

### Data Architecture
- **Database**: Drizzle ORM configured for PostgreSQL, with a schema defined in `packages/shared/schema.ts`. Currently uses in-memory storage for MVP due to dependency conflicts.
- **Name Registry**: Manages `.rep` name availability and reservations with server-issued IDs.

### Authentication & Identity
- **Web3 Integration**: Utilizes Wagmi v2 for wallet connections, supporting MetaMask and WalletConnect. Auto-reconnect and iframe detection are implemented.
- **Claim Flow**: Currently API-based, reserving names and validating wallets off-chain, with future plans for blockchain integration.

### File Storage & Vault System
- **Encryption**: Client-side AES-GCM 256-bit encryption with a zero-knowledge server design.
- **Decentralized Storage**: Integrates Pinata for IPFS, with file metadata stored in the database.

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