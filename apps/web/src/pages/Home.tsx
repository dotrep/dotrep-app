import { useEffect, useMemo } from 'react';
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

  useEffect(() => {
    const preferredMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (preferredMotion.matches) {
      document.documentElement.classList.add('motion-off');
    }
  }, []);

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
                  <a href="/claim" className="cta-button cta-primary">
                    Reserve your.rep
                  </a>
                  <a href="/discover" className="cta-button cta-secondary">
                    Discover.rep
                  </a>
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
