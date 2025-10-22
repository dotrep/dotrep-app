import { useMemo, useEffect } from 'react';
import './wallet.css';

const generateParticles = (count: number) => Array.from({ length: count }, (_, i) => ({
  left: Math.random() * 100,
  top: Math.random() * 100,
  size: 3 + Math.random() * 6,
  delay: Math.random() * 5,
  duration: 8 + Math.random() * 12,
  color: i % 3 === 0 ? 'rgba(0, 212, 170, 0.4)' : i % 3 === 1 ? 'rgba(0, 82, 255, 0.35)' : 'rgba(255, 107, 53, 0.3)',
}));

export default function Wallet() {
  const particles = useMemo(() => generateParticles(30), []);

  useEffect(() => {
    const preferredMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (preferredMotion.matches) {
      document.documentElement.classList.add('motion-off');
    }
  }, []);

  return (
    <div className="wallet-page">
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

      <div className="wallet-container">
        <div className="success-icon">
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
            <circle cx="40" cy="40" r="38" stroke="#00d4aa" strokeWidth="4" />
            <path d="M25 40L35 50L55 30" stroke="#00d4aa" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        
        <h1 className="wallet-title">Your .rep is claimed!</h1>
        <p className="wallet-message">
          You've successfully claimed your onchain identity on Base.
        </p>
        
        <div className="wallet-actions">
          <a href="/" className="wallet-button wallet-button-primary">
            Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}
