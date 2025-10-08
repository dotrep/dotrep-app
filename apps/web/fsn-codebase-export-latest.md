# FSN Vault - Recent Codebase Export
*Generated: August 29, 2025*

## Project Structure Overview

This is the latest state of the FSN Vault project, a Web3 social platform with cryptocurrency features and gamified social engagement.

### Core Architecture
- **Frontend**: React + TypeScript + Vite
- **Backend**: Express.js + TypeScript 
- **Database**: PostgreSQL with Drizzle ORM
- **Styling**: Tailwind CSS + Custom FSN Theme
- **Authentication**: Session-based with XP system

### Recent Updates
- ✅ FSN Claim Popup with neon design for login page
- ✅ Navigation component with logged-in user support
- ✅ Homepage navigation showing "Home | username.fsn | Logout"
- ✅ Proper .fsn suffix alignment in input fields
- ✅ Brand-consistent styling throughout

---

---

## 1. Homepage with Navigation (client/src/pages/Home.tsx)
**Recent Updates:**
- ✅ Added Navigation component import
- ✅ Navigation shows "Home | username.fsn | Logout" when logged in
- ✅ FSN claim input with proper .fsn suffix alignment
- ✅ Real-time name availability checking

**Key Features:**
- Interactive FSN name claiming
- Brand-consistent styling with neon effects
- Responsive design for mobile/desktop

## 2. Navigation Component (client/src/components/Navigation.tsx) 
**Recent Updates:**
- ✅ Dual mode: showFullNav for dashboard pages, minimal for homepage
- ✅ When showFullNav=false: displays "Home | username.fsn | Logout"  
- ✅ FSN name with cyan glow effect and text shadows
- ✅ Session-based authentication integration

**Key Features:**
- Session-based login detection
- Dynamic navigation based on login status
- Brand-consistent FSN styling

## 3. FSN Claim Popup (client/src/components/FSNClaimPopup.tsx)
**Recent Updates:**  
- ✅ Neon cyan glowing popup design with pulsing animation
- ✅ Fixed .fsn suffix alignment using flexbox and line-height
- ✅ Real-time name validation (3-20 characters)
- ✅ Proper mobile responsive design

**Key Features:**
- Modal popup triggered from login page "Register now"
- Same validation logic as homepage claim
- Smooth animations and transitions

## 4. Project Architecture Files

### package.json
```json
{
  "name": "rest-express",
  "private": true,
  "version": "1.0.0",
  "scripts": {
    "dev": "NODE_ENV=development tsx server/index.ts",
    "build": "vite build",
    "start": "tsx server/index.ts",
    "db:push": "drizzle-kit push"
  },
  "dependencies": {
    "@fingerprintjs/fingerprintjs": "^4.5.1",
    "@hookform/resolvers": "^3.9.1",
    "@jridgewell/trace-mapping": "^0.3.25",
    "@neondatabase/serverless": "^0.10.1",
    "@radix-ui/react-*": "Various UI components",
    "@replit/vite-plugin-cartographer": "^2.1.0",
    "@sendgrid/mail": "^8.1.4",
    "@tailwindcss/typography": "^0.5.15",
    "@tanstack/react-query": "^5.59.16",
    "bitcoinjs-lib": "^7.0.0",
    "drizzle-orm": "^0.34.1",
    "drizzle-zod": "^0.5.1", 
    "express": "^4.21.1",
    "express-session": "^1.18.1",
    "framer-motion": "^11.11.11",
    "magic-sdk": "^29.2.0",
    "openai": "^4.67.3",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "tailwindcss": "^3.4.14",
    "typescript": "^5.6.3",
    "vite": "^5.4.10",
    "wouter": "^3.3.5",
    "zod": "^3.23.8"
  }
}
```

### Database Schema (shared/schema.ts)
Key tables:
- **users**: Core user data with FSN names, XP, badges, streaks
- **fsnDomains**: FSN name registration and ownership
- **vaultItems**: Encrypted file storage system  
- **messages**: FSN-to-FSN messaging
- **walletAddresses**: Multi-coin wallet support
- **xpLogs**: XP transaction audit trail
- **beaconLogs**: Daily beacon recast tracking

### Backend Routes (server/routes.ts)
Core API endpoints:
- `/api/user/*` - Authentication, registration, profile
- `/api/fsn/*` - FSN name claiming and management  
- `/api/vault/*` - Encrypted file storage
- `/api/messages/*` - FSN messaging system
- `/api/wallet/*` - Cryptocurrency wallet management
- `/api/beacon/*` - Daily beacon recast system
- `/api/rewards/*` - XP and rewards tracking

### Authentication System
- **Session-based**: Express sessions with PostgreSQL storage
- **Email verification**: Triple-checkpoint system before FSN claiming
- **Rate limiting**: Comprehensive protection against brute force
- **Input sanitization**: Zod validation on all endpoints

## 5. Recent Development Focus

### Completed Features
- ✅ **FSN Claim Popup**: Neon design matching homepage experience
- ✅ **Navigation Integration**: Homepage navigation for logged-in users  
- ✅ **Input Alignment**: Fixed .fsn suffix positioning in all forms
- ✅ **Brand Consistency**: Unified FSN styling across components
- ✅ **Mobile Responsive**: Proper scaling for all device sizes

### Current Issues
- **Performance**: `/api/user/stats` polling every 5 seconds causing load
- **Session Management**: Some inconsistency in login state detection
- **UI Polish**: Minor spacing and animation refinements needed

## Key Files
