// Contract configuration and address management
import localDeployments from '../../../contracts/deployments/local.json';
import sepoliaDeployments from '../../../contracts/deployments/base-sepolia.json';

// Environment-based contract selection
const APP_MODE = import.meta.env.VITE_APP_MODE || 'STEALTH';

export const contractAddresses = APP_MODE === 'PUBLIC' 
  ? sepoliaDeployments 
  : localDeployments;

// Contract ABIs (simplified for key functions)
export const registryABI = [
  {
    "type": "function",
    "name": "register",
    "inputs": [{"name": "name", "type": "string"}],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "ownerOf",
    "inputs": [{"name": "name", "type": "string"}],
    "outputs": [{"type": "address"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "hasName",
    "inputs": [{"name": "owner", "type": "address"}],
    "outputs": [{"type": "bool"}],
    "stateMutability": "view"
  },
  {
    "type": "event",
    "name": "Registered",
    "inputs": [
      {"name": "owner", "type": "address", "indexed": true},
      {"name": "name", "type": "string", "indexed": false}
    ]
  }
] as const;

export const pointsABI = [
  {
    "type": "function",
    "name": "totalOf",
    "inputs": [{"name": "user", "type": "address"}],
    "outputs": [{"type": "uint256"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "award",
    "inputs": [
      {"name": "user", "type": "address"},
      {"name": "amount", "type": "uint256"},
      {"name": "actionId", "type": "bytes32"}
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "event",
    "name": "Awarded",
    "inputs": [
      {"name": "user", "type": "address", "indexed": true},
      {"name": "amount", "type": "uint256", "indexed": false},
      {"name": "actionId", "type": "bytes32", "indexed": false}
    ]
  }
] as const;

export const filesABI = [
  {
    "type": "function",
    "name": "pin",
    "inputs": [{"name": "cid", "type": "bytes32"}],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "event",
    "name": "Pinned",
    "inputs": [
      {"name": "user", "type": "address", "indexed": true},
      {"name": "cid", "type": "bytes32", "indexed": false}
    ]
  }
] as const;

// Network configurations
export const networks = {
  local: {
    id: 31337,
    name: 'Localhost',
    rpcUrl: 'http://127.0.0.1:8545',
    blockExplorer: undefined
  },
  baseMainnet: {
    id: 8453,
    name: 'Base',
    rpcUrl: 'https://mainnet.base.org',
    blockExplorer: 'https://basescan.org'
  },
  baseSepolia: {
    id: 84532,
    name: 'Base Sepolia',
    rpcUrl: import.meta.env.VITE_BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org',
    blockExplorer: 'https://sepolia.basescan.org'
  }
};

// Use Base Mainnet for wallet connection (no contracts deployed yet - claim flow uses mock API)
export const currentNetwork = networks.baseMainnet;

// Note: contractAddresses point to local/sepolia but current claim flow doesn't use them
// When blockchain integration is added, deploy contracts to Base Mainnet and update addresses