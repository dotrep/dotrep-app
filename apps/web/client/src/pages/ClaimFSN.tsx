import React, { useState, useEffect, useMemo } from 'react';
import { useAccount, useSwitchChain } from 'wagmi';
import { networkChain } from '../config/wagmi';
import { useLocation } from 'wouter';
import { WalletPickerModal } from '../components/WalletPickerModal';
import { toast } from '../hooks/use-toast';
import { SEOHead } from '../components/SEOHead';

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
    position: 'relative' as const,
    zIndex: 10,
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
    position: 'relative' as const,
    zIndex: 10,
    pointerEvents: 'auto' as const,
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
  const [, setLocation] = useLocation();
  const [showInput, setShowInput] = useState(false);
  const [name, setName] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState('');
  const [isReserving, setIsReserving] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);

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
        const response = await fetch(`/api/rep/check?name=${encodeURIComponent(name)}`);
        const result = await response.json();
        
        if (result.ok) {
          setIsAvailable(result.available);
          if (!result.available) {
            setError('Name already taken');
          }
        } else {
          setIsAvailable(null);
          setError('Error checking availability');
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
    // Triple validation: isConnecting check, address existence, and actual value
    if (!isConnected || !address || isReserving) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to claim a .rep name",
        variant: "destructive",
      });
      setShowWalletModal(true);
      return;
    }

    setIsReserving(true);
    try {
      const response = await fetch('/api/rep/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, walletAddress: address }),
      });

      const result = await response.json();

      if (result.ok) {
        const rid = result.reservationId || Math.random().toString(36).substring(2, 15);
        
        localStorage.setItem('rep:lastName', name);
        localStorage.setItem('rep:address', address);
        localStorage.setItem('rep:reservationId', rid);
        localStorage.removeItem('rep:linked');
        
        toast({
          title: "Name Reserved! 🎉",
          description: `You've successfully reserved ${name}.rep`,
        });

        setTimeout(() => {
          setLocation(`/wallet`);
        }, 500);
      } else {
        toast({
          title: "Reservation Failed",
          description: result.error === 'ALREADY_RESERVED' ? 'This name is already taken' : 'Failed to reserve name',
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({
        title: "Reservation Failed",
        description: err.message || "Failed to reserve name. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsReserving(false);
    }
  };

  const handleSmartCTA = () => {
    // IMMEDIATE TEST - prove button clicks work
    console.log('🔴 BUTTON CLICKED!', new Date().toISOString());
    alert('Button click detected! Check console for details.');
    
    console.log('[CLAIM DEBUG] Smart CTA clicked');
    console.log('[CLAIM DEBUG] isConnected:', isConnected);
    console.log('[CLAIM DEBUG] address:', address);
    console.log('[CLAIM DEBUG] chain:', chain);
    
    // Layer 1: Check wallet connection status AND address value
    if (!isConnected || !address) {
      console.log('[CLAIM DEBUG] No wallet connected - opening modal');
      toast({
        title: "Wallet Required",
        description: "Connect your wallet to claim your .rep name",
        variant: "destructive",
      });
      setShowWalletModal(true);
      return;
    }

    // Layer 2: Check network - must be on Base
    if (chain?.id !== networkChain.id) {
      console.log('[CLAIM DEBUG] Wrong network - switching to Base');
      toast({
        title: "Wrong Network",
        description: "Switching to Base network...",
      });
      switchChain({ chainId: networkChain.id });
      return;
    }

    // Layer 3: All validations passed, proceed to reservation
    console.log('[CLAIM DEBUG] All checks passed - proceeding to reserve');
    handleReserve();
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

    if (isAvailable === true) {
      return (
        <button
          style={isReserving ? styles.connectButtonDisabled : styles.connectButton}
          onClick={handleSmartCTA}
          disabled={isReserving}
        >
          {isReserving ? 'Reserving...' : `Claim ${name}.rep`}
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
      <SEOHead
        title="Claim your .rep name - .rep Platform"
        description="Reserve your soulbound .rep name on Base blockchain. 3-32 characters, lowercase letters/numbers/hyphens."
        ogImage="/og-claim.png"
        path="/claim"
      />
      <div style={styles.claimPage}>
        <div style={styles.particleBg}>
        {particles.map((p, i) => (
          <div
            key={i}
            style={{
              ...styles.particle,
              left: `${p.left}%`,
              top: `${p.top}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              background: p.color,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
            }}
          />
        ))}
      </div>

      <div style={styles.claimContainer}>
        <div style={styles.claimContent}>
          <h1 style={styles.claimTitle}>Reserve your.rep</h1>
          
          <p style={styles.claimRules}>
            3-32 characters, lowercase letters/numbers/hyphens<br />
            Must start with a letter
          </p>

          <div style={styles.claimSteps}>
            <span style={showInput ? styles.stepActive : styles.step}>1 Claim</span>
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
                  value={name}
                  onChange={(e) => setName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="yourname"
                  style={styles.nameInput}
                  autoFocus
                />
                <span style={styles.nameSuffix}>.rep</span>
              </div>

              {name && (
                <div style={styles.statusMessage}>
                  {isChecking && <span style={styles.statusChecking}>Checking...</span>}
                  {!isChecking && isAvailable === true && <span style={styles.statusAvailable}>✓ {name}.rep is available</span>}
                  {!isChecking && isAvailable === false && <span style={styles.statusUnavailable}>✗ Name is taken</span>}
                  {!isChecking && error && !isAvailable && <span style={styles.statusError}>{error}</span>}
                </div>
              )}
            </>
          )}

          {renderButton()}
        </div>

        {!isMobile() && (
          <div style={styles.claimChameleon}>
            <img 
              src="/chameleon_claim.png" 
              alt="Chameleon mascot" 
              style={styles.claimChameleonImg}
            />
          </div>
        )}
      </div>

      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) scale(1);
            opacity: 0.3;
          }
          50% {
            transform: translateY(-30px) scale(1.1);
            opacity: 0.6;
          }
        }
        
        .motion-off * {
          animation: none !important;
          transition: none !important;
        }
      `}</style>
      </div>

      <WalletPickerModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
      />
    </>
  );
}
