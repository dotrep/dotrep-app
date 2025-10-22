import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'wouter';
import { useAccount, useSignMessage } from 'wagmi';
import { WalletPickerModal } from '../../client/src/components/WalletPickerModal';
import './home.css';

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

export default function Home() {
  const particles = useMemo(() => generateParticles(isMobile() ? 8 : 30), []);
  const [, setLocation] = useLocation();
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();

  useEffect(() => {
    const preferredMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (preferredMotion.matches) {
      document.documentElement.classList.add('motion-off');
    }
  }, []);

  // Handle login flow when wallet connects
  useEffect(() => {
    if (isConnected && address && isLoggingIn) {
      handleLogin();
    }
  }, [isConnected, address, isLoggingIn]);

  const handleLogin = async () => {
    console.log('[LOGIN] handleLogin called, address:', address);
    if (!address) return;
    
    // Normalize address to lowercase for case-insensitive comparison
    const normalizedAddress = address.toLowerCase();
    
    try {
      // Check if wallet has a .rep name
      console.log('[LOGIN] Checking wallet for .rep name...');
      const checkRes = await fetch(`/api/rep/lookup-wallet?address=${encodeURIComponent(normalizedAddress)}`, {
        credentials: 'include',
      });
      
      const checkData = await checkRes.json();
      console.log('[LOGIN] Lookup result:', checkData);
      
      if (!checkData.ok || !checkData.walletFound) {
        console.log('[LOGIN] No .rep name found, redirecting to /claim');
        alert(`No .rep name found for this wallet. Please claim one first!`);
        setIsLoggingIn(false);
        window.location.href = '/claim';
        return;
      }

      // Request server-issued challenge nonce
      console.log('[LOGIN] Requesting challenge nonce...');
      const challengeRes = await fetch('/api/auth/challenge', {
        method: 'GET',
        credentials: 'include',
      });
      
      if (!challengeRes.ok) {
        throw new Error('Failed to get authentication challenge');
      }
      
      const { nonce, timestamp } = await challengeRes.json();
      
      if (!nonce) throw new Error('No nonce received from server');

      // Request signature to prove wallet ownership
      console.log('[LOGIN] Requesting signature for:', checkData.name);
      const challengeMessage = `Sign this message to verify your .rep identity.\n\nAddress: ${normalizedAddress}\nNonce: ${nonce}\nTimestamp: ${timestamp}`;
      const signature = await signMessageAsync({ message: challengeMessage });
      console.log('[LOGIN] Signature received');

      // Verify signature and create session
      console.log('[LOGIN] Calling /api/auth/verify');
      const authRes = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          address: normalizedAddress,
          message: challengeMessage,
          signature,
          nonce,
          method: 'EOA'
        }),
        credentials: 'include',
      });

      if (!authRes.ok) {
        const errorData = await authRes.json();
        throw new Error(errorData.error || 'Failed to verify wallet ownership');
      }
      
      console.log('[LOGIN] Auth successful! Redirecting to /wallet');
      
      // Hard redirect to /wallet with name and reservation ID
      if (checkData.reservationId) {
        localStorage.setItem('rep:lastName', checkData.name);
        localStorage.setItem('rep:reservationId', checkData.reservationId);
        localStorage.setItem('rep:address', normalizedAddress);
        window.location.assign(`/wallet?name=${encodeURIComponent(checkData.name)}&rid=${encodeURIComponent(checkData.reservationId)}`);
      } else {
        // Fallback to dashboard if no reservation ID
        window.location.href = '/rep-dashboard';
      }
    } catch (error: any) {
      console.error('[LOGIN] Login error:', error);
      alert('Login failed. Please try again.');
      setIsLoggingIn(false);
    }
  };

  const handleLoginClick = () => {
    setIsLoggingIn(true);
    setShowWalletModal(true);
  };

  return (
    <>
      <div className="homepage">
        <section className="hero-section">
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

          <div className="hero-container">
            <div className="hero-grid">
              <div className="emblem-column">
                <div className="rep-emblem" aria-label=".rep emblem">
                  <svg className="rep-ring" viewBox="0 0 400 400" aria-hidden="true">
                    <defs>
                      <radialGradient id="innerVignette" cx="50%" cy="50%">
                        <stop offset="0%" stopColor="rgba(10, 14, 20, 0)" />
                        <stop offset="60%" stopColor="rgba(10, 14, 20, 0.3)" />
                        <stop offset="100%" stopColor="rgba(10, 14, 20, 0.7)" />
                      </radialGradient>
                      <linearGradient id="ringGradient" x1="0%" y1="50%" x2="100%" y2="50%">
                        <stop offset="0%" stopColor="#ff6b00" />
                        <stop offset="30%" stopColor="#ffa500" />
                        <stop offset="70%" stopColor="#00b4ff" />
                        <stop offset="100%" stopColor="#0080ff" />
                      </linearGradient>
                      <filter id="ringGlow">
                        <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                    </defs>
                    
                    <circle cx="200" cy="200" r="180" fill="url(#innerVignette)" />
                    
                    <circle 
                      cx="200" 
                      cy="200" 
                      r="160" 
                      fill="none" 
                      stroke="url(#ringGradient)" 
                      strokeWidth="7"
                      opacity="0.85"
                      className="ring-base"
                    />
                    
                    <circle 
                      cx="200" 
                      cy="200" 
                      r="160" 
                      fill="none" 
                      stroke="url(#ringGradient)" 
                      strokeWidth="7"
                      filter="url(#ringGlow)"
                      strokeDasharray="80 920"
                      strokeLinecap="round"
                      className="ring-pulse"
                    />
                    
                    <circle cx="200" cy="200" r="120" fill="rgba(0, 0, 0, 0.2)" />
                  </svg>
                  <div className="rep-text">.rep</div>
                </div>

                <div className="identity-section">
                  <h2 className="identity-headline">
                    Identity isn't minted.<br />
                    <span className="earned">It's earned.</span>
                  </h2>
                  
                  <div className="people-chips">
                    <div className="chip">Olivia</div>
                    <div className="chip">Danibl</div>
                    <div className="chip">Ryan</div>
                    <div className="chip">Daniel</div>
                  </div>
                </div>
              </div>

              <div className="content-column">
                <h1 className="hero-headline">
                  Your onchain<br />
                  reputation.<br />
                  <span className="alive">Alive on Base.</span>
                </h1>
                
                <div className="hero-ctas">
                  <button 
                    type="button"
                    onClick={() => setLocation('/claim')} 
                    className="cta-button cta-primary"
                  >
                    Reserve your.rep
                  </button>
                  <button 
                    type="button"
                    onClick={handleLoginClick} 
                    className="cta-button cta-secondary"
                    disabled={isLoggingIn}
                  >
                    {isLoggingIn ? 'Connecting...' : 'Login with Wallet'}
                  </button>
                  <button 
                    type="button"
                    onClick={() => setLocation('/discover')} 
                    className="cta-button cta-secondary"
                  >
                    Discover.rep
                  </button>
                </div>
              </div>
            </div>

            <div className="chameleon-panel">
              <div className="chameleon-glow" aria-hidden="true"></div>
              <img 
                src="/chameleon_transparent.png" 
                alt="Chameleon mascot" 
                className="chameleon-img"
              />
            </div>
          </div>
        </section>
      </div>
      
      <WalletPickerModal 
        isOpen={showWalletModal} 
        onClose={() => {
          setShowWalletModal(false);
          setIsLoggingIn(false);
        }}
      />
    </>
  );
}
