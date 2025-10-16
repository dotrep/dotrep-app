import { http, createConfig, createConnector } from 'wagmi';
import { base } from 'wagmi/chains';

function browserWalletConnector() {
  return createConnector((config) => ({
    id: 'browserWallet',
    name: 'Browser Wallet',
    type: 'injected' as const,
    
    async setup() {
      // Setup event listeners
      const provider = (window as any).ethereum;
      if (provider) {
        provider.on?.('accountsChanged', this.onAccountsChanged.bind(this));
        provider.on?.('chainChanged', this.onChainChanged.bind(this));
        provider.on?.('disconnect', this.onDisconnect.bind(this));
      }
    },
    
    async connect() {
      const provider = (window as any).ethereum;
      if (!provider) throw new Error('No browser wallet found');
      
      const accounts = await provider.request({ method: 'eth_requestAccounts' });
      const chainId = await provider.request({ method: 'eth_chainId' });
      
      return { 
        accounts: accounts.map((x: string) => x.toLowerCase() as `0x${string}`), 
        chainId: Number(chainId) 
      };
    },
    
    async disconnect() {
      // Wallet disconnect handled by provider
    },
    
    async getAccounts() {
      const provider = (window as any).ethereum;
      if (!provider) return [];
      const accounts = await provider.request({ method: 'eth_accounts' });
      return accounts.map((x: string) => x.toLowerCase() as `0x${string}`);
    },
    
    async getChainId() {
      const provider = (window as any).ethereum;
      if (!provider) throw new Error('No browser wallet found');
      const chainId = await provider.request({ method: 'eth_chainId' });
      return Number(chainId);
    },
    
    async getProvider() {
      return (window as any).ethereum;
    },
    
    async isAuthorized() {
      try {
        const provider = (window as any).ethereum;
        if (!provider) return false;
        const accounts = await provider.request({ method: 'eth_accounts' });
        return accounts.length > 0;
      } catch {
        return false;
      }
    },
    
    async switchChain({ chainId }: { chainId: number }) {
      const provider = (window as any).ethereum;
      if (!provider) throw new Error('No browser wallet found');
      
      const hexChainId = `0x${chainId.toString(16)}`;
      try {
        await provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: hexChainId }],
        });
      } catch (error: any) {
        // If chain doesn't exist, add it
        if (error.code === 4902) {
          const chain = config.chains.find((c) => c.id === chainId);
          if (!chain) throw new Error('Chain not configured');
          
          await provider.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: hexChainId,
              chainName: chain.name,
              nativeCurrency: chain.nativeCurrency,
              rpcUrls: [chain.rpcUrls.default.http[0]],
              blockExplorerUrls: chain.blockExplorers?.default?.url ? [chain.blockExplorers.default.url] : undefined,
            }],
          });
        } else {
          throw error;
        }
      }
      
      return config.chains.find((c) => c.id === chainId) || config.chains[0];
    },
    
    onAccountsChanged(accounts: string[]) {
      if (accounts.length === 0) {
        config.emitter.emit('disconnect');
      } else {
        config.emitter.emit('change', { 
          accounts: accounts.map((x) => x.toLowerCase() as `0x${string}`) 
        });
      }
    },
    
    onChainChanged(chainId: string) {
      config.emitter.emit('change', { chainId: Number(chainId) });
    },
    
    onDisconnect() {
      config.emitter.emit('disconnect');
    },
  }));
}

export const config = createConfig({
  chains: [base],
  connectors: [browserWalletConnector()],
  transports: {
    [base.id]: http(),
  },
});
