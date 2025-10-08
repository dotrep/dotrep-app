// Wagmi configuration for Web3 integration
import { createConfig, http } from 'wagmi';
import { metaMask, walletConnect, coinbaseWallet } from 'wagmi/connectors';
import { defineChain } from 'viem';
import { currentNetwork } from './contracts';

// Define network chain
const networkChain = defineChain({
  id: currentNetwork.id,
  name: currentNetwork.name,
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: [currentNetwork.rpcUrl],
    },
  },
  blockExplorers: currentNetwork.blockExplorer ? {
    default: {
      name: 'Explorer',
      url: currentNetwork.blockExplorer,
    },
  } : undefined,
});

// Environment-based connector selection
const APP_MODE = import.meta.env.VITE_APP_MODE || 'STEALTH';

const baseConnectors = [
  metaMask(),
  walletConnect({
    projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'demo-project-id',
  }),
];

// Add Coinbase Wallet only in PUBLIC mode
const connectors = APP_MODE === 'PUBLIC' 
  ? [...baseConnectors, coinbaseWallet({ appName: 'FSN Vault' })]
  : baseConnectors;

export const wagmiConfig = createConfig({
  chains: [networkChain],
  connectors,
  transports: {
    [networkChain.id]: http(currentNetwork.rpcUrl, {
      timeout: 10_000, // 10 second timeout
      retryCount: 2,
      retryDelay: 1000,
    }),
  },
  batch: {
    multicall: false, // Disable multicall to prevent batch fetch issues
  },
});

export { networkChain };