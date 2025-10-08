# Generic Name Registry Contract

## Overview
This directory contains a separate, private Node.js/Hardhat project for deploying a generic NameRegistry.sol contract to Base Sepolia (chainId 84532) using neutral terminology.

## Contract Features
- **Generic Name Registration**: Register name-to-address mappings without specific branding
- **Soulbound Enforcement**: Each wallet can only register ONE name forever (prevents gaming)
- **Ownership Management**: Check ownership and transfer names (with soulbound validation)
- **Availability Checking**: Verify if names are available for registration
- **Event Emission**: Emits registration and transfer events for indexing

## Contract Methods
- `registerName(string memory name)` - Register a name to the sender's address (soulbound check)
- `getOwner(string memory name)` - Get the owner address of a name
- `getName(address owner)` - Get the name owned by an address
- `hasName(address owner)` - Check if address already owns a name (soulbound enforcement)
- `isNameAvailable(string memory name)` - Check if a name is available
- `nameExistsInRegistry(string memory name)` - Check if name exists in registry
- `transferName(string memory name, address to)` - Transfer name ownership (recipient soulbound check)

## Deployment
- **Network**: Base Sepolia (Chain ID: 84532)
- **RPC URL**: https://sepolia.base.org
- **Contract Address**: To be updated after successful deployment

## Frontend Integration
The contract is integrated with the existing wallet-first UI through:
- `/client/src/hooks/useNameRegistry.ts` - React hook for contract interactions
- `/client/src/pages/ClaimFSN.tsx` - Updated to use blockchain contract instead of API

## Environment Setup
Required environment variables:
- `DEPLOYER_KEY` - Private key for deployment wallet
- `BASE_RPC_SEPOLIA` - Base Sepolia RPC URL (defaults to https://sepolia.base.org)

## Usage
```bash
# Deploy contract
cd name-registry
node deploy-minimal.js

# The deployment will output:
# - Contract address
# - BaseScan explorer link
# - Integration details for frontend
```

## Development Notes
- Contract uses neutral terminology (no ".fsn" references)
- Separate from main FSN platform architecture
- Integrated with existing wallet-first UI flow
- Mock functionality for development testing
- **SOULBOUND RULE**: Smart contract enforces one name per wallet at blockchain level
- Frontend validates soulbound rule before transaction to save gas
- SoulboundViolation error thrown if wallet attempts multiple registrations