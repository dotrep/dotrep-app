// Wagmi configuration for Web3 integration
import { createConfig, http } from 'wagmi';
import { injected, walletConnect } from 'wagmi/connectors';
import { base } from 'wagmi/chains';

// Use wagmi's built-in Base chain (MetaMask recognizes this)
const networkChain = base;

// Environment-based connector selection
const APP_MODE = (import.meta as any).env?.VITE_APP_MODE || 'STEALTH';

const baseConnectors = [
  injected(),
  walletConnect({
    projectId: '970eeb20c557717336e257b5a871fad2',
    metadata: {
      name: '.rep Platform',
      description: 'Claim your .rep identity on Base',
      url: typeof window !== 'undefined' ? window.location.origin : 'https://rep.live',
      icons: ['https://rep.live/icon.png'],
    },
    showQrModal: true, // Enable QR modal for mobile wallet connections
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