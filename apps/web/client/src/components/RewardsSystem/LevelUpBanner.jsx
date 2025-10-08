import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const LevelUpBanner = ({ show, level, hasNewPerk, onDismiss, onOpenPerks }) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onDismiss();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [show, onDismiss]);

  // Handle keyboard dismissal
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'Escape' && show) {
        onDismiss();
      }
    };

    if (show) {
      document.addEventListener('keydown', handleKeyPress);
      return () => document.removeEventListener('keydown', handleKeyPress);
    }
  }, [show, onDismiss]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 1001,
            background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 165, 0, 0.15))',
            border: '1px solid rgba(255, 215, 0, 0.5)',
            borderRadius: '12px',
            padding: '16px 20px',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 8px 32px rgba(255, 215, 0, 0.3)',
            minWidth: '220px'
          }}
          initial={{ y: -100, opacity: 0, scale: 0.8 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -100, opacity: 0, scale: 0.8 }}
          transition={{ 
            type: "spring",
            stiffness: 300,
            damping: 25
          }}
          role="alert"
          aria-live="polite"
          tabIndex={0}
        >
          {/* Sparkle Animation */}
          <div style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            fontSize: '20px'
          }}>
            <motion.span
              animate={{ 
                rotate: [0, 180, 360],
                scale: [1, 1.2, 1]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              ✨
            </motion.span>
          </div>

          {/* Level Up Text */}
          <div style={{
            fontSize: '18px',
            fontWeight: '700',
            color: '#ffd700',
            marginBottom: '4px'
          }}>
            Level {level} reached
          </div>

          {/* New Perk Chip */}
          {hasNewPerk && (
            <motion.div
              style={{
                display: 'inline-block',
                padding: '4px 8px',
                background: 'rgba(0, 240, 255, 0.2)',
                border: '1px solid rgba(0, 240, 255, 0.4)',
                borderRadius: '12px',
                fontSize: '11px',
                color: '#00f0ff',
                cursor: 'pointer',
                marginTop: '8px'
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onOpenPerks}
            >
              New perk available
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LevelUpBanner;