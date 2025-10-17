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
  coinbaseWallet({ 
    appName: '.rep Platform',
    preference: 'smartWalletOnly', // Prioritize Smart Wallet on Base for direct app opening
  }),
  walletConnect({
    projectId: '970eeb20c557717336e257b5a871fad2',
    metadata: {
      name: '.rep Platform',
      description: 'Your onchain reputation. Alive on Base.',
      url: typeof window !== 'undefined' ? window.location.origin : 'https://rep.live',
      icons: ['https://rep.live/icon.png'],
    },
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