import { useState, useEffect, useMemo } from 'react';
import { useAccount, useSwitchChain } from 'wagmi';
import { networkChain } from '../../client/src/config/wagmi';
import WalletConnect from '../../client/src/components/WalletConnect';
import './claim.css';

const generateParticles = (count: number) => Array.from({ length: count }, (_, i) => ({
  left: Math.random() * 100,
  top: Math.random() * 100,
  size: 3 + Math.random() * 6,
  delay: Math.random() * 5,
  duration: 8 + Math.random() * 12,
  color: i % 3 === 0 ? 'rgba(0, 212, 170, 0.4)' : i % 3 === 1 ? 'rgba(0, 82, 255, 0.35)' : 'rgba(255, 107, 53, 0.3)',
}));

const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
};

export default function Claim() {
  const particles = useMemo(() => generateParticles(isMobile() ? 8 : 30), []);
  const [showInput, setShowInput] = useState(false);
  const [name, setName] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState('');
  const [isReserving, setIsReserving] = useState(false);

  const { address, isConnected, chain } = useAccount();
  const { switchChain } = useSwitchChain();

  const nameRegex = /^[a-z][a-z0-9-]{2,31}$/;
  const isValid = nameRegex.test(name);

  useEffect(() => {
    const preferredMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (preferredMotion.matches) {
      document.documentElement.classList.add('motion-off');
    }
  }, []);

  useEffect(() => {
    if (!name) {
      setIsAvailable(null);
      setError('');
      return;
    }

    const nameRegex = /^[a-z][a-z0-9-]{2,31}$/;
    if (!nameRegex.test(name)) {
      setIsAvailable(null);
      if (name.length < 3) {
        setError('Must be at least 3 characters');
      } else if (name.length > 32) {
        setError('Must be 32 characters or less');
      } else if (!/^[a-z]/.test(name)) {
        setError('Must start with a letter');
      } else {
        setError('Only lowercase letters, numbers, hyphens');
      }
      return;
    }

    setError('');
    setIsChecking(true);

    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/rep/check?name=${name}`);
        const data = await response.json();
        
        if (data.ok) {
          setIsAvailable(data.available);
        } else {
          setIsAvailable(null);
          setError(data.error || 'Invalid name format');
        }
      } catch (err) {
        setIsAvailable(null);
        setError('Error checking availability');
      } finally {
        setIsChecking(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [name]);

  const handleReserve = async () => {
    if (!address || isReserving) return;

    setIsReserving(true);
    try {
      const response = await fetch('/api/rep/reserve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          walletAddress: address,
        }),
      });

      if (response.ok) {
        const rid = Math.random().toString(36).substring(2, 15);
        window.location.href = `/wallet?name=${encodeURIComponent(name)}&rid=${rid}`;
      } else {
        alert('Failed to reserve name. Please try again.');
      }
    } catch (error) {
      console.error('Error reserving name:', error);
      alert('Error reserving name. Please try again.');
    } finally {
      setIsReserving(false);
    }
  };

  const renderButton = () => {
    // Initial state: show input
    if (!showInput) {
      return (
        <button 
          className="connect-button"
          onClick={() => setShowInput(true)}
        >
          Reserve your .rep
        </button>
      );
    }

    // Name not valid or empty
    if (!name || !isValid) {
      return (
        <button className="connect-button" disabled>
          Check availability
        </button>
      );
    }

    // Checking availability
    if (isChecking) {
      return (
        <button className="connect-button" disabled>
          Checking...
        </button>
      );
    }

    // Name not available
    if (isAvailable === false) {
      return (
        <button className="connect-button" disabled>
          Name is taken
        </button>
      );
    }

    // Name is available, but wallet not connected - show WalletConnect component
    if (isAvailable === true && !isConnected) {
      return (
        <div style={{ width: '100%', maxWidth: '400px' }}>
          <WalletConnect />
        </div>
      );
    }

    // Connected but wrong chain
    if (isAvailable === true && isConnected && chain?.id !== networkChain.id) {
      return (
        <button 
          className="connect-button"
          onClick={() => switchChain({ chainId: networkChain.id })}
        >
          Switch to {networkChain.name} to claim
        </button>
      );
    }

    // Ready to reserve
    if (isAvailable === true && isConnected && chain?.id === networkChain.id) {
      return (
        <button 
          className="connect-button"
          onClick={handleReserve}
          disabled={isReserving}
        >
          {isReserving ? 'Reserving...' : 'Reserve your .rep'}
        </button>
      );
    }

    return (
      <button className="connect-button" disabled>
        Check availability
      </button>
    );
  };

  return (
    <div className="claim-page">
      <div className="particle-bg" aria-hidden="true">
        {particles.map((particle, i) => (
          <div 
            key={i} 
            className="particle" 
            style={{
              left: `${particle.left}%`,
              top: `${particle.top}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              background: particle.color,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${particle.duration}s`
            }}
          />
        ))}
      </div>

      <div className="claim-container">
        <div className="claim-content">
          <h1 className="claim-title">Reserve your.rep</h1>
          <p className="claim-rules">
            Rules: 3-32 characters, lowercase letters,<br />
            numbers, hyphens. Start with a letter.
          </p>

          <div className="claim-steps">
            <span className="step active">1 Claim</span>
            <span className="step-dot">•</span>
            <span className="step">2 Link</span>
            <span className="step-dot">•</span>
            <span className="step">3 Done</span>
          </div>

          {showInput && (
            <>
              <div className="name-input-wrapper">
                <input
                  type="text"
                  className="name-input"
                  placeholder="yourname"
                  value={name}
                  onChange={(e) => setName(e.target.value.toLowerCase())}
                  maxLength={32}
                />
                <span className="name-suffix">.rep</span>
              </div>

              {isChecking && (
                <div className="status-message checking">Checking availability...</div>
              )}

              {!isChecking && isAvailable === true && (
                <div className="status-message available">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M13.3334 4L6.00002 11.3333L2.66669 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {name}.rep is available
                </div>
              )}

              {!isChecking && isAvailable === false && (
                <div className="status-message unavailable">
                  {name}.rep is not available
                </div>
              )}

              {error && (
                <div className="status-message error">{error}</div>
              )}
            </>
          )}

          {renderButton()}
        </div>

        <div className="claim-chameleon">
          <img 
            src="/chameleon_claim.png" 
            alt="Chameleon mascot" 
            className="claim-chameleon-img"
          />
        </div>
      </div>
    </div>
  );
}
