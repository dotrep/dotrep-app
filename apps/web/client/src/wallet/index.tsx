import React, { useEffect, useState } from 'react';
import { useAccount, useSwitchChain } from 'wagmi';
import { networkChain } from '../config/wagmi';
import WalletConnect from '../components/WalletConnect';
import { useLocation } from 'wouter';

export default function WalletExplorer() {
  const [, setLocation] = useLocation();
  const { address, isConnected, chain, connector } = useAccount();
  const { switchChain } = useSwitchChain();
  
  const [name, setName] = useState('');
  const [reservationId, setReservationId] = useState('');
  const [status, setStatus] = useState<'reserved' | 'linked' | 'done'>('reserved');
  const [isLinking, setIsLinking] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nameParam = params.get('name');
    const ridParam = params.get('rid');
    
    if (nameParam && ridParam) {
      setName(nameParam);
      setReservationId(ridParam);
      localStorage.setItem('rep:lastName', nameParam);
      localStorage.setItem('rep:reservationId', ridParam);
    } else {
      const storedName = localStorage.getItem('rep:lastName');
      const storedRid = localStorage.getItem('rep:reservationId');
      if (storedName && storedRid) {
        setName(storedName);
        setReservationId(storedRid);
      }
    }
    
    if (isConnected && address && connector) {
      localStorage.setItem('rep:address', address);
      localStorage.setItem('rep:connected', 'true');
      localStorage.setItem('rep:connectorId', connector.id);
    }
    
    const linkedStatus = localStorage.getItem('rep:linked');
    if (linkedStatus === 'true') {
      setStatus('done');
    } else if (isConnected && address) {
      setStatus('linked');
    }
  }, [isConnected, address, connector]);

  const handleLink = async () => {
    if (!isConnected || !address || !name) return;
    
    setIsLinking(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      localStorage.setItem('rep:linked', 'true');
      setStatus('done');
    } catch (err) {
      console.error('Link failed:', err);
    } finally {
      setIsLinking(false);
    }
  };

  const renderCTA = () => {
    if (!isConnected) {
      return (
        <div style={{ marginTop: '24px' }}>
          <WalletConnect />
        </div>
      );
    }

    if (chain?.id !== networkChain.id) {
      return (
        <button
          onClick={() => switchChain({ chainId: networkChain.id })}
          style={{
            width: '100%',
            maxWidth: '400px',
            padding: '16px 32px',
            fontSize: '16px',
            fontWeight: 600,
            background: 'linear-gradient(90deg, #00d4aa 0%, #0052ff 100%)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
            marginTop: '24px',
          }}
        >
          Switch to Base
        </button>
      );
    }

    if (status === 'linked') {
      return (
        <button
          onClick={handleLink}
          disabled={isLinking}
          style={{
            width: '100%',
            maxWidth: '400px',
            padding: '16px 32px',
            fontSize: '16px',
            fontWeight: 600,
            background: isLinking ? '#334155' : 'linear-gradient(90deg, #00d4aa 0%, #0052ff 100%)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '12px',
            cursor: isLinking ? 'not-allowed' : 'pointer',
            marginTop: '24px',
          }}
        >
          {isLinking ? 'Linking...' : 'Link wallet to claim'}
        </button>
      );
    }

    return (
      <div style={{
        marginTop: '24px',
        padding: '16px',
        background: 'rgba(0, 212, 170, 0.1)',
        border: '2px solid #00d4aa',
        borderRadius: '12px',
        textAlign: 'center',
        color: '#00d4aa',
        fontSize: '18px',
        fontWeight: 600,
      }}>
        ✓ Done
      </div>
    );
  };

  if (!name) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%)',
      }}>
        <div style={{
          maxWidth: '500px',
          textAlign: 'center',
          padding: '40px',
        }}>
          <h1 style={{
            fontSize: '32px',
            color: '#f1f5f9',
            marginBottom: '20px',
          }}>
            No Reservation Found
          </h1>
          <button
            onClick={() => setLocation('/claim')}
            style={{
              padding: '16px 32px',
              fontSize: '16px',
              fontWeight: 600,
              background: 'linear-gradient(90deg, #00d4aa 0%, #0052ff 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
            }}
          >
            Back to Claim
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%)',
      padding: '20px',
    }}>
      <div style={{
        maxWidth: '600px',
        width: '100%',
        background: 'rgba(30, 41, 59, 0.5)',
        border: '2px solid #334155',
        borderRadius: '16px',
        padding: '40px',
      }}>
        <h1 style={{
          fontSize: '36px',
          fontWeight: 700,
          background: 'linear-gradient(90deg, #00d4aa 0%, #0052ff 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '8px',
        }}>
          {name}.rep
        </h1>

        <div style={{
          display: 'inline-block',
          padding: '6px 16px',
          background: status === 'done' ? 'rgba(0, 212, 170, 0.2)' : 'rgba(100, 116, 139, 0.2)',
          border: `1px solid ${status === 'done' ? '#00d4aa' : '#64748b'}`,
          borderRadius: '20px',
          color: status === 'done' ? '#00d4aa' : '#94a3b8',
          fontSize: '14px',
          fontWeight: 600,
          marginBottom: '24px',
        }}>
          {status === 'reserved' ? 'Reserved' : status === 'linked' ? 'Linked' : 'Done'}
        </div>

        {isConnected && address && (
          <div style={{
            marginBottom: '24px',
            padding: '16px',
            background: 'rgba(51, 65, 85, 0.3)',
            borderRadius: '8px',
          }}>
            <div style={{
              fontSize: '14px',
              color: '#94a3b8',
              marginBottom: '4px',
            }}>
              Connected Address
            </div>
            <div style={{
              fontSize: '16px',
              color: '#f1f5f9',
              fontFamily: 'monospace',
            }}>
              {address.slice(0, 6)}...{address.slice(-4)}
            </div>
          </div>
        )}

        <div style={{
          fontSize: '14px',
          color: '#94a3b8',
          marginBottom: '24px',
        }}>
          <span style={{ color: status === 'reserved' || status === 'done' ? '#00d4aa' : '#64748b' }}>1 Claim</span>
          {' • '}
          <span style={{ color: status === 'linked' || status === 'done' ? '#00d4aa' : '#64748b' }}>2 Link</span>
          {' • '}
          <span style={{ color: status === 'done' ? '#00d4aa' : '#64748b' }}>3 Done</span>
        </div>

        {renderCTA()}

        <div style={{
          marginTop: '32px',
          display: 'flex',
          gap: '16px',
        }}>
          <button
            disabled
            style={{
              flex: 1,
              padding: '12px',
              background: 'rgba(51, 65, 85, 0.3)',
              border: '1px solid #334155',
              borderRadius: '8px',
              color: '#64748b',
              fontSize: '14px',
              cursor: 'not-allowed',
            }}
          >
            Add avatar
          </button>
          <button
            disabled
            style={{
              flex: 1,
              padding: '12px',
              background: 'rgba(51, 65, 85, 0.3)',
              border: '1px solid #334155',
              borderRadius: '8px',
              color: '#64748b',
              fontSize: '14px',
              cursor: 'not-allowed',
            }}
          >
            Set display name
          </button>
        </div>
      </div>
    </div>
  );
}
