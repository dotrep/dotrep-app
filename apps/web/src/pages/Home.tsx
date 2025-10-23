import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'wouter';
import { useAccount, useConnect, useSignMessage } from 'wagmi';
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
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [hasRepName, setHasRepName] = useState(false);
  const [isCheckingWallet, setIsCheckingWallet] = useState(false);
  const { address, isConnected } = useAccount();
  const { connectAsync, connectors } = useConnect();
  const { signMessageAsync } = useSignMessage();

  useEffect(() => {
    const preferredMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (preferredMotion.matches) {
      document.documentElement.classList.add('motion-off');
    }
  }, []);

  // Check if wallet has a .rep name when connected
  useEffect(() => {
    if (isConnected && address) {
      checkWalletStatus();
    } else {
      setHasRepName(false);
    }
  }, [isConnected, address]);

  // Handle login flow when wallet connects
  useEffect(() => {
    if (isConnected && address && isLoggingIn) {
      handleLogin();
    }
  }, [isConnected, address, isLoggingIn]);

  const checkWalletStatus = async () => {
    if (!address) return;
    
    setIsCheckingWallet(true);
    try {
      const res = await fetch(`/api/rep/lookup-wallet?address=${encodeURIComponent(address.toLowerCase())}`, {
        credentials: 'include',
      });
      const data = await res.json();
      console.log('[HOME] Wallet status check:', data);
      setHasRepName(data.ok && data.walletFound);
    } catch (error) {
      console.error('[HOME] Error checking wallet status:', error);
      setHasRepName(false);
    } finally {
      setIsCheckingWallet(false);
    }
  };

  const handleLogin = async () => {
    console.log('[LOGIN] handleLogin called, address:', address);
    if (!address) return;
    
    // Normalize address to lowercase for case-insensitive comparison
    const normalizedAddress = address.toLowerCase();
    
    try {
      // Step 1: Check if we already have a valid session
      console.log('[LOGIN] Step 1: Checking for existing session...');
      const sessionRes = await fetch('/api/auth/me', {
        credentials: 'include',
      });
      
      if (sessionRes.ok) {
        const sessionData = await sessionRes.json();
        console.log('[LOGIN] Existing session found:', sessionData);
        
        // Verify session address matches connected wallet
        if (sessionData.address && sessionData.address.toLowerCase() === normalizedAddress) {
          console.log('[LOGIN] Session valid! Looking up .rep name...');
          
          // Get .rep name info
          const checkRes = await fetch(`/api/rep/lookup-wallet?address=${encodeURIComponent(normalizedAddress)}`, {
            credentials: 'include',
          });
          
          const checkData = await checkRes.json();
          
          if (checkData.ok && checkData.walletFound && checkData.reservationId) {
            console.log('[LOGIN] Redirecting to dashboard with existing session');
            localStorage.setItem('rep:lastName', checkData.name);
            localStorage.setItem('rep:reservationId', checkData.reservationId);
            localStorage.setItem('rep:address', normalizedAddress);
            setLocation('/rep-dashboard');
            return;
          }
        } else {
          console.log('[LOGIN] Session address mismatch, need to re-authenticate');
        }
      } else {
        console.log('[LOGIN] No existing session found');
      }
      
      // Step 2: Check if wallet has a .rep name
      console.log('[LOGIN] Step 2: Checking wallet for .rep name...');
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

      // Step 3: Request server-issued challenge nonce
      console.log('[LOGIN] Step 3: Requesting challenge nonce...');
      const challengeRes = await fetch('/api/auth/challenge', {
        method: 'GET',
        credentials: 'include',
      });
      
      if (!challengeRes.ok) {
        throw new Error('Failed to get authentication challenge');
      }
      
      const { nonce, timestamp } = await challengeRes.json();
      
      if (!nonce) throw new Error('No nonce received from server');

      // Step 4: Request signature to prove wallet ownership
      console.log('[LOGIN] Step 4: Requesting signature for:', checkData.name);
      const challengeMessage = `Sign this message to verify your .rep identity.\n\nAddress: ${normalizedAddress}\nNonce: ${nonce}\nTimestamp: ${timestamp}`;
      const signature = await signMessageAsync({ message: challengeMessage });
      console.log('[LOGIN] Signature received');

      // Step 5: Verify signature and create session
      console.log('[LOGIN] Step 5: Calling /api/auth/verify');
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
      
      console.log('[LOGIN] Auth successful! Redirecting to dashboard');
      
      // Step 6: Redirect to dashboard
      if (checkData.reservationId) {
        localStorage.setItem('rep:lastName', checkData.name);
        localStorage.setItem('rep:reservationId', checkData.reservationId);
        localStorage.setItem('rep:address', normalizedAddress);
      }
      setLocation('/rep-dashboard');
    } catch (error: any) {
      console.error('[LOGIN] Login error:', error);
      alert('Login failed. Please try again.');
      setIsLoggingIn(false);
    }
  };

  const handleConnectWallet = async () => {
    setIsConnecting(true);
    
    try {
      const connector = connectors.find(c => c.name === 'Coinbase Wallet') || connectors[0];
      if (!connector) throw new Error('No wallet connector available');
      
      await connectAsync({ connector });
      setIsLoggingIn(true); // Trigger login flow after connection
    } catch (err: any) {
      console.error('[CONNECT] Error:', err);
      alert(err.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleLoginClick = () => {
    if (!isConnected) {
      handleConnectWallet();
    } else {
      handleLogin();
    }
  };
  
  const formatAddress = (addr: string) => {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
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
                
                {/* Wallet Status */}
                {isConnected && address && (
                  <div className="wallet-status-home">
                    <span className="wallet-indicator">🟢</span>
                    <span className="wallet-address-home">{formatAddress(address)}</span>
                    <span className="wallet-network-home">Base</span>
                  </div>
                )}
                
                <div className="hero-ctas">
                  <button 
                    type="button"
                    onClick={() => setLocation('/claim')} 
                    className="cta-button cta-primary"
                    disabled={isCheckingWallet || hasRepName}
                    style={{ opacity: (isCheckingWallet || hasRepName) ? 0.5 : 1, cursor: (isCheckingWallet || hasRepName) ? 'not-allowed' : 'pointer' }}
                  >
                    {isCheckingWallet ? 'Checking...' : hasRepName ? 'Already claimed ✓' : 'Reserve your.rep'}
                  </button>
                  <button 
                    type="button"
                    onClick={handleLoginClick} 
                    className="cta-button cta-secondary"
                    disabled={isLoggingIn || isConnecting || isCheckingWallet || (!hasRepName && isConnected)}
                    style={{ opacity: (isLoggingIn || isConnecting || isCheckingWallet || (!hasRepName && isConnected)) ? 0.5 : 1, cursor: (isLoggingIn || isConnecting || isCheckingWallet || (!hasRepName && isConnected)) ? 'not-allowed' : 'pointer' }}
                  >
                    {isConnecting ? 'Connecting...' : isLoggingIn ? 'Logging in...' : isCheckingWallet ? 'Checking...' : isConnected ? (hasRepName ? 'Login to Dashboard' : 'Claim .rep first') : '🦊 Connect Wallet'}
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
    </>
  );
}
