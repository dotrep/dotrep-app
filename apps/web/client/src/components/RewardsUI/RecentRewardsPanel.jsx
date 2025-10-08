import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

const RecentRewardsPanel = ({ show, onClose }) => {
  // Check if rewards UI is enabled
  const isEnabled = import.meta.env.VITE_REWARDS_UI_ENABLED === 'true';
  
  // Fetch recent rewards
  const { data: rewards = [], isLoading } = useQuery({
    queryKey: ['/api/rewards/recent'],
    queryFn: async () => {
      const response = await fetch('/api/rewards/recent?limit=5');
      if (!response.ok) {
        throw new Error('Failed to fetch rewards');
      }
      return response.json();
    },
    enabled: show && isEnabled,
    refetchInterval: 30000, // Poll every 30 seconds when open
  });

  if (!isEnabled || !show) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="fsn-card"
      style={{
        position: 'fixed',
        top: '120px', // Below nav bar
        right: 'var(--space-4)',
        width: '320px',
        maxHeight: '400px',
        zIndex: 'var(--z-modal)',
        background: 'var(--bg)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--space-4)',
        boxShadow: 'var(--shadow-lg)',
        overflowY: 'auto'
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 'var(--space-4)',
        paddingBottom: 'var(--space-2)',
        borderBottom: '1px solid var(--border)'
      }}>
        <h3 className="fsn-h3" style={{ margin: 0 }}>
          Recent Rewards
        </h3>
        <button
          onClick={onClose}
          className="btn-ghost"
          style={{
            padding: 'var(--space-1)',
            minHeight: 'auto',
            fontSize: 'var(--font-size-lg)'
          }}
        >
          ×
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="fsn-body text-muted" style={{ textAlign: 'center', padding: 'var(--space-4)' }}>
          Loading rewards...
        </div>
      ) : rewards.length === 0 ? (
        <div className="fsn-body text-muted" style={{ textAlign: 'center', padding: 'var(--space-4)' }}>
          No recent rewards
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {rewards.map((reward) => (
            <div
              key={reward.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 'var(--space-3)',
                background: 'var(--bg-2)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)'
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  marginBottom: 'var(--space-1)'
                }}>
                  <span className="fsn-body" style={{ color: 'var(--accent)', fontWeight: '600' }}>
                    +{reward.amount} XP
                  </span>
                </div>
                <div className="fsn-caption text-muted">
                  {reward.friendlyReason}
                </div>
              </div>
              <div className="fsn-caption text-muted">
                {formatDistanceToNow(new Date(reward.createdAt), { addSuffix: true })}
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default RecentRewardsPanel;