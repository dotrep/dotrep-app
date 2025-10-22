import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAccount, useSwitchChain, useSignMessage, useDisconnect, useConnect, useConnectors } from 'wagmi';
import { networkChain } from '../config/wagmi';
import { useLocation } from 'wouter';
import { WalletPickerModal } from '../components/WalletPickerModal';
import { toast } from '../hooks/use-toast';
import { SEOHead } from '../components/SEOHead';
import { canonicalize, isValidName as validateName } from '../../../shared/validate';
import { ensureBase } from '../lib/ensureBase';

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
  walletStatus: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    padding: '12px 16px',
    background: 'rgba(0, 212, 170, 0.1)',
    border: '1px solid rgba(0, 212, 170, 0.3)',
    borderRadius: '8px',
    marginBottom: '8px',
  },
  walletAddress: {
    fontSize: '14px',
    color: '#00d4aa',
    fontWeight: 600,
  },
  disconnectButton: {
    padding: '6px 12px',
    fontSize: '13px',
    fontWeight: 600,
    background: 'rgba(255, 255, 255, 0.1)',
    color: '#f1f5f9',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
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
  const [claimStatus, setClaimStatus] = useState<string>('');
  const inFlightRef = useRef(false);

  const { address, isConnected, chain } = useAccount();
  const { switchChain } = useSwitchChain();
  const { signMessageAsync } = useSignMessage();
  const { disconnect } = useDisconnect();
  const { connect } = useConnect();
  const connectors = useConnectors();

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

  // Mobile deep-link resume logic
  useEffect(() => {
    const handleResume = async () => {
      const pendingName = localStorage.getItem('rep:pendingName');
      const intent = localStorage.getItem('rep:intent');
      
      if (pendingName && intent === 'claim' && isConnected && address) {
        console.log('[RESUME] Detected pending claim for:', pendingName);
        console.log('[RESUME] Wallet reconnected, resuming flow...');
        
        // Clear pending state
        localStorage.removeItem('rep:intent');
        
        // Resume from challenge step (skip connect)
        try {
          await resumeClaimFromChallenge(pendingName, address);
        } catch (err) {
          console.error('[RESUME] Resume failed:', err);
          localStorage.removeItem('rep:pendingName');
        }
      }
    };
    
    // Run on mount
    handleResume();
    
    // Run on visibility change (mobile return from wallet)
    const onVisibilityChange = () => {
      if (!document.hidden) {
        handleResume();
      }
    };
    
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [isConnected, address]);

  // Resume claim from challenge step (for mobile deep-link return)
  const resumeClaimFromChallenge = async (nameToResume: string, walletAddress: string) => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setIsReserving(true);
    
    try {
      console.log('[ATOMIC-RESUME] Starting from challenge step');
      setClaimStatus('Getting challenge...');
      
      const canonical = canonicalize(nameToResume);
      
      // Step 3: GET challenge
      const challengeRes = await fetch(`/api/auth/challenge?name=${encodeURIComponent(canonical)}&address=${encodeURIComponent(walletAddress)}`);
      const challenge = await challengeRes.json();
      
      if (!challenge.ok) {
        throw new Error(challenge.error || 'Failed to get challenge');
      }
      
      console.log('[ATOMIC-RESUME] ✓ Challenge received');
      setClaimStatus('Signing message...');
      
      // Step 4: Sign exact message
      const signature = await signMessageAsync({ message: challenge.message });
      console.log('[ATOMIC-RESUME] ✓ Message signed');
      
      setClaimStatus('Verifying signature...');
      
      // Step 5: Verify
      const verifyRes = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: walletAddress,
          message: challenge.message,
          nonce: challenge.nonce,
          expiresAt: challenge.expiresAt,
          mac: challenge.mac,
          signature
        }),
      });
      
      const verifyResult = await verifyRes.json();
      
      if (!verifyResult.ok) {
        throw new Error(verifyResult.error || 'Verification failed');
      }
      
      console.log('[ATOMIC-RESUME] ✓ Signature verified');
      setClaimStatus('Reserving name...');
      
      // Step 6: Reserve (idempotent)
      const reserveRes = await fetch('/api/rep/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: canonical, address: walletAddress }),
      });
      
      const reserveResult = await reserveRes.json();
      
      if (!reserveResult.ok || !reserveResult.reservationId) {
        throw new Error(reserveResult.error || 'Reserve failed');
      }
      
      console.log('[ATOMIC-RESUME] ✓ Name reserved:', reserveResult.reservationId);
      
      // Step 7: Persist & redirect
      localStorage.setItem('rep:lastName', canonical);
      localStorage.setItem('rep:reservationId', reserveResult.reservationId);
      localStorage.setItem('rep:address', walletAddress);
      localStorage.removeItem('rep:pendingName');
      
      toast({
        title: "Name Claimed! 🎉",
        description: `Successfully claimed ${canonical}.rep`,
      });
      
      window.location.assign(`/wallet?name=${encodeURIComponent(canonical)}&rid=${encodeURIComponent(reserveResult.reservationId)}`);
    } catch (err: any) {
      console.error('[ATOMIC-RESUME] Error:', err);
      toast({
        title: "Claim Failed",
        description: err.message || 'Could not complete claim. Please try again.',
        variant: "destructive",
      });
      setIsReserving(false);
      inFlightRef.current = false;
    }
  };

  // Main atomic claim handler
  const handleAtomicClaim = async () => {
    if (inFlightRef.current) {
      console.log('[ATOMIC] Already in flight, ignoring click');
      return;
    }
    
    inFlightRef.current = true;
    setIsReserving(true);
    setClaimStatus('');
    
    try {
      const canonical = canonicalize(name);
      
      if (!validateName(canonical)) {
        throw new Error('Invalid name format');
      }
      
      console.log('[ATOMIC] Step 1: Connect wallet');
      setClaimStatus('Connecting wallet...');
      
      // Store pending intent for mobile deep-link resume
      localStorage.setItem('rep:pendingName', canonical);
      localStorage.setItem('rep:intent', 'claim');
      
      // Step 1: Connect if not already connected
      if (!isConnected || !address) {
        console.log('[ATOMIC] Wallet not connected, showing modal');
        setClaimStatus('');
        setIsReserving(false);
        inFlightRef.current = false;
        setShowWalletModal(true);
        return;
      }
      
      const walletAddress = address;
      console.log('[ATOMIC] ✓ Wallet already connected:', address);
      
      // Step 2: Ensure Base network
      console.log('[ATOMIC] Step 2: Ensure Base network');
      setClaimStatus('Switching to Base...');
      
      await ensureBase();
      console.log('[ATOMIC] ✓ On Base network');
      
      // Step 3: GET challenge
      console.log('[ATOMIC] Step 3: Get HMAC challenge');
      setClaimStatus('Getting challenge...');
      
      const challengeRes = await fetch(`/api/auth/challenge?name=${encodeURIComponent(canonical)}&address=${encodeURIComponent(walletAddress)}`);
      const challenge = await challengeRes.json();
      
      if (!challenge.ok) {
        throw new Error(challenge.error || 'Failed to get challenge');
      }
      
      console.log('[ATOMIC] ✓ Challenge received');
      
      // Step 4: Sign exact message
      console.log('[ATOMIC] Step 4: Sign message');
      setClaimStatus('Signing message...');
      
      const signature = await signMessageAsync({ message: challenge.message });
      console.log('[ATOMIC] ✓ Message signed');
      
      // Step 5: Verify signature
      console.log('[ATOMIC] Step 5: Verify signature');
      setClaimStatus('Verifying signature...');
      
      const verifyRes = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: walletAddress,
          message: challenge.message,
          nonce: challenge.nonce,
          expiresAt: challenge.expiresAt,
          mac: challenge.mac,
          signature
        }),
      });
      
      const verifyResult = await verifyRes.json();
      
      if (!verifyResult.ok) {
        throw new Error(verifyResult.error || 'Verification failed');
      }
      
      console.log('[ATOMIC] ✓ Signature verified');
      
      // Step 6: Reserve (idempotent)
      console.log('[ATOMIC] Step 6: Reserve name');
      setClaimStatus('Reserving name...');
      
      const reserveRes = await fetch('/api/rep/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: canonical, address: walletAddress }),
      });
      
      const reserveResult = await reserveRes.json();
      
      if (!reserveResult.ok || !reserveResult.reservationId) {
        throw new Error(reserveResult.error || reserveResult.details || 'Reserve failed');
      }
      
      console.log('[ATOMIC] ✓ Name reserved:', reserveResult.reservationId);
      
      // Step 7: Persist & redirect
      console.log('[ATOMIC] Step 7: Redirect');
      localStorage.setItem('rep:lastName', canonical);
      localStorage.setItem('rep:reservationId', reserveResult.reservationId);
      localStorage.setItem('rep:address', walletAddress);
      localStorage.removeItem('rep:pendingName');
      
      toast({
        title: "Name Claimed! 🎉",
        description: `Successfully claimed ${canonical}.rep`,
      });
      
      window.location.assign(`/wallet?name=${encodeURIComponent(canonical)}&rid=${encodeURIComponent(reserveResult.reservationId)}`);
    } catch (err: any) {
      console.error('[ATOMIC] Error:', err);
      toast({
        title: "Claim Failed",
        description: err.message || 'Could not complete claim. Please try again.',
        variant: "destructive",
      });
      setIsReserving(false);
      setClaimStatus('');
      inFlightRef.current = false;
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
      const walletNotConnected = !isConnected || !address;
      
      // If wallet not connected, show ENABLED button that opens wallet modal
      if (walletNotConnected) {
        return (
          <>
            <button
              style={styles.connectButton}
              onClick={() => setShowWalletModal(true)}
            >
              Connect Wallet to Claim
            </button>
          </>
        );
      }
      
      // Wallet connected, show atomic claim button
      return (
        <>
          <button
            style={isReserving ? styles.connectButtonDisabled : styles.connectButton}
            onClick={handleAtomicClaim}
            disabled={isReserving}
          >
            {isReserving ? (claimStatus || 'Processing...') : `Claim ${name}.rep`}
          </button>
          {claimStatus && (
            <div style={{ fontSize: '14px', color: '#00d4aa', marginTop: '8px' }}>
              {claimStatus}
            </div>
          )}
        </>
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
          
          {isConnected && address && (
            <div style={styles.walletStatus}>
              <div style={styles.walletAddress}>
                Connected: {address.slice(0, 6)}...{address.slice(-4)}
              </div>
              <button 
                style={styles.disconnectButton}
                onClick={() => {
                  disconnect();
                  toast({
                    title: "Wallet Disconnected",
                    description: "You can now connect a different wallet",
                  });
                }}
              >
                Switch Wallet
              </button>
            </div>
          )}
          
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
