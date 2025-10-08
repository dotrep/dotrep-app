# FSN Registry Deployment Guide

## Phase 1: Local Development Setup

### 1. Install Dependencies
```bash
cd contracts
npm install
```

### 2. Compile Contracts
```bash
npm run compile
```
This generates TypeScript types and contract artifacts.

### 3. Start Local Hardhat Node
```bash
npm run node
```
Keep this running in a separate terminal. Provides 20 test accounts with 10,000 ETH each.

### 4. Deploy to Local Network
```bash
npm run deploy:local
```
Copy the deployment address and update `deployments/local.json`.

### 5. Test Contracts (Optional)
You can test all three contracts with the included test script:
```bash
npm run test:local
```

Or interact manually using Hardhat console:
```bash
npx hardhat console --network localhost
```

## Phase 2: Base Sepolia Testnet (When Ready)

### 1. Set Up Secrets
In Replit Secrets, add:
- `BASE_SEPOLIA_RPC_URL`: `https://base-sepolia.g.alchemy.com/v2/YOUR_API_KEY`
- `PRIVATE_KEY`: `0xYOUR_DEPLOYER_PRIVATE_KEY`

### 2. Deploy to Base Sepolia
```bash
npm run deploy:sepolia
```

### 3. Update Deployment File
Copy the address to `deployments/base-sepolia.json`.

## Integration with FSN Frontend

The deployed Registry contract can be integrated with your FSN frontend:

1. Import deployment addresses from JSON files
2. Use ethers.js to interact with the contract
3. Call `register(name)` for FSN claiming
4. Call `ownerOf(name)` to check ownership
5. Listen for `Registered` events

## Contract Functions

### Registry
- `register(string name)`: Register a name (3-20 chars, a-z/0-9/-)
- `ownerOf(string name)`: Get owner address of a name
- `hasName(address)`: Check if address already has a name

### Points
- `totalOf(address)`: Get total XP for an address
- `award(address, uint256, bytes32)`: Award XP with unique action ID (authorized only)
- `setAwarder(address)`: Set authorized awarder (owner only)

### Files
- `pin(bytes32 cid)`: Emit file pinning event with IPFS CID

## Security Features

- Input validation (length, character set)
- Case-insensitive names (stored lowercase)
- One name per address limit
- Immutable ownership (no transfers)