import React, { useEffect, useState } from 'react';
import '../styles/fsn.css';

interface XPBarProps {
  xp?: number;
  maxXp?: number;
  rank?: string;
}

const XPBar: React.FC<XPBarProps> = ({ xp = 0, maxXp = 1000, rank = "Sentinel" }) => {
  const [animatedXp, setAnimatedXp] = useState(0);
  const [prevXp, setPrevXp] = useState(0);

  useEffect(() => {
    if (xp !== prevXp) {
      const duration = 1000; // 1 second animation
      const startTime = Date.now();
      const startXp = animatedXp;
      const targetXp = xp;

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Smooth easing function
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentXp = startXp + (targetXp - startXp) * easeOut;
        
        setAnimatedXp(currentXp);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      
      requestAnimationFrame(animate);
      setPrevXp(xp);
    }
  }, [xp, animatedXp, prevXp]);

  const percentage = Math.min((animatedXp / maxXp) * 100, 100);

  return (
    <div className="xp-bar-container">
      {/* Rank Display */}
      <div className="xp-rank">
        <span className="rank-icon">🛡️</span>
        <span className="rank-text">{rank}</span>
      </div>
      
      {/* Progress Bar */}
      <div className="xp-bar">
        <div 
          className="xp-bar-fill"
          style={{ width: `${percentage}%` }}
        ></div>
        <div className="xp-bar-glow"></div>
      </div>
      
      {/* XP Numbers */}
      <div className="xp-numbers">
        {Math.floor(animatedXp)} / {maxXp} XP
      </div>
    </div>
  );
};

export default XPBar;