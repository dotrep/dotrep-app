# FSN Vault Replit Configuration

## Overview
FSN (FreeSpace Network) Vault is a full-stack web application integrating cryptocurrency features with a gamified social platform. It offers FSN identity management, an AI agent ecosystem, secure vault file storage, messaging capabilities, and an XP-based progression system. The project aims to provide a unique blend of digital asset management and interactive social engagement, serving as a central hub for digital assets and social interaction.

## User Preferences
Preferred communication style: Simple, everyday language.
Navigation structure: When logged in, show Dashboard, Vault, Social, Game Center, and Logout (username.fsn) - no Home link. When not logged in, show only Login link.

## Recent Changes (Aug 31, 2025)
- **Soulbound Enforcement**: Implemented strict one-wallet-one-name rule at both smart contract and frontend levels to prevent gaming
- **Contract Security**: Added SoulboundViolation custom error and soulboundCheck modifier to prevent multiple registrations per wallet
- **Frontend Validation**: Updated useNameRegistry hook to check existing wallet ownership before allowing registration attempts
- **UI Improvements**: Added SoulboundWarning component that shows when connected wallet already owns a name
- **Gas Optimization**: Frontend validates soulbound rule before transaction to prevent failed contract calls
- **Generic Name Registry Integration**: Created separate name-registry project with Hardhat for deploying neutral NameRegistry.sol contract to Base Sepolia
- **Blockchain-First Name Claiming**: Updated ClaimFSN.tsx to use useNameRegistry hook connecting directly to deployed contract instead of API endpoints
- **Wagmi Integration**: Implemented proper wagmi v2 patterns with useWriteContract for blockchain interactions
- **Contract Separation**: Deployed generic name registry separate from FSN-specific platform while maintaining UI integration
- **Development Infrastructure**: Setup Base Sepolia deployment scripts with mock functionality for testing until contract deployment

## Previous Changes (Aug 29, 2025)
- **Wallet-First Architecture**: Complete transition from email-first to wallet-first FSN claiming system
- **Email System Disabled**: All email verification UI hidden, backend routes return 404 when EMAIL_ENABLED=false
- **Wallet Integration**: MetaMask and Coinbase Wallet support with proper WalletConnect Project ID configuration
- **Claim Flow Updated**: Shows "CONNECT WALLET TO CLAIM" with wallet connection prompts instead of email verification
- **Environment Configuration**: EMAIL_ENABLED=false, EMAIL_REQUIRED_FOR_CLAIM=false flags control system behavior
- **UI Messaging**: Replaced email verification language with "Your handle is soulbound to your wallet" messaging
- **Complete Web3 Frontend Integration**: Full wagmi/viem setup with blockchain-first architecture replacing API polling
- **Daily XP Minting System**: Production-ready on-chain XP awarding with idempotent batch processing and cron endpoints
- **Smart Contracts System**: Registry (FSN names), Points (XP ledger), Files (IPFS anchoring) with local and Base Sepolia deployment
- **Secure Vault Storage System**: End-to-end encrypted file storage with client-side AES-GCM encryption and IPFS pinning
- **Zero-Knowledge Architecture**: Server never sees original files or encryption keys - complete user privacy protection
- **IPFS Integration**: Pinata provider support with configurable STEALTH/PUBLIC modes for privacy control
- **Client-Side Security**: 256-bit AES-GCM encryption, local key storage, integrity verification, secure upload flow
- **Comprehensive Validation**: MIME type filtering, file size limits, rate limiting, dangerous file extension blocking
- **Event-Driven Updates**: Real-time blockchain event listeners eliminate 5-second polling for instant UI updates
- **Database Mirroring**: Hybrid performance with blockchain authority and database speed for complex queries
- **Environment Switching**: STEALTH mode (local testing) vs PUBLIC mode (Base Sepolia production) with seamless transitions
- **Security Architecture**: Dedicated hot wallets, stable actionIds, duplicate protection, and comprehensive error handling
- **Cron System**: Protected endpoints (/api/cron/award) with external scheduling support and detailed monitoring
- **Web3 Components**: WalletConnect integration, contract operations hooks, and blockchain status indicators
- **Production Ready**: Complete testing flow from local development to Base Sepolia deployment with monitoring tools

## Previous Changes (Aug 11, 2025)
- **Production-Ready Beacon Recast System**: Completed full Phase 0 beacon recast implementation matching exact specifications
- **Environment Flags**: Configured FEATURE_TRUST=off, FEATURE_BEACON_RECAST=phase0, XP_RECAST_AWARD=10, RECAST_COOLDOWN_SECONDS=86400 (24 hours)
- **Backend Implementation**: /api/beacon/recast endpoint with cooldown enforcement, broadcasts_total increment, streak calculation, and XP ledger integration
- **Database Schema**: Added broadcasts_total, beacon_streak_days, last_recast_at fields to users table with proper migrations
- **Streak Logic**: 48-hour grace period for consecutive beacon recasts with automatic reset outside window
- **Success Response Format**: Returns {broadcasts_total, streak_days, xp_awarded, cooldown_remaining} exactly as specified
- **Frontend Integration**: BeaconPanel handles recast with exact toast format "Broadcast sent. +{XP} XP • Streak {N}."
- **Button States**: "🔦 RECAST" when available, "⏳ RECASTING..." during action, "Recast in {HH:MM:SS}" during cooldown
- **Cooldown Source**: Server-provided countdown values prevent client clock manipulation
- **XP Ledger**: All beacon recast XP transactions recorded in xpLogs table with type:"beacon_recast"
- **Phase 0 Complete**: No Trust/KYC navigation, fully functional daily engagement system ready for production
- **Phase 0 Onboarding Overlay**: Implemented first-login onboarding system with task checklist and 100 XP completion bonus
- **Onboarding Integration**: Added overlay triggers, profile endpoint, task tracking, and completion handlers for seamless new user experience
- **Phase 0 Rewards Feedback System**: Comprehensive immediate feedback system with XP toasts, level-up banners, streak celebrations, and perks panel
- **Rewards Components**: XPProgressBar, XPToast, LevelUpBanner, StreakCelebration, PerksPanel - all feature-flagged and additive
- **Event-Driven Architecture**: Listen-only rewards emitter system that hooks into existing success events without modifying business logic
- **Accessibility & Performance**: CSS-optimized animations, keyboard navigation, reduced-motion support, and non-PII analytics
- **Phase 0 Rewards UI System**: Feature-flagged rewards feedback system with XP toasts, recent rewards panel, and server-side reward event logging
- **Rewards Components**: RewardsUIProvider, RewardsToast, RecentRewardsPanel - controlled by VITE_REWARDS_UI_ENABLED flag
- **Rewards API**: GET /api/rewards/recent and /api/rewards/since endpoints for authenticated users with reward event tracking
- **Theme Integration**: All rewards UI components use unified theme system tokens and helper classes for consistent styling

## System Architecture

### Frontend
- **Framework**: React with TypeScript
- **Styling**: Tailwind CSS with custom FSN theme, Radix UI primitives via shadcn/ui
- **State Management**: React Context API
- **Build Tool**: Vite
- **Routing**: Client-side routing

### Backend
- **Runtime**: Node.js with TypeScript/ESM modules
- **Framework**: Express.js
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Session-based
- **File Storage**: Local filesystem with security scanning

### Database Schema
- **Core Entities**: Users (with roles and AI agent types), FSN Domains, Messages, Vault Items, Wallet System, XP System.

### Key Components
- **FSN Identity System**: Unique FSN name registration and management, immutable digital identities (soulbound).
- **Smart Contracts**: Hardhat workspace with Registry contract for blockchain-based FSN name registration and ownership verification.
- **AI Agent Ecosystem**: Dedicated AI agents for onboarding (core.fsn), challenges (ghost.fsn), inventory (vault.fsn), customization (forge.fsn), and history (echo.fsn).
- **Vault Storage System**: Encrypted and virus-scanned file storage with multiple item types.
- **Messaging Platform**: FSN-to-FSN messaging with contact management and AI interaction.
- **Cryptocurrency Integration**: Multi-coin wallet support with address generation, transaction tracking, and price monitoring.
- **Gamification**: XP-based progression, narrative-based gamified identity system (PULSE → SIGNAL → BEACON), interactive challenges, XP Shop.
- **XP Engine**: Centralized XP awarding engine with audit logging for actions like FSN claim, email verification, daily logins.
- **Daily Login Streak System**: Tracks consecutive daily login streaks with XP rewards and milestones.

### System Design Choices
- **UI/UX**: Cyberpunk/TRON-style aesthetic with neon borders, glow effects, pulsing animations, interactive cockpit interfaces, consistent beacon logo animation. Uses Inter font for typography.
- **Security**: Secure password hashing, rate limiting, CSP headers, input sanitization, virus scanning for uploaded files, mandatory email verification before FSN name claiming with triple-checkpoint system. IRONCLAD email verification security with database-level triggers preventing unauthorized auto-verification. SOULBOUND email system enforces one email per FSN identity with complete blocking of email re-verification AND verification status invalidation for any FSN-bound email addresses.
- **Modularity**: Components designed for reusability and separation of concerns.
- **Responsiveness**: Comprehensive mobile responsiveness with dynamic grid layouts.
- **Error Handling**: Graceful error recovery with ErrorBoundary components, detailed messaging, and loading indicators.
- **Persistence**: LocalStorage for user preferences, purchased items, and unlocked badges.

## External Dependencies
- **Database**: PostgreSQL (via Neon serverless)
- **Email**: SendGrid, Resend API
- **Cryptography**: bitcoinjs-lib
- **ORM**: Drizzle
- **Validation**: Zod
- **Image Processing**: html2canvas