import { useState, useEffect, useMemo } from 'react';
import { useClaimButton } from '../hooks/useClaimButton';
import './claim.css';

const generateParticles = (count: number) => Array.from({ length: count }, (_, i) => ({
  left: Math.random() * 100,
  top: Math.random() * 100,
  size: 3 + Math.random() * 6,
  delay: Math.random() * 5,
  duration: 8 + Math.random() * 12,
  color: i % 3 === 0 ? 'rgba(0, 212, 170, 0.4)' : i % 3 === 1 ? 'rgba(0, 82, 255, 0.35)' : 'rgba(255, 107, 53, 0.3)',
}));

export default function Claim() {
  const particles = useMemo(() => generateParticles(30), []);
  const [showInput, setShowInput] = useState(false);
  const [name, setName] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState('');

  const nameRegex = /^[a-z][a-z0-9-]{2,31}$/;
  const isValid = nameRegex.test(name);

  const claimButton = useClaimButton({
    name,
    isValid,
    isChecking,
    isAvailable,
    showInput,
    onShowInput: () => setShowInput(true),
  });

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
        const response = await fetch(`http://127.0.0.1:3001/rep/check?name=${name}`);
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

          <button 
            className="connect-button"
            disabled={claimButton.disabled}
            onClick={claimButton.onClick}
          >
            {claimButton.text}
          </button>
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
