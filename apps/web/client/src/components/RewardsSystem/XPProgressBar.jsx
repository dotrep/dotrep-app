import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const XPProgressBar = ({ currentXP = 0, onLevelUp }) => {
  const [previousXP, setPreviousXP] = useState(currentXP);
  const [isAnimating, setIsAnimating] = useState(false);

  // Get feature flags and level config - enable by default for testing
  const featureEnabled = import.meta.env.VITE_FEATURE_REWARDS_FEEDBACK !== 'off';
  const xpLevelsJson = import.meta.env.VITE_XP_LEVELS_JSON || '[0,100,250,500,1000,2000,5000,10000]';
  
  console.log('XPProgressBar feature check:', { featureEnabled, currentXP });
  
  if (!featureEnabled) return null;

  const xpLevels = JSON.parse(xpLevelsJson);
  
  // Calculate current level and progress
  const getCurrentLevel = (xp) => {
    for (let i = xpLevels.length - 1; i >= 0; i--) {
      if (xp >= xpLevels[i]) return i;
    }
    return 0;
  };

  const currentLevel = getCurrentLevel(currentXP);
  const nextLevel = currentLevel + 1;
  const currentLevelXP = xpLevels[currentLevel] || 0;
  const nextLevelXP = xpLevels[nextLevel] || xpLevels[xpLevels.length - 1];
  
  const progressInLevel = currentXP - currentLevelXP;
  const xpNeededForNext = nextLevelXP - currentLevelXP;
  const progressPercent = Math.min((progressInLevel / xpNeededForNext) * 100, 100);

  // Animate XP changes
  useEffect(() => {
    if (currentXP !== previousXP && previousXP > 0) {
      setIsAnimating(true);
      
      // Check for level up
      const prevLevel = getCurrentLevel(previousXP);
      const newLevel = getCurrentLevel(currentXP);
      
      if (newLevel > prevLevel && onLevelUp) {
        setTimeout(() => {
          onLevelUp(newLevel, currentXP);
        }, 300);
      }
      
      setTimeout(() => {
        setIsAnimating(false);
        setPreviousXP(currentXP);
      }, 800);
    } else if (previousXP === 0) {
      setPreviousXP(currentXP);
    }
  }, [currentXP, previousXP, onLevelUp]);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '8px 16px',
      background: 'rgba(0, 0, 0, 0.3)',
      border: '1px solid rgba(0, 240, 255, 0.3)',
      borderRadius: '8px',
      backdropFilter: 'blur(8px)',
      minWidth: '200px'
    }}>
      {/* Level Badge */}
      <div style={{
        padding: '4px 8px',
        background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.2), rgba(0, 180, 255, 0.1))',
        border: '1px solid rgba(0, 240, 255, 0.4)',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: '600',
        color: '#00f0ff',
        minWidth: '40px',
        textAlign: 'center'
      }}>
        L{currentLevel}
      </div>

      {/* Progress Bar Container */}
      <div style={{
        flex: 1,
        height: '8px',
        background: 'rgba(0, 0, 0, 0.4)',
        borderRadius: '4px',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {/* Progress Fill */}
        <motion.div
          style={{
            height: '100%',
            background: isAnimating 
              ? 'linear-gradient(90deg, #00f0ff, #00b4ff, #00f0ff)'
              : 'linear-gradient(90deg, rgba(0, 240, 255, 0.8), rgba(0, 180, 255, 0.6))',
            borderRadius: '4px',
            boxShadow: isAnimating ? '0 0 8px rgba(0, 240, 255, 0.6)' : 'none'
          }}
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ 
            duration: isAnimating ? 0.8 : 0.3,
            ease: "easeOut"
          }}
        />
        
        {/* Glow effect during animation */}
        {isAnimating && (
          <motion.div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(90deg, transparent, rgba(0, 240, 255, 0.4), transparent)',
              borderRadius: '4px'
            }}
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{
              duration: 0.8,
              ease: "easeInOut"
            }}
          />
        )}
      </div>

      {/* XP Text */}
      <div style={{
        fontSize: '11px',
        color: 'rgba(255, 255, 255, 0.8)',
        minWidth: '60px',
        textAlign: 'right'
      }}>
        {currentXP.toLocaleString()} XP
      </div>
    </div>
  );
};

export default XPProgressBar;