import React from 'react';
import { getCurrentTier, getNextTier, VAULT_TIERS } from '../utils/vaultTiers';
import { safeXPCalc } from '../utils/xpGating';
import { useQuery } from '@tanstack/react-query';
import '../styles/VaultUpgradeModal.css';

const VaultUpgradeModal = ({ isOpen, onClose, uploadType, currentCount, maxCount }) => {
  // Get XP from API instead of context to ensure accuracy
  const { data: userStats } = useQuery({
    queryKey: ['/api/user/stats'],
  });
  
  // Safe XP handling to prevent NaN
  const safeXP = parseInt(userStats?.xpPoints) || 0;
  const currentTier = getCurrentTier(safeXP);
  const nextTier = getNextTier(safeXP);

  if (!isOpen) return null;

  // Debug logging only when modal is open
  console.log('📋 VaultUpgradeModal Props (OPEN):', {
    uploadType,
    currentCount,
    maxCount,
    safeXP,
    currentTier: currentTier.name,
    nextTier: nextTier?.name
  });

  // Safe progress calculation to prevent NaN
  const progressPercentage = nextTier 
    ? Math.min(100, Math.max(0, ((safeXP - currentTier.required_xp) / (nextTier.required_xp - currentTier.required_xp)) * 100))
    : 100;

  return (
    <div className="vault-upgrade-overlay">
      <div className="vault-upgrade-modal">
        <div className="vault-upgrade-header">
          <h2 className="vault-upgrade-title">Vault Storage Limit Reached</h2>
          <button className="vault-upgrade-close" onClick={onClose}>×</button>
        </div>

        <div className="vault-upgrade-content">
          <div className="vault-upgrade-icon">
            {uploadType === 'file' ? '📁' : '💎'}
          </div>
          
          <div className="vault-upgrade-message">
            <p>You've reached your {uploadType} storage limit!</p>
            <div className="vault-upgrade-limit">
              {currentCount > maxCount ? (
                <span style={{ color: '#ffa500' }}>
                  {currentCount} / {maxCount} {uploadType}s (Over Limit)
                </span>
              ) : (
                <span>
                  {currentCount} / {maxCount} {uploadType}s stored
                </span>
              )}
            </div>
          </div>

          <div className="vault-tier-info">
            <div className="current-tier">
              <span className="tier-label">Current Vault Tier</span>
              <div className="tier-badge" style={{ borderColor: currentTier.color }}>
                <span className="tier-number">Tier {currentTier.tier}</span>
                <span className="tier-name">{currentTier.name}</span>
              </div>
            </div>

            {nextTier && (
              <div className="next-tier">
                <span className="tier-label">Next Tier</span>
                <div className="tier-badge" style={{ borderColor: nextTier.color }}>
                  <span className="tier-number">Tier {nextTier.tier}</span>
                  <span className="tier-name">{nextTier.name}</span>
                </div>
                <div className="tier-limits">
                  <div>📁 {nextTier.max_files} Files</div>
                  <div>💎 {nextTier.max_nfts} NFTs</div>
                </div>
              </div>
            )}
          </div>

          {nextTier && (
            <div className="xp-progress-section">
              <div className="xp-progress-label">
                Upgrade Progress
              </div>
              <div className="xp-progress-bar">
                <div 
                  className="xp-progress-fill"
                  style={{ 
                    width: `${Math.min(progressPercentage, 100)}%`,
                    background: `linear-gradient(90deg, ${currentTier.color}, ${nextTier.color})`
                  }}
                />
              </div>
              <div className="xp-progress-text">
                <span className="current-xp">{safeXP} XP</span>
                <span className="required-xp">/ {nextTier.required_xp} XP</span>
              </div>
              <div className="xp-remaining">
                {Math.max(0, nextTier.required_xp - safeXP)} XP needed to upgrade
              </div>
            </div>
          )}

          {!nextTier && (
            <div className="max-tier-reached">
              <div className="max-tier-icon">👑</div>
              <div className="max-tier-text">Maximum Vault Tier Reached!</div>
              <div className="max-tier-desc">You've unlocked the ultimate storage capacity</div>
            </div>
          )}

          <div className="upgrade-actions">
            <button className="earn-xp-btn" onClick={() => {
              onClose();
              window.location.href = '/social'; // Redirect to social page where users can chat with bots for XP
            }}>
              <span className="btn-icon">⚡</span>
              <span className="btn-text">Earn More XP</span>
            </button>
            
            <div className="premium-teaser">
              <button className="premium-btn" disabled>
                <span className="btn-icon">🚀</span>
                <span className="btn-text">Boost with FSN Token</span>
                <span className="coming-soon">(Coming Soon)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VaultUpgradeModal;