# Web3 Frontend Integration Guide

## Complete Implementation Status ✅

### Smart Contracts (Part 2 Complete)
- ✅ **Registry Contract**: FSN name registration with validation
- ✅ **Points Contract**: XP ledger with anti-double-spend protection  
- ✅ **Files Contract**: IPFS file anchoring events
- ✅ **Deployment Scripts**: Auto-deployment with address tracking
- ✅ **Local Testing**: Ready for stealth development

### Frontend Integration (Part 3 Complete)
- ✅ **Wagmi/Viem Setup**: Complete Web3 client configuration
- ✅ **Contract Operations**: Hooks for all contract interactions
- ✅ **Event Listeners**: Real-time blockchain event monitoring
- ✅ **Wallet Integration**: MetaMask, WalletConnect, Coinbase Wallet
- ✅ **Environment Switching**: STEALTH (local) vs PUBLIC (Base Sepolia)

## Usage Instructions

### 1. Environment Setup
```bash
# Set application mode
VITE_APP_MODE=STEALTH  # or PUBLIC for Base Sepolia

# For PUBLIC mode, also set:
VITE_BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
VITE_WALLETCONNECT_PROJECT_ID=your_project_id
```

### 2. Start Local Development
```bash
# Terminal 1: Start Hardhat node
cd contracts
npm install
npm run node

# Terminal 2: Deploy contracts locally
npm run deploy:local

# Terminal 3: Start frontend
cd ..
npm run dev
```

### 3. Frontend Features Available

#### FSN Claiming (Blockchain-First)
```typescript
// Old API-based approach (replaced):
// const response = await fetch('/api/check-name/username');

// New contract-based approach:
const { registry } = useContractOperations();
const availability = await registry.checkNameAvailability('username');
await registry.registerName('username');
```

#### XP Tracking (Event-Driven)
```typescript
// Old polling approach (removed):
// setInterval(() => fetch('/api/user/stats'), 5000);

// New event-driven approach:
const stats = useEventDrivenStats(); // Auto-updates on blockchain events
// XP from Points contract, level/invites from database
```

#### File Anchoring
```typescript
const { files } = useContractOperations();
await files.pinFile(ipfsCid); // Emit blockchain event
// Also mirrors to database for fast queries
```

### 4. Event System

All blockchain events trigger immediate UI updates:

```typescript
// Contract events automatically trigger:
window.dispatchEvent(new CustomEvent('fsn:nameRegistered', { detail: { owner, name } }));
window.dispatchEvent(new CustomEvent('fsn:xpAwarded', { detail: { amount, actionId } }));
window.dispatchEvent(new CustomEvent('fsn:filePinned', { detail: { cid } }));

// Components listen and auto-refresh:
useEffect(() => {
  const handleXPAwarded = () => points.refetchXP();
  window.addEventListener('fsn:xpAwarded', handleXPAwarded);
  return () => window.removeEventListener('fsn:xpAwarded', handleXPAwarded);
}, []);
```

### 5. Database Mirroring

Blockchain operations are mirrored to database for performance:

```typescript
// After successful contract transaction:
await registry.registerName(name);  // Blockchain registration
await fetch('/api/fsn/mirror-registration', {  // Database sync
  method: 'POST',
  body: JSON.stringify({ name })
});
```

### 6. Performance Optimizations

#### Eliminated 5-Second Polling
- ❌ Old: `setInterval(() => fetch('/api/user/stats'), 5000)`
- ✅ New: Event-driven updates only when blockchain state changes

#### Smart Data Sources
- **XP**: Read from Points contract (authoritative)
- **Level/Invites**: Read from database (fast queries)
- **Leaderboards**: Database queries with optional on-chain verification

### 7. Testing Flow

#### STEALTH Mode (Local)
1. Connect MetaMask to `http://127.0.0.1:8545`
2. Use Hardhat test accounts (pre-funded with ETH)
3. Claim names, award XP, pin files locally
4. Verify events trigger instant UI updates

#### PUBLIC Mode (Base Sepolia)
1. Add Base Sepolia RPC secrets
2. Deploy contracts: `npm run deploy:sepolia`
3. Switch `VITE_APP_MODE=PUBLIC`
4. Test with real Base Sepolia testnet

### 8. Monitoring & Debugging

```typescript
// All contract interactions are logged:
console.log('Name registered:', { owner, name });
console.log('XP awarded:', { user, amount, actionId });
console.log('File pinned:', { user, cid });

// Event listeners show real-time activity:
// "✅ FSN name claimed on blockchain"
// "✅ XP updated from contract event"
// "✅ File anchored successfully"
```

## Production Readiness

The integration is production-ready with:
- ✅ Comprehensive error handling
- ✅ Wallet connection management  
- ✅ Network switching (local ↔ Base Sepolia)
- ✅ Event-driven architecture
- ✅ Database mirroring for performance
- ✅ Proper fallbacks and loading states

**Next Step**: Switch to PUBLIC mode and deploy to Base Sepolia when ready to go live!