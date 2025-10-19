// Wagmi configuration for Web3 integration
import { createConfig, http } from 'wagmi';
import { injected, coinbaseWallet, walletConnect } from 'wagmi/connectors';
import { base } from 'wagmi/chains';

// Use wagmi's built-in Base chain (MetaMask recognizes this)
const networkChain = base;

// Desktop-first: Browser extension wallets + WalletConnect for mobile
const connectors = [
  injected(), // MetaMask, Brave Wallet, etc.
  coinbaseWallet({
    appName: '.rep Platform',
    preference: 'eoaOnly',
  }),
  walletConnect({
    projectId: '0a187c090d191ab29644b8d866854106',
    metadata: {
      name: '.rep Platform',
      description: 'Claim your onchain reputation on Base',
      url: 'https://rep.network',
      icons: ['https://rep.network/icon.png'],
    },
    showQrModal: true,
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