/**
 * Ensure wallet is on Base network (chain ID 8453)
 * Handles automatic chain switching with fallback to adding the chain if not found
 */

const BASE_CHAIN_ID = 8453;
const BASE_CHAIN_ID_HEX = '0x2105';

const BASE_CHAIN_CONFIG = {
  chainId: BASE_CHAIN_ID_HEX,
  chainName: 'Base',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: ['https://mainnet.base.org'],
  blockExplorerUrls: ['https://basescan.org'],
};

/**
 * Ensure the wallet is connected to Base network
 * If not, attempt to switch. If chain not found (4902), add it and retry.
 * 
 * @throws Error if user rejects or operation fails
 */
export async function ensureBase(): Promise<void> {
  if (typeof window === 'undefined' || !(window as any).ethereum) {
    throw new Error('No Ethereum provider found');
  }

  const ethereum = (window as any).ethereum;

  try {
    console.log('[ensureBase] Attempting to switch to Base...');
    
    await ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: BASE_CHAIN_ID_HEX }],
    });
    
    console.log('[ensureBase] ✓ Successfully switched to Base');
  } catch (switchError: any) {
    console.log('[ensureBase] Switch error:', switchError);
    
    // Error code 4902 means the chain has not been added to the wallet
    if (switchError.code === 4902) {
      console.log('[ensureBase] Chain not found, adding Base to wallet...');
      
      try {
        await ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [BASE_CHAIN_CONFIG],
        });
        
        console.log('[ensureBase] ✓ Base chain added successfully');
        
        // Wait 300ms for mobile wallets to settle
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Retry switch after adding
        console.log('[ensureBase] Retrying switch after add...');
        await ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: BASE_CHAIN_ID_HEX }],
        });
        
        console.log('[ensureBase] ✓ Successfully switched to Base after adding');
      } catch (addError: any) {
        console.error('[ensureBase] Failed to add Base chain:', addError);
        throw new Error(`Failed to add Base network: ${addError.message || 'Unknown error'}`);
      }
    } else {
      // User rejected or other error
      console.error('[ensureBase] Failed to switch network:', switchError);
      throw new Error(`Failed to switch to Base: ${switchError.message || 'User rejected'}`);
    }
  }
}
