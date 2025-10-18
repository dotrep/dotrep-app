// Wallet connection component
import React from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { useContractOperations } from '../hooks/useContractOperations';

export function WalletConnect() {
  // Re-enabled for wallet-first mode
  const { address, isConnected } = useAccount();
  const { connectors, connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { points } = useContractOperations();

  // Check if running inside an iframe (like Replit preview)
  const [isInIframe, setIsInIframe] = React.useState(false);

  React.useEffect(() => {
    try {
      setIsInIframe(window.self !== window.top);
    } catch (e) {
      // If we can't access window.top due to cross-origin, we're definitely in an iframe
      setIsInIframe(true);
    }
  }, []);

  // If in iframe, show "Open in New Tab" message
  if (isInIframe && !isConnected) {
    return (
      <div className="wallet-connectors">
        <div style={{ 
          textAlign: 'center', 
          padding: '20px',
          background: 'rgba(255, 107, 53, 0.1)',
          borderRadius: '12px',
          border: '1px solid rgba(255, 107, 53, 0.3)'
        }}>
          <div style={{ 
            fontSize: '24px', 
            marginBottom: '12px' 
          }}>
            🔓
          </div>
          <div style={{ 
            color: '#fff', 
            fontSize: '16px', 
            fontWeight: 'bold',
            marginBottom: '8px' 
          }}>
            Wallet Connection Required
          </div>
          <div style={{ 
            color: 'rgba(255, 255, 255, 0.7)', 
            fontSize: '14px',
            marginBottom: '16px',
            lineHeight: '1.5'
          }}>
            For security, wallet connections must open in a new tab
          </div>
          <button
            onClick={() => {
              window.open(window.location.href, '_blank');
            }}
            style={{
              width: '100%',
              padding: '14px 24px',
              fontSize: '16px',
              fontWeight: 'bold',
              background: 'linear-gradient(90deg, #00d4aa 0%, #0052ff 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'transform 0.2s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            Open in New Tab
          </button>
        </div>
      </div>
    );
  }

  if (isConnected) {
    return (
      <div className="wallet-connected">
        <div className="wallet-info">
          <div className="wallet-address">
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </div>
          <div className="wallet-xp">
            XP: {points.totalXP}
          </div>
        </div>
        <button 
          onClick={() => disconnect()}
          className="disconnect-button"
        >
          Disconnect
        </button>
        
        <style>{`
          .wallet-connected {
            display: flex;
            align-items: center;
            gap: 16px;
            padding: 12px 20px;
            background: rgba(10, 25, 41, 0.8);
            border: 1px solid rgba(0, 240, 255, 0.3);
            border-radius: 12px;
            backdrop-filter: blur(10px);
          }
          
          .wallet-info {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }
          
          .wallet-address {
            color: #00f0ff;
            font-weight: bold;
            font-size: 14px;
            font-family: 'Courier New', monospace;
          }
          
          .wallet-xp {
            color: #66fcf1;
            font-size: 12px;
          }
          
          .disconnect-button {
            background: transparent;
            border: 1px solid #00f0ff;
            color: #00f0ff;
            padding: 8px 16px;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s ease;
            font-size: 12px;
          }
          
          .disconnect-button:hover {
            background: rgba(0, 240, 255, 0.1);
            transform: translateY(-1px);
          }
        `}</style>
      </div>
    );
  }

  // Check which browser extensions are actually installed
  const [hasMetaMaskExtension, setHasMetaMaskExtension] = React.useState(false);
  const [hasCoinbaseExtension, setHasCoinbaseExtension] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Check specifically for MetaMask extension (not just any ethereum provider)
    const ethereum = (window as any).ethereum;
    if (ethereum) {
      // Check if MetaMask is the provider or in the providers array
      const isMetaMask = ethereum.isMetaMask || 
        (ethereum.providers && ethereum.providers.some((p: any) => p.isMetaMask));
      setHasMetaMaskExtension(isMetaMask);
    }
    
    // Check for Coinbase Wallet extension
    setHasCoinbaseExtension(typeof (window as any).coinbaseWalletExtension !== 'undefined');
  }, []);

  // Find desktop browser extension connectors
  const coinbaseConnector = connectors.find(c => 
    c.id.toLowerCase().includes('coinbase') || 
    c.name.toLowerCase().includes('coinbase')
  );
  const metaMaskConnector = connectors.find(c => 
    c.id.toLowerCase().includes('injected') ||
    c.name.toLowerCase().includes('metamask')
  );

  // Only show connectors if extensions are installed
  const readyCoinbaseConnector = hasCoinbaseExtension ? coinbaseConnector : null;
  const readyMetaMaskConnector = hasMetaMaskExtension ? metaMaskConnector : null;

  console.log('WalletConnect render:', {
    connectorsLength: connectors.length,
    hasMetaMaskExtension,
    hasCoinbaseExtension,
    readyCoinbase: !!readyCoinbaseConnector,
    readyMetaMask: !!readyMetaMaskConnector,
    isPending,
    isConnected
  });

  const handleConnect = async (connector: any, walletName: string) => {
    console.log('Connect button clicked:', walletName);
    try {
      await connect({ connector });
    } catch (error) {
      console.error('Connect error:', error);
      alert('Connection failed. Please try again.');
    }
  };

  return (
    <div className="wallet-connectors">
      {!readyCoinbaseConnector && !readyMetaMaskConnector ? (
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: '15px', color: '#fff', fontSize: '14px' }}>
            No wallet extension detected. Install one to continue:
          </div>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              window.open('https://www.coinbase.com/wallet/downloads', '_blank');
            }}
            className="primary-cta"
          >
            Install Coinbase Wallet
          </button>
          <div className="divider">Or</div>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              window.open('https://metamask.io/download/', '_blank');
            }}
            className="secondary-button"
          >
            Install MetaMask
          </button>
        </div>
      ) : (
        <>
          {/* Coinbase Wallet - Primary for Base network */}
          {readyCoinbaseConnector && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleConnect(readyCoinbaseConnector, 'Coinbase Wallet');
              }}
              disabled={isPending}
              className="primary-cta"
            >
              🔵 Connect Coinbase Wallet
              {isPending && ' (Connecting...)'}
            </button>
          )}

          {/* MetaMask - Secondary option */}
          {readyMetaMaskConnector && (
            <>
              <div className="divider">Or connect with</div>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleConnect(readyMetaMaskConnector, 'MetaMask');
                }}
                disabled={isPending}
                className="secondary-button"
              >
                🦊 MetaMask
              </button>
            </>
          )}
        </>
      )}
      
      <style>{`
        .wallet-connectors {
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding: 24px;
          background: rgba(10, 25, 41, 0.8);
          border: 1px solid rgba(0, 240, 255, 0.3);
          border-radius: 12px;
          backdrop-filter: blur(10px);
          min-width: 280px;
        }
        
        /* Primary CTA - Large and prominent */
        .primary-cta {
          background: linear-gradient(135deg, #0052ff 0%, #0066ff 100%);
          border: none;
          color: #fff;
          padding: 18px 28px;
          border-radius: 12px;
          cursor: pointer;
          font-weight: bold;
          font-size: 18px;
          transition: all 0.3s ease;
          box-shadow: 0 4px 20px rgba(0, 82, 255, 0.3);
          width: 100%;
        }
        
        .primary-cta:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 25px rgba(0, 82, 255, 0.5);
          background: linear-gradient(135deg, #0066ff 0%, #0052ff 100%);
        }
        
        .primary-cta:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        /* Divider text */
        .divider {
          text-align: center;
          color: rgba(255, 255, 255, 0.5);
          font-size: 13px;
          margin: 8px 0;
          position: relative;
        }
        
        .divider::before,
        .divider::after {
          content: '';
          position: absolute;
          top: 50%;
          width: 35%;
          height: 1px;
          background: rgba(255, 255, 255, 0.2);
        }
        
        .divider::before {
          left: 0;
        }
        
        .divider::after {
          right: 0;
        }
        
        .secondary-button {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #fff;
          padding: 12px 20px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          font-size: 15px;
          transition: all 0.3s ease;
          width: 100%;
        }
        
        .secondary-button:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.3);
          transform: translateY(-1px);
        }
        
        .secondary-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}

export default WalletConnect;