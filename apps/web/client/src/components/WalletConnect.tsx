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

  // Map connectors to user-friendly display
  const getConnectorDisplay = (connector: any) => {
    const name = connector.name.toLowerCase();
    const id = connector.id.toLowerCase();
    
    if (name.includes('metamask') || name.includes('injected')) {
      return { label: '🦊 MetaMask', color: '#f6851b', priority: 1 };
    }
    if (id.includes('walletconnect')) {
      return { label: '📱 Mobile Wallet', color: '#0052ff', priority: 2 };
    }
    return null;
  };

  const displayConnectors = connectors
    .map(connector => ({ connector, display: getConnectorDisplay(connector) }))
    .filter(({ display }) => display !== null)
    .sort((a, b) => a.display!.priority - b.display!.priority);

  // Add debugging for mobile
  console.log('WalletConnect render:', {
    connectorsLength: connectors.length,
    displayConnectors: displayConnectors.map(({ connector, display }) => ({ 
      name: connector.name, 
      id: connector.id,
      display: display?.label 
    })),
    isPending,
    isConnected
  });

  return (
    <div className="wallet-connectors">
      {displayConnectors.length === 0 ? (
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: '15px', color: '#fff', fontSize: '14px' }}>
            No wallet detected. Install a compatible wallet:
          </div>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              window.open('https://metamask.io/download/', '_blank');
            }}
            className="connect-button"
            style={{
              padding: '12px 24px',
              backgroundColor: '#f6851b',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 'bold',
              cursor: 'pointer',
              marginBottom: '10px',
              width: '100%',
              fontSize: '16px',
              minHeight: '48px'
            }}
          >
            Install MetaMask
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              window.open('https://www.coinbase.com/wallet/', '_blank');
            }}
            className="connect-button"
            style={{
              padding: '12px 24px',
              backgroundColor: '#0052ff',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 'bold',
              cursor: 'pointer',
              width: '100%',
              fontSize: '16px',
              minHeight: '48px'
            }}
          >
            Install Coinbase Wallet
          </button>
        </div>
      ) : (
        displayConnectors.map(({ connector, display }) => (
          <button
            key={connector.uid}
            onClick={async (e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Connect button clicked:', connector.name);
              try {
                await connect({ connector });
              } catch (error) {
                console.error('Connect error:', error);
                alert('Connection failed. Please try again.');
              }
            }}
            disabled={isPending}
            className="connect-button"
            style={{
              backgroundColor: display!.color,
              color: '#fff',
              fontSize: '16px',
              minHeight: '48px',
              width: '100%',
              padding: '12px 24px',
              border: 'none',
              borderRadius: '8px',
              cursor: isPending ? 'not-allowed' : 'pointer',
              opacity: isPending ? 0.7 : 1,
              touchAction: 'manipulation'
            }}
          >
            {display!.label}
            {isPending && ' (Connecting...)'}
          </button>
        ))
      )}
      
      <style>{`
        .wallet-connectors {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 20px;
          background: rgba(10, 25, 41, 0.8);
          border: 1px solid rgba(0, 240, 255, 0.3);
          border-radius: 12px;
          backdrop-filter: blur(10px);
          min-width: 200px;
        }
        
        .connect-title {
          color: #00f0ff;
          font-weight: bold;
          text-align: center;
          margin-bottom: 8px;
        }
        
        .connect-button {
          background: linear-gradient(135deg, #00f0ff 0%, #66fcf1 100%);
          border: none;
          color: #000;
          padding: 12px 20px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: bold;
          transition: all 0.3s ease;
        }
        
        .connect-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(0, 240, 255, 0.4);
        }
        
        .connect-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}

export default WalletConnect;