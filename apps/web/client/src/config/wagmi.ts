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
];

// Add Coinbase Wallet only in PUBLIC mode
const connectors = APP_MODE === 'PUBLIC' 
  ? [...baseConnectors, coinbaseWallet({ appName: 'FSN Vault' })]
  : baseConnectors;

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