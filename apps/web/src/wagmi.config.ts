import { http, createConfig } from 'wagmi';
import { base } from 'wagmi/chains';
import { injected, walletConnect } from 'wagmi/connectors';

export const config = createConfig({
  chains: [base],
  connectors: [
    injected(),
    walletConnect({ 
      projectId: 'your-project-id-here',
      showQrModal: true
    }),
  ],
  transports: {
    [base.id]: http(),
  },
});
