import React, { useEffect, useState } from 'react';
import '../styles/fsn.css';

interface PulseRingProps {
  xp?: number;
  showXpGain?: boolean;
  onAnimationComplete?: () => void;
}

const PulseRing: React.FC<PulseRingProps> = ({ 
  xp = 0, 
  showXpGain = false, 
  onAnimationComplete 
}) => {
  const [isGlowing, setIsGlowing] = useState(false);

  useEffect(() => {
    if (showXpGain) {
      setIsGlowing(true);
      const timer = setTimeout(() => {
        setIsGlowing(false);
        if (onAnimationComplete) {
          onAnimationComplete();
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showXpGain, onAnimationComplete]);

  return (
    <div className="pulse-ring-container">
      {/* Radial Grid Background */}
      <div className="radial-grid"></div>
      
      {/* XP Gain Indicator */}
      {showXpGain && (
        <div className="xp-gain-indicator">
          +50 XP
        </div>
      )}
      
      {/* Pulse Ring Structure */}
      <div className={`pulse-ring ${isGlowing ? 'pulse-glow' : ''}`}>
        <div className="pulse-ring-outer"></div>
        <div className="pulse-ring-middle"></div>
        <div className="pulse-ring-inner">
          <div className="fsn-center">
            <span className="fsn-dot">•</span>
            <span className="fsn-text">fsn</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PulseRing;