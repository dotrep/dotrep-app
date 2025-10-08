import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const StreakCelebration = ({ show, streakDays, bonusXP, onDismiss }) => {
  const duration = parseInt(import.meta.env.VITE_CELEBRATION_MODAL_DURATION_MS || '2200');

  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onDismiss();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [show, duration, onDismiss]);

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

  // Check if reduced motion is preferred
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Confetti particles
  const confettiParticles = Array.from({ length: prefersReducedMotion ? 0 : 20 }, (_, i) => (
    <motion.div
      key={i}
      style={{
        position: 'absolute',
        width: '8px',
        height: '8px',
        background: ['#00f0ff', '#ffd700', '#ff6b6b', '#4ecdc4', '#45b7d1'][i % 5],
        borderRadius: '50%'
      }}
      initial={{
        x: Math.random() * 400 - 200,
        y: -50,
        opacity: 1,
        scale: 1
      }}
      animate={{
        y: 600,
        x: Math.random() * 400 - 200,
        opacity: 0,
        scale: 0.5,
        rotate: 360
      }}
      transition={{
        duration: 2 + Math.random(),
        ease: "easeOut",
        delay: Math.random() * 0.5
      }}
    />
  ));

  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Backdrop */}
          <motion.div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.6)',
              zIndex: 1002,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onDismiss}
          />

          {/* Celebration Modal */}
          <motion.div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 1003,
              background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.9), rgba(0, 30, 60, 0.8))',
              border: '2px solid rgba(0, 240, 255, 0.5)',
              borderRadius: '20px',
              padding: '40px',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 20px 60px rgba(0, 240, 255, 0.3)',
              textAlign: 'center',
              minWidth: '300px',
              overflow: 'hidden'
            }}
            initial={{ scale: 0.5, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.5, opacity: 0, y: 50 }}
            transition={{ 
              type: "spring",
              stiffness: 300,
              damping: 25
            }}
            role="dialog"
            aria-live="polite"
            tabIndex={0}
          >
            {/* Confetti */}
            {!prefersReducedMotion && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                pointerEvents: 'none',
                overflow: 'hidden'
              }}>
                {confettiParticles}
              </div>
            )}

            {/* Fire emoji animation */}
            <motion.div
              style={{
                fontSize: '48px',
                marginBottom: '20px'
              }}
              animate={prefersReducedMotion ? {} : {
                scale: [1, 1.2, 1],
                rotate: [-5, 5, -5]
              }}
              transition={{
                duration: 0.6,
                repeat: 2,
                ease: "easeInOut"
              }}
            >
              🔥
            </motion.div>

            {/* Title */}
            <motion.h2
              style={{
                fontSize: '28px',
                fontWeight: '700',
                color: '#00f0ff',
                marginBottom: '8px'
              }}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              Streak {streakDays} days
            </motion.h2>

            {/* Subtitle */}
            <motion.p
              style={{
                fontSize: '16px',
                color: 'rgba(255, 255, 255, 0.8)',
                marginBottom: '16px'
              }}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              — keep it going.
            </motion.p>

            {/* Bonus XP if provided */}
            {bonusXP && (
              <motion.div
                style={{
                  padding: '8px 16px',
                  background: 'rgba(255, 215, 0, 0.2)',
                  border: '1px solid rgba(255, 215, 0, 0.4)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: '#ffd700',
                  display: 'inline-block',
                  marginBottom: '20px'
                }}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                +{bonusXP} XP bonus
              </motion.div>
            )}

            {/* Close Button */}
            <motion.button
              style={{
                padding: '10px 20px',
                background: 'rgba(0, 240, 255, 0.2)',
                border: '1px solid rgba(0, 240, 255, 0.4)',
                borderRadius: '8px',
                color: '#00f0ff',
                fontSize: '14px',
                cursor: 'pointer',
                marginTop: '20px'
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onDismiss}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Close
            </motion.button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default StreakCelebration;