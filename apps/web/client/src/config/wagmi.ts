// Wagmi configuration for Web3 integration
import { createConfig, http } from 'wagmi';
import { injected, coinbaseWallet } from 'wagmi/connectors';
import { base } from 'wagmi/chains';

// Use wagmi's built-in Base chain (MetaMask recognizes this)
const networkChain = base;

// Desktop-first: Browser extension wallets only (no QR codes)
const connectors = [
  injected(), // MetaMask, Brave Wallet, etc.
  coinbaseWallet({
    appName: '.rep Platform',
    preference: 'eoaOnly',
  }),
];

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