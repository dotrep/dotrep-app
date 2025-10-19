import React from 'react';
import { useConnect } from 'wagmi';

interface WalletPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WalletPickerModal({ isOpen, onClose }: WalletPickerModalProps) {
  const { connectors, connect, isPending } = useConnect();

  if (!isOpen) return null;

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
      await connect({ connector });
      onClose();
    } catch (error) {
      console.error('Connect error:', error);
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
          {coinbaseConnector && (
            <button
              style={styles.walletButton}
              onClick={() => handleConnect(coinbaseConnector, 'Coinbase Wallet')}
              disabled={isPending}
            >
              <div style={styles.walletIcon}>🔵</div>
              <div style={styles.walletInfo}>
                <div style={styles.walletName}>Coinbase Wallet</div>
                <div style={styles.walletDescription}>Browser extension or mobile app</div>
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
                <div style={styles.walletDescription}>Scan QR with mobile wallet</div>
              </div>
            </button>
          )}
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
};
