import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'wouter';
import { startLogin } from '../loginFlow';
import { canonicalizeName, isValidName } from '../../lib/repValidation';
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
  const [, setLocation] = useLocation();
  const [name, setName] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState('');
  const [isClaiming, setIsClaiming] = useState(false);

  useEffect(() => {
    const preferredMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (preferredMotion.matches) {
      document.documentElement.classList.add('motion-off');
    }
  }, []);

  // Real-time availability checking
  useEffect(() => {
    if (!name) {
      setIsAvailable(null);
      setError('');
      return;
    }

    const canonicalName = canonicalizeName(name);
    
    if (!isValidName(canonicalName)) {
      setIsAvailable(null);
      if (canonicalName.length < 2) {
        setError('Must be at least 2 characters');
      } else if (canonicalName.length > 31) {
        setError('Must be 31 characters or less');
      } else {
        setError('Only lowercase letters, numbers, and hyphens');
      }
      return;
    }

    setError('');
    setIsChecking(true);

    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/rep/check?name=${encodeURIComponent(canonicalName)}`, {
          credentials: 'include',
        });
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
    }, 500);

    return () => clearTimeout(timer);
  }, [name]);

  const handleClaim = async () => {
    const canonicalName = canonicalizeName(name);
    
    if (!canonicalName || !isValidName(canonicalName)) {
      setError('Invalid name format');
      return;
    }

    if (isAvailable !== true) {
      setError('Name is not available');
      return;
    }

    setIsClaiming(true);
    setError('');

    try {
      await startLogin(canonicalName);
    } catch (err: any) {
      console.error('[CLAIM] Error:', err);
      setError(err.message || 'Failed to claim name. Please try again.');
      setIsClaiming(false);
    }
  };

  const getStatusMessage = () => {
    if (!name) return null;
    if (isChecking) return <span className="status-checking">Checking...</span>;
    if (error) return <span className="status-error">✗ {error}</span>;
    if (isAvailable === true) return <span className="status-available">✓ {name}.rep is available</span>;
    return null;
  };

  const canClaim = name && isValidName(canonicalizeName(name)) && isAvailable === true && !isClaiming;

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
        <button 
          type="button"
          onClick={() => setLocation('/')} 
          className="back-button"
          aria-label="Go back home"
        >
          ← Back
        </button>

        <div className="claim-content">
          <h1 className="claim-title">
            Claim your<br />
            <span className="highlight">.rep name</span>
          </h1>
          
          <p className="claim-subtitle">
            Your onchain identity on Base blockchain
          </p>

          <div className="claim-form">
            <div className="input-wrapper">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value.toLowerCase())}
                placeholder="yourname"
                className="name-input"
                disabled={isClaiming}
                autoFocus
              />
              <span className="input-suffix">.rep</span>
            </div>

            {getStatusMessage()}

            <button
              type="button"
              onClick={handleClaim}
              disabled={!canClaim}
              className={`claim-button ${canClaim ? 'claim-button-active' : 'claim-button-disabled'}`}
            >
              {isClaiming ? 'Claiming...' : canClaim ? 'Claim Name' : 'Check Availability'}
            </button>
          </div>

          <div className="claim-features">
            <div className="feature">
              <span className="feature-icon">🔐</span>
              <span>Soulbound identity</span>
            </div>
            <div className="feature">
              <span className="feature-icon">⛓️</span>
              <span>Base blockchain</span>
            </div>
            <div className="feature">
              <span className="feature-icon">✨</span>
              <span>Build reputation</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
