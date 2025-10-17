import React, { useEffect, useState } from 'react';
import { useAccount, useConnect } from 'wagmi';
import { useLocation } from 'wouter';

export function SignedInHeader() {
  const [, setLocation] = useLocation();
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const [repName, setRepName] = useState('');

  useEffect(() => {
    const storedName = localStorage.getItem('rep:lastName');
    if (storedName) {
      setRepName(storedName);
    }
  }, []);

  useEffect(() => {
    const storedAddress = localStorage.getItem('rep:address');
    const storedConnected = localStorage.getItem('rep:connected');
    const storedConnectorId = localStorage.getItem('rep:connectorId');
    
    if (!isConnected && storedAddress && storedConnected === 'true' && storedConnectorId) {
      const tryReconnect = async () => {
        const connector = connectors.find(c => c.id === storedConnectorId);
        if (connector) {
          try {
            await connect({ connector });
          } catch (err) {
            console.log('Auto-reconnect failed:', err);
          }
        }
      };
      tryReconnect();
    }
  }, [isConnected, connectors, connect]);

  const handleClick = () => {
    setLocation('/rep-dashboard');
  };

  if (!isConnected && !repName) {
    return null;
  }

  const displayName = repName ? `${repName}.rep` : (address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '');

  return (
    <div
      onClick={handleClick}
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 100,
        padding: '12px 20px',
        background: 'rgba(30, 41, 59, 0.9)',
        border: '2px solid #00d4aa',
        borderRadius: '24px',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(30, 41, 59, 1)';
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 212, 170, 0.4)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(30, 41, 59, 0.9)';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <span style={{
        fontSize: '14px',
        fontWeight: 600,
        color: '#f1f5f9',
      }}>
        {displayName}
      </span>
      {address && repName && (
        <>
          <span style={{ color: '#64748b', fontSize: '12px' }}>•</span>
          <span style={{
            fontSize: '12px',
            color: '#94a3b8',
            fontFamily: 'monospace',
          }}>
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
        </>
      )}
    </div>
  );
}
