import React from 'react';

interface XPProgressBarProps {
  currentXP: number;
  nextLevelXP: number;
  level: number;
}

/**
 * XP LOGIC MODULE
 * Progress bar component for XP tracking
 */
const XPProgressBar: React.FC<XPProgressBarProps> = ({ currentXP, nextLevelXP, level }) => {
  const progressPercentage = Math.min((currentXP / nextLevelXP) * 100, 100);
  
  return (
    <div className="xp-progress-container">
      <div className="xp-info">
        <span className="xp-label">XP: {currentXP} / {nextLevelXP}</span>
        <span className="xp-level">Level {level}</span>
      </div>
      
      <div className="xp-progress-bar">
        <div 
          className="xp-progress-fill"
          style={{ width: `${progressPercentage}%` }}
        >
          <div className="xp-progress-glow"></div>
        </div>
      </div>
    </div>
  );
};

export default XPProgressBar;