import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const XPToast = ({ show, amount, actionName, onDismiss }) => {
  const duration = parseInt(import.meta.env.VITE_XP_TOAST_DURATION_MS || '1800');
  
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

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          style={{
            position: 'fixed',
            top: '80px',
            right: '20px',
            zIndex: 1000,
            background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.15), rgba(0, 180, 255, 0.1))',
            border: '1px solid rgba(0, 240, 255, 0.4)',
            borderRadius: '8px',
            padding: '12px 16px',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 4px 20px rgba(0, 240, 255, 0.2)',
            minWidth: '180px',
            cursor: 'pointer'
          }}
          initial={{ x: 300, opacity: 0, scale: 0.8 }}
          animate={{ x: 0, opacity: 1, scale: 1 }}
          exit={{ x: 300, opacity: 0, scale: 0.8 }}
          transition={{ 
            type: "spring",
            stiffness: 300,
            damping: 30
          }}
          onClick={onDismiss}
          role="alert"
          aria-live="polite"
          tabIndex={0}
        >
          {/* Main XP Text */}
          <div style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#00f0ff',
            marginBottom: '4px'
          }}>
            +{amount} XP
          </div>
          
          {/* Action Name */}
          {actionName && (
            <div style={{
              fontSize: '12px',
              color: 'rgba(255, 255, 255, 0.7)',
              textTransform: 'capitalize'
            }}>
              {actionName}
            </div>
          )}

          {/* Progress indicator */}
          <motion.div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              height: '2px',
              background: 'rgba(0, 240, 255, 0.6)',
              borderRadius: '0 0 8px 8px'
            }}
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{ duration: duration / 1000, ease: "linear" }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default XPToast;