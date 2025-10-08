# Daily XP Minting System - Complete Implementation

## ✅ System Overview

The daily XP minting system bridges database tracking with on-chain awards using a secure, idempotent process that:

1. **Tracks daily logins** in the database (fast, off-chain)
2. **Mints XP on-chain** via Points contract (authoritative source)
3. **Prevents double-awards** using stable actionIds
4. **Supports both STEALTH and PUBLIC modes**

## ✅ Complete Implementation Status

### **Database Layer**
- ✅ **xpLogs Table**: Tracks all XP awards with on-chain status
- ✅ **Users Table**: Has `walletLinked` and `lastLogin` fields
- ✅ **Idempotency**: Prevents duplicate awards via actionId tracking

### **Smart Contract Integration** 
- ✅ **Points Contract**: Award function with actionId deduplication
- ✅ **Ethers Integration**: Full blockchain interaction capability
- ✅ **Error Handling**: Graceful handling of reverts and rate limits

### **Cron System**
- ✅ **Daily Minting Service**: Complete implementation in `server/services/dailyXPMinting.ts`
- ✅ **Secure Endpoints**: Protected with CRON_SECRET token
- ✅ **Batch Processing**: Handles large user counts with rate limiting

### **Environment Configuration**
- ✅ **STEALTH Mode**: Database-only testing without blockchain calls
- ✅ **PUBLIC Mode**: Full on-chain minting for production
- ✅ **Security**: Dedicated hot wallet for awarding

## 🔧 Environment Variables

Add these to Replit Secrets:

```bash
# Daily XP Minting Configuration
AWARD_ONCHAIN=false              # true only when PUBLIC and ready
AWARD_PRIVATE_KEY=0x1234...      # Dedicated hot wallet (NOT deployer)
RPC_URL=http://127.0.0.1:8545    # Local or Base Sepolia RPC
POINTS_ADDRESS=0x1234...         # From deployments/local.json
AWARD_XP_DAILY=10               # XP per daily login
CRON_SECRET=secure-token         # Protect cron endpoints
```

## 🚀 Usage Instructions

### **1. Local Testing (STEALTH Mode)**

```bash
# Step 1: Ensure contracts are deployed locally
cd contracts
npm run node          # Terminal 1: Start local blockchain
npm run deploy:local  # Terminal 2: Deploy contracts

# Step 2: Set environment (in Replit Secrets)
AWARD_ONCHAIN=false
RPC_URL=http://127.0.0.1:8545
POINTS_ADDRESS=<from_deployments/local.json>

# Step 3: Test the system
curl -X POST "http://localhost:5000/api/cron/award" \
  -H "x-cron-secret: dev-secret-change-in-production"
```

### **2. Production (PUBLIC Mode)**

```bash
# Step 1: Deploy to Base Sepolia
cd contracts
npm run deploy:sepolia

# Step 2: Set environment for production
AWARD_ONCHAIN=true
RPC_URL=https://sepolia.base.org
POINTS_ADDRESS=<from_deployments/base-sepolia.json>
AWARD_PRIVATE_KEY=<funded_hot_wallet>

# Step 3: Set up external cron (Better Uptime, Cron-job.org)
# Hit: https://your-replit.com/api/cron/award
# Schedule: Daily at 00:05 UTC
# Headers: x-cron-secret: your-secure-token
```

## 📋 API Endpoints

### **Daily XP Minting**
```bash
POST /api/cron/award
Headers: x-cron-secret: your-token

# Response:
{
  "success": true,
  "message": "Daily XP minting completed in 1234ms",
  "stats": {
    "processed": 150,
    "successful": 148,
    "failed": 2,
    "duration": 1234
  },
  "errors": ["0x123...: insufficient funds"]
}
```

### **Daily Stats**
```bash
GET /api/cron/daily-stats?day=2025-08-29
Headers: x-cron-secret: your-token

# Response:
{
  "success": true,
  "stats": {
    "dayKey": "2025-08-29",
    "totalUsers": 150,
    "onchainUsers": 148,
    "totalXPAwarded": 1500,
    "pendingUsers": 2
  }
}
```

### **User XP Logs**
```bash
GET /api/cron/user-logs/0x1234567890123456789012345678901234567890
Headers: x-cron-secret: your-token

# Response:
{
  "success": true,
  "address": "0x1234567890123456789012345678901234567890",
  "dayKey": "all",
  "logs": [
    {
      "id": 1,
      "address": "0x1234567890123456789012345678901234567890",
      "type": "daily",
      "dayKey": "2025-08-29",
      "actionId": "0xabcd...",
      "amount": 10,
      "txHash": "0x5678...",
      "onchain": true,
      "errorMessage": null,
      "createdAt": "2025-08-29T00:05:23.123Z"
    }
  ]
}
```

### **Health Check**
```bash
GET /api/cron/health

# Response (no auth required):
{
  "success": true,
  "message": "Cron service is healthy",
  "config": {
    "AWARD_ONCHAIN": false,
    "RPC_URL": "http://127.0.0.1:8545",
    "POINTS_ADDRESS": "0x1234567890123456789012345678901234567890",
    "AWARD_XP_DAILY": 10,
    "AWARD_PRIVATE_KEY": "[CONFIGURED]"
  },
  "timestamp": "2025-08-29T17:20:10.123Z"
}
```

## 🔒 Security Features

### **Idempotency Protection**
- **Stable ActionIds**: `keccak256(address + "|daily|" + dayKey)`
- **Database Deduplication**: Check xpLogs before processing
- **Contract Protection**: Points.award reverts on duplicate actionId

### **Hot Wallet Security**
- **Dedicated Key**: Separate AWARD_PRIVATE_KEY (not deployer)
- **Limited Funds**: Only fund with small amounts needed for gas
- **Key Rotation**: Rotate before going PUBLIC

### **Endpoint Protection**
- **Secret Token**: CRON_SECRET protects all cron endpoints
- **Rate Limiting**: Built-in delays between awards
- **Error Isolation**: Failed awards don't stop batch processing

## 🔄 Daily Process Flow

1. **00:05 UTC**: External cron triggers `/api/cron/award`
2. **Query Users**: Find users who logged in today with wallets
3. **Filter Duplicates**: Skip users already awarded today
4. **Generate ActionIds**: Create stable, unique identifiers
5. **Award On-Chain** (if PUBLIC): Call Points.award() for each user
6. **Log Results**: Record all attempts in xpLogs table
7. **Batch Processing**: Handle 50 users at a time with delays
8. **Error Handling**: Continue on individual failures

## 📊 Monitoring & Debugging

### **Check Daily Stats**
```bash
curl "http://localhost:5000/api/cron/daily-stats" \
  -H "x-cron-secret: dev-secret-change-in-production"
```

### **Check User Logs**
```bash
curl "http://localhost:5000/api/cron/user-logs/0x742d35Cc6735C0532aD3ABf3B69c9Ff8E4F8B9Ab" \
  -H "x-cron-secret: dev-secret-change-in-production"
```

### **View System Health**
```bash
curl "http://localhost:5000/api/cron/health"
```

### **Logs to Monitor**
- `🚀 Starting daily XP minting process...`
- `Found N users eligible for daily XP award`
- `✅ Daily XP minting complete: X/Y successful`
- `Awarding 10 XP to 0x123... with actionId 0xabc...`
- `Transaction confirmed in block 12345`

## 🧪 Testing Scenarios

### **STEALTH Mode Testing**
1. Start local Hardhat node and deploy contracts
2. Set `AWARD_ONCHAIN=false`
3. Login with test users to trigger lastLogin updates
4. Run cron: should log awards with `onchain: false`
5. Verify xpLogs table has entries

### **PUBLIC Mode Testing**
1. Deploy contracts to Base Sepolia
2. Fund hot wallet with Base Sepolia ETH
3. Set `AWARD_ONCHAIN=true` and Sepolia RPC
4. Run cron: should mint XP on-chain
5. Verify transactions on Basescan

### **Error Scenarios**
- **Insufficient Funds**: Hot wallet runs out of ETH
- **Rate Limiting**: RPC provider throttles requests
- **Duplicate ActionId**: Contract reverts duplicate award
- **Network Issues**: RPC connection fails

All scenarios are handled gracefully with proper error logging.

## 🎯 Production Deployment

1. **Deploy Contracts**: Use `npm run deploy:sepolia`
2. **Fund Hot Wallet**: Add Base Sepolia ETH for gas
3. **Set Environment**: Switch to PUBLIC mode
4. **Test Manually**: Run cron once to verify
5. **Set External Cron**: Daily trigger at 00:05 UTC
6. **Monitor Logs**: Watch for successful daily runs

The system is production-ready with comprehensive error handling, security measures, and monitoring capabilities.