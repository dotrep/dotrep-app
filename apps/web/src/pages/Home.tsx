import React, { useState, useEffect, useMemo } from "react";
import "./home.css";

const generateStars = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    left: Math.random() * 100,
    top: Math.random() * 100,
    delay: Math.random() * 3,
  }));
};

export default function Home() {
  const [motionEnabled, setMotionEnabled] = useState(true);
  const [contentLeft, setContentLeft] = useState(0);
  const heroStars = useMemo(() => generateStars(25), []);
  const credStars = useMemo(() => generateStars(20), []);

  useEffect(() => {
    const preferredMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (preferredMotion.matches) {
      setMotionEnabled(false);
      document.documentElement.classList.add('motion-off');
    } else {
      document.documentElement.classList.add('motion-on');
    }
  }, []);

  const toggleMotion = () => {
    setMotionEnabled(!motionEnabled);
    if (motionEnabled) {
      document.documentElement.classList.remove('motion-on');
      document.documentElement.classList.add('motion-off');
    } else {
      document.documentElement.classList.remove('motion-off');
      document.documentElement.classList.add('motion-on');
    }
  };

  return (
    <>
      <button 
        className="motion-toggle" 
        onClick={toggleMotion}
        aria-label={motionEnabled ? 'Disable animations' : 'Enable animations'}
      >
        {motionEnabled ? '● Motion' : '○ Motion'}
      </button>

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

          <div className="hero-grid container-full">
            <div className="hero-left">
              <div className="rep-emblem" aria-label=".rep emblem">
                <svg className="rep-ring" viewBox="0 0 400 400" aria-hidden="true">
                  <defs>
                    <radialGradient id="innerVignette" cx="50%" cy="50%">
                      <stop offset="0%" stopColor="rgba(10, 14, 20, 0)" />
                      <stop offset="60%" stopColor="rgba(10, 14, 20, 0.3)" />
                      <stop offset="100%" stopColor="rgba(10, 14, 20, 0.7)" />
                    </radialGradient>
                    <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ff6b35" />
                      <stop offset="50%" stopColor="#0052ff" />
                      <stop offset="100%" stopColor="#00d4aa" />
                    </linearGradient>
                    <filter id="ringGlow">
                      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
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
                    strokeWidth="8"
                    filter="url(#ringGlow)"
                    className="ring-path"
                  />
                  
                  <circle cx="200" cy="200" r="120" fill="rgba(0, 0, 0, 0.2)" />
                </svg>
                <div className="rep-text">.rep</div>
              </div>
            </div>

            <div className="hero-right" style={{ left: `${contentLeft}px` }}>
              <div className="hero-content">
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
              
              <div className="content-controls">
                <div className="control-row">
                  <span>Left: {contentLeft}px</span>
                  <input type="range" min="-200" max="400" value={contentLeft} onChange={(e) => setContentLeft(Number(e.target.value))} />
                </div>
                <button onClick={() => console.log(`Final: left=${contentLeft}`)}>Save</button>
              </div>
            </div>

            <div className="chameleon-panel">
              <div className="chameleon-glow" aria-hidden="true"></div>
              <img 
                src="/chameleon_transparent.png" 
                alt="Chameleon mascot representing adaptive onchain identity" 
                className="chameleon-img"
              />
            </div>
          </div>

          <div className="hero-bottom container">
            <h2 className="cred-headline">
              Identity isn't minted.<br />
              <span className="earned">It's earned.</span>
            </h2>
            
            <div className="people-chips">
              <div className="person-chip">
                <div className="chip-avatar"></div>
                <span className="chip-name">Olivia</span>
              </div>
              <div className="person-chip">
                <div className="chip-avatar"></div>
                <span className="chip-name">Danibl</span>
              </div>
              <div className="person-chip">
                <div className="chip-avatar"></div>
                <span className="chip-name">Ryan</span>
              </div>
              <div className="person-chip">
                <div className="chip-avatar"></div>
                <span className="chip-name">Daniel</span>
              </div>
            </div>
            
            <p className="cred-subtitle">
              Composed <span className="on-base">on Base</span>, verified by.rep
            </p>
            
            <p className="cred-description">
              <span className="bullet">●</span> Built on Base. Defined by you.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
