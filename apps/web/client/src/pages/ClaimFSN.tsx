import React, { useState, useEffect, useMemo } from 'react';
import { useAccount, useSwitchChain } from 'wagmi';
import { networkChain } from '../config/wagmi';
import { useNameRegistry } from '../hooks/useNameRegistry';
import WalletConnect from '../components/WalletConnect';

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

const styles = {
  claimPage: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%)',
    position: 'relative' as const,
    overflow: 'hidden',
    padding: '20px',
  },
  particleBg: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none' as const,
  },
  particle: {
    position: 'absolute' as const,
    borderRadius: '50%',
    animation: 'float 20s infinite ease-in-out',
  },
  claimContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '60px',
    maxWidth: '1200px',
    width: '100%',
    position: 'relative' as const,
    zIndex: 1,
  },
  claimContent: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '24px',
    maxWidth: '500px',
    width: '100%',
  },
  claimTitle: {
    fontSize: '48px',
    fontWeight: 700,
    background: 'linear-gradient(90deg, #00d4aa 0%, #0052ff 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    textAlign: 'center' as const,
    marginBottom: '8px',
  },
  claimRules: {
    fontSize: '14px',
    color: '#94a3b8',
    textAlign: 'center' as const,
    lineHeight: '1.6',
  },
  claimSteps: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '8px',
  },
  step: {
    fontSize: '14px',
    color: '#64748b',
    fontWeight: 500,
  },
  stepActive: {
    fontSize: '14px',
    color: '#00d4aa',
    fontWeight: 600,
  },
  stepDot: {
    color: '#475569',
    fontSize: '12px',
  },
  nameInputWrapper: {
    position: 'relative' as const,
    width: '100%',
    maxWidth: '400px',
  },
  nameInput: {
    width: '100%',
    padding: '16px 80px 16px 20px',
    fontSize: '18px',
    background: 'rgba(30, 41, 59, 0.5)',
    border: '2px solid #334155',
    borderRadius: '12px',
    color: '#f1f5f9',
    outline: 'none',
    transition: 'all 0.3s ease',
  },
  nameSuffix: {
    position: 'absolute' as const,
    right: '20px',
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: '18px',
    color: '#64748b',
    fontWeight: 600,
  },
  statusMessage: {
    fontSize: '14px',
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    justifyContent: 'center',
  },
  statusChecking: {
    color: '#94a3b8',
  },
  statusAvailable: {
    color: '#00d4aa',
  },
  statusUnavailable: {
    color: '#ef4444',
  },
  statusError: {
    color: '#ef4444',
  },
  connectButton: {
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
    transition: 'all 0.3s ease',
    outline: 'none',
  },
  connectButtonDisabled: {
    width: '100%',
    maxWidth: '400px',
    padding: '16px 32px',
    fontSize: '16px',
    fontWeight: 600,
    background: '#334155',
    color: '#64748b',
    border: 'none',
    borderRadius: '12px',
    cursor: 'not-allowed',
    opacity: 0.6,
  },
  claimChameleon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  claimChameleonImg: {
    width: '300px',
    height: 'auto',
    maxWidth: '100%',
  },
};

export default function ClaimFSN() {
  const particles = useMemo(() => generateParticles(isMobile() ? 8 : 30), []);
  const [showInput, setShowInput] = useState(false);
  const [name, setName] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState('');
  const [userExistingName, setUserExistingName] = useState<string | null>(null);

  const { address, isConnected, chain } = useAccount();
  const { switchChain } = useSwitchChain();
  const { checkNameAvailability, registerName, getUserName, isLoading: isRegistering } = useNameRegistry();

  const nameRegex = /^[a-z][a-z0-9-]{2,31}$/;
  const isValid = nameRegex.test(name);

  useEffect(() => {
    const preferredMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (preferredMotion.matches) {
      document.documentElement.classList.add('motion-off');
    }
  }, []);

  useEffect(() => {
    const checkExistingName = async () => {
      if (isConnected && address) {
        const existingName = await getUserName(address);
        setUserExistingName(existingName);
        if (existingName) {
          alert(`Name Already Claimed: This wallet already owns ${existingName}.rep`);
        }
      } else {
        setUserExistingName(null);
      }
    };
    
    checkExistingName();
  }, [isConnected, address]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const nameParam = urlParams.get('name');
    if (nameParam) {
      setName(nameParam);
      setShowInput(true);
    }
  }, []);

  useEffect(() => {
    if (!name) {
      setIsAvailable(null);
      setError('');
      return;
    }

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
        const result = await checkNameAvailability(name);
        setIsAvailable(result.available);
        if (!result.available) {
          setError(result.reason || 'Name not available');
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
    if (!address || isRegistering || userExistingName) return;

    try {
      await registerName(name);
      
      alert(`Name Claimed! 🎉\n\nYou've successfully claimed ${name}.rep!`);
      window.location.href = '/wallet';

    } catch (err: any) {
      console.error('Registration failed:', err);
      alert(`Claim Failed\n\n${err.message || "Failed to claim name. Please try again."}`);
    }
  };

  const renderButton = () => {
    if (!showInput) {
      return (
        <button 
          style={styles.connectButton}
          onClick={() => setShowInput(true)}
        >
          Reserve your .rep
        </button>
      );
    }

    if (userExistingName) {
      return (
        <button style={styles.connectButtonDisabled} disabled>
          Wallet already owns {userExistingName}.rep
        </button>
      );
    }

    if (!name || !isValid) {
      return (
        <button style={styles.connectButtonDisabled} disabled>
          Check availability
        </button>
      );
    }

    if (isChecking) {
      return (
        <button style={styles.connectButtonDisabled} disabled>
          Checking...
        </button>
      );
    }

    if (isAvailable === false) {
      return (
        <button style={styles.connectButtonDisabled} disabled>
          Name is taken
        </button>
      );
    }

    if (isAvailable === true && !isConnected) {
      return (
        <div style={{ width: '100%', maxWidth: '400px' }}>
          <WalletConnect />
        </div>
      );
    }

    if (isAvailable === true && isConnected && chain?.id !== networkChain.id) {
      return (
        <button 
          style={styles.connectButton}
          onClick={() => switchChain({ chainId: networkChain.id })}
        >
          Switch to {networkChain.name} to claim
        </button>
      );
    }

    if (isAvailable === true && isConnected && chain?.id === networkChain.id) {
      return (
        <button 
          style={{...styles.connectButton, ...(isRegistering ? { opacity: 0.7 } : {})}}
          onClick={handleReserve}
          disabled={isRegistering}
        >
          {isRegistering ? 'Reserving...' : 'Reserve your .rep'}
        </button>
      );
    }

    return (
      <button style={styles.connectButtonDisabled} disabled>
        Check availability
      </button>
    );
  };

  return (
    <>
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.6;
          }
          25% {
            transform: translate(30px, -40px) scale(1.2);
            opacity: 0.8;
          }
          50% {
            transform: translate(-20px, -80px) scale(0.9);
            opacity: 1;
          }
          75% {
            transform: translate(40px, -120px) scale(1.1);
            opacity: 0.7;
          }
        }
      `}</style>
      <div style={styles.claimPage}>
        <div style={styles.particleBg} aria-hidden="true">
          {particles.map((particle, i) => (
            <div 
              key={i} 
              style={{
                ...styles.particle,
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

      <div style={styles.claimContainer}>
        <div style={styles.claimContent}>
          <h1 style={styles.claimTitle}>Reserve your.rep</h1>
          <p style={styles.claimRules}>
            Rules: 3-32 characters, lowercase letters,<br />
            numbers, hyphens. Start with a letter.
          </p>

          <div style={styles.claimSteps}>
            <span style={styles.stepActive}>1 Claim</span>
            <span style={styles.stepDot}>•</span>
            <span style={styles.step}>2 Link</span>
            <span style={styles.stepDot}>•</span>
            <span style={styles.step}>3 Done</span>
          </div>

          {showInput && (
            <>
              <div style={styles.nameInputWrapper}>
                <input
                  type="text"
                  style={styles.nameInput}
                  placeholder="yourname"
                  value={name}
                  onChange={(e) => setName(e.target.value.toLowerCase())}
                  maxLength={32}
                />
                <span style={styles.nameSuffix}>.rep</span>
              </div>

              {isChecking && (
                <div style={{...styles.statusMessage, ...styles.statusChecking}}>Checking availability...</div>
              )}

              {!isChecking && isAvailable === true && (
                <div style={{...styles.statusMessage, ...styles.statusAvailable}}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M13.3334 4L6.00002 11.3333L2.66669 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {name}.rep is available
                </div>
              )}

              {!isChecking && isAvailable === false && (
                <div style={{...styles.statusMessage, ...styles.statusUnavailable}}>
                  {name}.rep is not available
                </div>
              )}

              {error && (
                <div style={{...styles.statusMessage, ...styles.statusError}}>{error}</div>
              )}
            </>
          )}

          {renderButton()}
        </div>

        <div style={styles.claimChameleon}>
          <img 
            src="/chameleon_claim.png" 
            alt="Chameleon mascot" 
            style={styles.claimChameleonImg}
          />
        </div>
      </div>
    </div>
    </>
  );
}
