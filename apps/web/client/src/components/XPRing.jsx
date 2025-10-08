import React, { useEffect, useState } from 'react';
import { useXP } from '../context/XPContext';
import './XPRing.css';

const XPRing = () => {
  const { currentLevel, levelProgress, levelUpAnimation, xp, nextLevelXP } = useXP();
  const [ringAnimation, setRingAnimation] = useState(false);

  // Trigger ring animation on XP gain
  useEffect(() => {
    setRingAnimation(true);
    const timer = setTimeout(() => setRingAnimation(false), 500);
    return () => clearTimeout(timer);
  }, [xp]);

  const circumference = 2 * Math.PI * 45; // radius of 45
  const strokeOffset = circumference - (levelProgress.percentage / 100) * circumference;

  return (
    <div className={`xp-ring-container ${levelUpAnimation ? 'level-up' : ''}`}>
      {/* Level Up Animation Overlay */}
      {levelUpAnimation && (
        <div className="level-up-overlay">
          <div className="level-up-text">LEVEL UP!</div>
          <div className="level-up-sparkles">
            <span>✨</span>
            <span>🎉</span>
            <span>✨</span>
          </div>
        </div>
      )}
      
      {/* Main XP Ring */}
      <div className={`xp-ring ${ringAnimation ? 'ring-pulse' : ''}`}>
        <svg width="100" height="100" className="progress-ring">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="rgba(0, 240, 255, 0.2)"
            strokeWidth="4"
            fill="transparent"
            className="progress-ring-background"
          />
          
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="#00f0ff"
            strokeWidth="4"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeOffset}
            strokeLinecap="round"
            className="progress-ring-progress"
            transform="rotate(-90 50 50)"
          />
          
          {/* Outer glow ring */}
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="rgba(0, 240, 255, 0.4)"
            strokeWidth="2"
            fill="transparent"
            className="progress-ring-glow"
          />
        </svg>
        
        {/* Center content */}
        <div className="xp-ring-center">
          <div className="xp-ring-label">LEVEL</div>
          <div className="xp-ring-value">{currentLevel}</div>
        </div>
      </div>
      
      {/* XP Progress Info */}
      <div className="xp-progress-info">
        <div className="xp-current">{levelProgress.progress} XP</div>
        <div className="xp-separator">/</div>
        <div className="xp-next">{levelProgress.total} XP</div>
      </div>
      
      <div className="next-level-info">
        Next: Level {currentLevel + 1}
      </div>
    </div>
  );
};

export default XPRing;