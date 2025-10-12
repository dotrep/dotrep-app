import { useState, useEffect, useMemo } from 'react';
import './home.css';

const generateStars = (count: number) => Array.from({ length: count }, () => ({
  left: Math.random() * 100,
  top: Math.random() * 100,
  delay: Math.random() * 3,
}));

export default function Home() {
  const heroStars = useMemo(() => generateStars(25), []);

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
          <div className="constellation-bg" aria-hidden="true">
            {heroStars.map((star, i) => (
              <div 
                key={i} 
                className="star" 
                style={{
                  left: `${star.left}%`,
                  top: `${star.top}%`,
                  animationDelay: `${star.delay}s`
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
                      <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%" gradientTransform="rotate(-45)">
                        <stop offset="0%" stopColor="#ff8c42" />
                        <stop offset="35%" stopColor="#0052ff" />
                        <stop offset="70%" stopColor="#00d4aa" />
                        <stop offset="100%" stopColor="#1e3a8a" />
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
                      strokeWidth="6"
                      opacity="0.6"
                      className="ring-base"
                    />
                    
                    <circle 
                      cx="200" 
                      cy="200" 
                      r="160" 
                      fill="none" 
                      stroke="url(#ringGradient)" 
                      strokeWidth="8"
                      filter="url(#ringGlow)"
                      strokeDasharray="150 850"
                      className="ring-pulse"
                    />
                    
                    <circle cx="200" cy="200" r="120" fill="rgba(0, 0, 0, 0.2)" />
                  </svg>
                  <div className="rep-text">.rep</div>
                </div>
              </div>

              <div className="content-column">
                <h1 className="hero-headline">
                  Your onchain<br />
                  reputation.<br />
                  <span className="alive">Alive on Base.</span>
                </h1>
                
                <div className="hero-ctas">
                  <a href="/reserve" className="cta-button cta-primary">
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
              
              <p className="identity-tagline">Composed on Base, verified by.rep</p>
              <p className="identity-footer">● Built on Base. Defined by you.</p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
