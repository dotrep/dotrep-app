// Wagmi configuration for Web3 integration
import { createConfig, http } from 'wagmi';
import { injected, walletConnect, coinbaseWallet } from 'wagmi/connectors';
import { base } from 'wagmi/chains';

// Use wagmi's built-in Base chain (MetaMask recognizes this)
const networkChain = base;

// Environment-based connector selection
const APP_MODE = (import.meta as any).env?.VITE_APP_MODE || 'STEALTH';

const baseConnectors = [
  injected(),
  walletConnect({
    projectId: (import.meta as any).env?.VITE_WALLETCONNECT_PROJECT_ID || 'demo-project-id',
  }),
  coinbaseWallet({ 
    appName: '.rep Platform',
    preference: 'all', // Support both mobile app and browser extension
  }),
];

const connectors = baseConnectors;

export const wagmiConfig = createConfig({
  chains: [networkChain],
  connectors,
  transports: {
    [networkChain.id]: http(),
  },
  batch: {
    multicall: false, // Disable multicall to prevent batch fetch issues
  },
});

export { networkChain };