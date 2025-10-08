import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const RewardsToast = ({ show, amount, friendlyReason, onClose }) => {
  // Auto-close after 3 seconds
  React.useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fsn-toast"
          style={{
            position: 'fixed',
            top: 'var(--space-8)',
            right: 'var(--space-8)',
            zIndex: 'var(--z-toast)',
            background: 'var(--bg-2)',
            border: '1px solid var(--accent)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-4)',
            color: 'var(--text)',
            fontSize: 'var(--font-size-sm)',
            fontWeight: '500',
            boxShadow: 'var(--shadow-glow)',
            backdropFilter: 'blur(8px)',
            maxWidth: '280px',
            minWidth: '200px'
          }}
          onClick={onClose}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)'
          }}>
            <span style={{ color: 'var(--accent)', fontSize: 'var(--font-size-lg)' }}>
              +{amount} XP
            </span>
            <span style={{ color: 'var(--muted)' }}>•</span>
            <span style={{ color: 'var(--text)' }}>
              {friendlyReason}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default RewardsToast;