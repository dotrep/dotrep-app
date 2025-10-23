import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'wouter';
import { useAccount } from 'wagmi';
import './rep-dashboard.css';

const generateParticles = (count: number) => Array.from({ length: count }, (_, i) => ({
  left: Math.random() * 100,
  top: Math.random() * 100,
  size: 3 + Math.random() * 6,
  delay: Math.random() * 5,
  duration: 8 + Math.random() * 12,
  color: i % 3 === 0 ? 'rgba(0, 212, 170, 0.4)' : i % 3 === 1 ? 'rgba(0, 82, 255, 0.35)' : 'rgba(255, 107, 53, 0.3)',
}));

export default function RepDashboard() {
  const particles = useMemo(() => generateParticles(30), []);
  const [, setLocation] = useLocation();
  const { address, isConnected } = useAccount();
  const [repName, setRepName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    const preferredMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (preferredMotion.matches) {
      document.documentElement.classList.add('motion-off');
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [address, isConnected]);

  const checkAuth = async () => {
    setIsLoading(true);
    try {
      const sessionRes = await fetch('/api/auth/me', {
        credentials: 'include',
      });

      if (!sessionRes.ok) {
        console.log('[DASHBOARD] No session found, redirecting to claim');
        setLocation('/claim');
        return;
      }

      const sessionData = await sessionRes.json();
      setSession(sessionData);
      console.log('[DASHBOARD] Session found:', sessionData);

      const walletAddress = address?.toLowerCase() || sessionData.address?.toLowerCase();
      
      if (!walletAddress) {
        console.log('[DASHBOARD] No wallet address, redirecting to claim');
        setLocation('/claim');
        return;
      }

      const lookupRes = await fetch(`/api/rep/lookup-wallet?address=${encodeURIComponent(walletAddress)}`, {
        credentials: 'include',
      });

      const lookupData = await lookupRes.json();
      console.log('[DASHBOARD] Lookup result:', lookupData);

      if (!lookupData.ok || !lookupData.walletFound) {
        console.log('[DASHBOARD] No .rep found, redirecting to claim');
        setLocation('/claim');
        return;
      }

      setRepName(lookupData.name);
    } catch (error) {
      console.error('[DASHBOARD] Error:', error);
      setLocation('/claim');
    } finally {
      setIsLoading(false);
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  if (isLoading) {
    return (
      <div className="rep-dashboard">
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
        <div className="dashboard-container">
          <div className="loading-spinner">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="rep-dashboard">
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

      <div className="dashboard-container">
        <header className="dashboard-header">
          <div className="dashboard-logo">
            <span className="logo-dot">.</span>
            <span className="logo-text">rep</span>
          </div>
          {isConnected && address && (
            <div className="wallet-badge">
              <div className="wallet-indicator"></div>
              <span className="wallet-address">{formatAddress(address)}</span>
            </div>
          )}
        </header>

        <main className="dashboard-main">
          <div className="identity-hero">
            <div className="identity-glow"></div>
            <h1 className="identity-name">
              <span className="name-dot">.</span>
              <span className="name-text">{repName}</span>
            </h1>
            <p className="identity-subtitle">Your onchain identity on Base</p>
          </div>

          <div className="dashboard-grid">
            <div className="dashboard-card">
              <div className="card-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <h3 className="card-title">Pulse Score</h3>
              <p className="card-value">55</p>
              <p className="card-label">Base activity score</p>
            </div>

            <div className="dashboard-card">
              <div className="card-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="card-title">Signals</h3>
              <p className="card-value">0</p>
              <p className="card-label">Messages sent</p>
            </div>

            <div className="dashboard-card">
              <div className="card-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="card-title">XP Points</h3>
              <p className="card-value">100</p>
              <p className="card-label">Claimed bonus</p>
            </div>

            <div className="dashboard-card">
              <div className="card-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="card-title">Wallet</h3>
              <p className="card-value">{isConnected && address ? formatAddress(address) : 'Not connected'}</p>
              <p className="card-label">Base Network</p>
            </div>
          </div>

          <div className="dashboard-actions">
            <button 
              className="action-button action-button-primary"
              onClick={() => setLocation('/')}
            >
              Back to Home
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
