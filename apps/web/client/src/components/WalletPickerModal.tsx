import React from 'react';
import { useConnect } from 'wagmi';

interface WalletPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WalletPickerModal({ isOpen, onClose }: WalletPickerModalProps) {
  // All hooks must be called before any early returns (React rules of hooks)
  const { connectors, connect, isPending, isSuccess } = useConnect();
  
  // Check if wallets are actually installed
  const [hasMetaMask, setHasMetaMask] = React.useState(false);
  const [hasCoinbase, setHasCoinbase] = React.useState(false);
  
  React.useEffect(() => {
    // Check if window.ethereum exists (means MetaMask or similar is installed)
    const isMetaMaskInstalled = typeof window !== 'undefined' && 
      (window as any).ethereum !== undefined;
    setHasMetaMask(isMetaMaskInstalled);
    
    // Check if Coinbase Wallet is installed
    const isCoinbaseInstalled = typeof window !== 'undefined' && 
      ((window as any).ethereum?.isCoinbaseWallet || 
       (window as any).coinbaseWalletExtension !== undefined);
    setHasCoinbase(isCoinbaseInstalled || isMetaMaskInstalled); // Coinbase can also use injected
    
    console.log('[WALLET] MetaMask installed:', isMetaMaskInstalled);
    console.log('[WALLET] Coinbase installed:', isCoinbaseInstalled);
    console.log('[WALLET] window.ethereum:', (window as any).ethereum);
  }, []);
  
  // Debug: Log all connectors whenever modal opens
  React.useEffect(() => {
    if (isOpen) {
      console.log('[WALLET] Modal opened, available connectors:', connectors.length);
      connectors.forEach((c: any, idx: number) => {
        console.log(`[WALLET] Connector ${idx}:`, {
          id: c.id,
          name: c.name,
          type: c.type,
          ready: c.ready
        });
      });
    }
  }, [isOpen, connectors]);
  
  // Auto-close modal when connection is successful
  React.useEffect(() => {
    if (isSuccess && isOpen) {
      console.log('[WALLET] Connection successful, closing modal');
      setTimeout(() => onClose(), 500); // Small delay to show success state
    }
  }, [isSuccess, isOpen, onClose]);

  if (!isOpen) return null;

  const injectedConnector = connectors.find((c: any) => 
    c.id === 'injected' || c.type === 'injected'
  );
  
  const coinbaseConnector = connectors.find((c: any) => 
    c.id.toLowerCase().includes('coinbase') || 
    c.name.toLowerCase().includes('coinbase')
  );
  
  const walletConnectConnector = connectors.find((c: any) => 
    c.id.toLowerCase().includes('walletconnect') ||
    c.name.toLowerCase().includes('walletconnect')
  );

  const handleConnect = async (connector: any, walletName: string) => {
    try {
      console.log(`[WALLET] Attempting to connect via ${walletName}`, {
        connectorId: connector.id,
        connectorType: connector.type,
        connectorReady: connector.ready,
      });
      const result = await connect({ connector });
      console.log(`[WALLET] Connect result:`, result);
      // Modal will auto-close via useEffect when isSuccess becomes true
    } catch (error) {
      console.error(`[WALLET] Connect error for ${walletName}:`, error);
      // Show user-friendly error
      alert(`Failed to connect ${walletName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>Connect Wallet</h2>
          <button style={styles.closeButton} onClick={onClose}>×</button>
        </div>
        
        <div style={styles.walletList}>
          {connectors.length === 0 && (
            <div style={styles.noConnectors}>
              ⚠️ No wallets detected. Please install MetaMask or Coinbase Wallet extension.
            </div>
          )}
          
          {injectedConnector && (
            <button
              style={styles.walletButton}
              onClick={() => {
                // If MetaMask is installed (even if locked), try to connect
                // This will trigger the unlock popup
                if (hasMetaMask) {
                  handleConnect(injectedConnector, 'MetaMask');
                } else {
                  // Only open install page if truly not installed
                  window.open('https://metamask.io/download/', '_blank');
                }
              }}
              disabled={isPending}
            >
              <div style={styles.walletIcon}>🦊</div>
              <div style={styles.walletInfo}>
                <div style={styles.walletName}>MetaMask</div>
                <div style={styles.walletDescription}>
                  {hasMetaMask ? 'Browser extension wallet' : '👆 Click to install'}
                </div>
              </div>
            </button>
          )}

          {coinbaseConnector && (
            <button
              style={styles.walletButton}
              onClick={() => {
                // If Coinbase is installed (even if locked), try to connect
                if (hasCoinbase) {
                  handleConnect(coinbaseConnector, 'Coinbase Wallet');
                } else {
                  // Only open install page if truly not installed
                  window.open('https://www.coinbase.com/wallet/downloads', '_blank');
                }
              }}
              disabled={isPending}
            >
              <div style={styles.walletIcon}>🔵</div>
              <div style={styles.walletInfo}>
                <div style={styles.walletName}>Coinbase Wallet</div>
                <div style={styles.walletDescription}>
                  {hasCoinbase ? 'Browser extension or mobile app' : '👆 Click to install'}
                </div>
              </div>
            </button>
          )}

          {walletConnectConnector && (
            <button
              style={styles.walletButton}
              onClick={() => handleConnect(walletConnectConnector, 'WalletConnect')}
              disabled={isPending}
            >
              <div style={styles.walletIcon}>🔗</div>
              <div style={styles.walletInfo}>
                <div style={styles.walletName}>WalletConnect</div>
                <div style={styles.walletDescription}>
                  Scan QR with mobile wallet {!walletConnectConnector.ready && '(not ready)'}
                </div>
              </div>
            </button>
          )}
          
          {/* Debug info */}
          <div style={styles.debugInfo}>
            Debug: {connectors.length} connector(s) available
          </div>
        </div>

        {isPending && (
          <div style={styles.loading}>Connecting...</div>
        )}
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    backdropFilter: 'blur(4px)',
  },
  modal: {
    background: 'linear-gradient(135deg, #1a1f3a 0%, #0a0e27 100%)',
    borderRadius: '16px',
    padding: '32px',
    maxWidth: '460px',
    width: '90%',
    border: '1px solid rgba(0, 212, 170, 0.2)',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#ffffff',
    margin: 0,
  },
  closeButton: {
    background: 'transparent',
    border: 'none',
    color: '#94a3b8',
    fontSize: '32px',
    cursor: 'pointer',
    padding: 0,
    lineHeight: '1',
    transition: 'color 0.2s ease',
  },
  walletList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  walletButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '20px',
    background: 'rgba(30, 41, 59, 0.5)',
    border: '2px solid rgba(100, 116, 139, 0.3)',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    width: '100%',
    textAlign: 'left' as const,
  },
  walletIcon: {
    fontSize: '32px',
    width: '48px',
    height: '48px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0, 212, 170, 0.1)',
    borderRadius: '8px',
  },
  walletInfo: {
    flex: 1,
  },
  walletName: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#ffffff',
    marginBottom: '4px',
  },
  walletDescription: {
    fontSize: '13px',
    color: '#94a3b8',
  },
  loading: {
    textAlign: 'center' as const,
    color: '#00d4aa',
    marginTop: '16px',
    fontSize: '14px',
  },
  noConnectors: {
    textAlign: 'center' as const,
    padding: '32px 20px',
    color: '#ff6b6b',
    fontSize: '14px',
    background: 'rgba(255, 107, 107, 0.1)',
    borderRadius: '8px',
  },
  debugInfo: {
    marginTop: '16px',
    padding: '8px',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '6px',
    fontSize: '12px',
    color: '#94a3b8',
    textAlign: 'center' as const,
  },
};
