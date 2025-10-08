# FSN Contracts

Smart contract workspace for FSN Registry system.

## Setup Instructions

1. **Install Dependencies** (run in contracts folder):
   ```bash
   cd contracts
   npm install
   ```

2. **Compile Contracts**:
   ```bash
   npm run compile
   ```

3. **Local Testing**:
   ```bash
   # Terminal 1: Start local node
   npm run node
   
   # Terminal 2: Deploy to local network
   npm run deploy:local
   
   # Terminal 2: Test deployed contracts (optional)
   npm run test:local
   ```

4. **Base Sepolia Deployment** (when ready):
   - Add secrets in Replit:
     - `BASE_SEPOLIA_RPC_URL`: Your Alchemy/Infura Base Sepolia endpoint
     - `PRIVATE_KEY`: Your deployer wallet private key (starts with 0x)
   - Deploy:
     ```bash
     npm run deploy:sepolia
     ```

## Contracts

### Registry
- **Purpose**: Neutral name registry for FSN identities
- **Features**: 
  - Name registration (3-20 chars, a-z/0-9/-)
  - One name per address
  - Ownership verification
  - Lowercase normalization

### Points
- **Purpose**: XP ledger with anti-double-spend protection
- **Features**:
  - Award XP with unique action IDs
  - Authorized awarder system
  - Total XP tracking per address
  - Prevents duplicate awards

### Files
- **Purpose**: IPFS file anchoring events
- **Features**:
  - Emit file pinning events
  - Store IPFS CID hashes on-chain
  - Track user file uploads

## Deployment Addresses

- **Local**: See `deployments/local.json`
- **Base Sepolia**: See `deployments/base-sepolia.json`

## Security Notes

- Contract validates name format and length
- Names are case-insensitive (stored lowercase)
- Each address can only register one name
- Names cannot be transferred (soulbound)