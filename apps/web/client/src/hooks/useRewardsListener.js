import { useState, useEffect, useCallback } from 'react';

console.log('Rewards system environment check:', {
  VITE_FEATURE_REWARDS_FEEDBACK: import.meta.env.VITE_FEATURE_REWARDS_FEEDBACK,
  NODE_ENV: import.meta.env.NODE_ENV
});

// Event emitter for rewards system
class RewardsEventEmitter {
  constructor() {
    this.events = {};
  }

  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }

  off(event, callback) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(cb => cb !== callback);
  }

  emit(event, data) {
    if (!this.events[event]) return;
    this.events[event].forEach(callback => callback(data));
  }
}

// Global event emitter instance
export const rewardsEmitter = new RewardsEventEmitter();

// Analytics helper (non-PII)
const emitAnalytics = (event, data) => {
  console.log(`[Rewards Analytics] ${event}:`, data);
  // In a real app, this would send to analytics service
};

export const useRewardsListener = () => {
  const [toastQueue, setToastQueue] = useState([]);
  const [showLevelUpBanner, setShowLevelUpBanner] = useState(false);
  const [levelUpData, setLevelUpData] = useState(null);
  const [showStreakCelebration, setShowStreakCelebration] = useState(false);
  const [streakData, setStreakData] = useState(null);
  const [showPerksPanel, setShowPerksPanel] = useState(false);

  // Feature flag check - enable by default for testing
  const featureEnabled = import.meta.env.VITE_FEATURE_REWARDS_FEEDBACK !== 'off';
  const streakMilestonesJson = import.meta.env.VITE_STREAK_MILESTONES_JSON || '[3,7,14,30,60,100]';
  const streakMilestones = JSON.parse(streakMilestonesJson);

  // XP Toast Management
  const showXPToast = useCallback((amount, actionName) => {
    if (!featureEnabled) return;
    
    const toastId = Date.now();
    setToastQueue(prev => [...prev, { id: toastId, amount, actionName }]);
    
    emitAnalytics('xp_toast_shown', { amount, source: actionName });
  }, [featureEnabled]);

  const dismissToast = useCallback((toastId) => {
    setToastQueue(prev => prev.filter(toast => toast.id !== toastId));
  }, []);

  // Level Up Banner Management
  const showLevelUp = useCallback((level, currentXP, hasNewPerk = false) => {
    if (!featureEnabled) return;
    
    setLevelUpData({ level, currentXP, hasNewPerk });
    setShowLevelUpBanner(true);
    
    emitAnalytics('level_up_banner_shown', { level });
  }, [featureEnabled]);

  const dismissLevelUpBanner = useCallback(() => {
    setShowLevelUpBanner(false);
    setLevelUpData(null);
  }, []);

  // Streak Celebration Management
  const showStreakMilestone = useCallback((streakDays, bonusXP = null) => {
    if (!featureEnabled) return;
    
    // Check if this is a milestone
    if (streakMilestones.includes(streakDays)) {
      setStreakData({ streakDays, bonusXP });
      setShowStreakCelebration(true);
      
      emitAnalytics('streak_milestone_shown', { days: streakDays });
    }
  }, [featureEnabled, streakMilestones]);

  const dismissStreakCelebration = useCallback(() => {
    setShowStreakCelebration(false);
    setStreakData(null);
  }, []);

  // Perks Panel Management
  const openPerksPanel = useCallback(() => {
    console.log('openPerksPanel called, featureEnabled:', featureEnabled);
    if (!featureEnabled) {
      console.log('Feature not enabled, returning early');
      return;
    }
    console.log('Setting showPerksPanel to true');
    setShowPerksPanel(true);
    emitAnalytics('perks_panel_opened', {});
  }, [featureEnabled]);

  const closePerksPanel = useCallback(() => {
    console.log('closePerksPanel called');
    setShowPerksPanel(false);
  }, []);

  // Event Listeners Setup
  useEffect(() => {
    if (!featureEnabled) return;

    // XP Award Success Handler
    const handleXPAward = (data) => {
      const { amount, newTotal, source = 'xp_award' } = data;
      showXPToast(amount, source);
    };

    // Beacon Recast Success Handler
    const handleBeaconRecast = (data) => {
      const { xp_awarded, streak_days, broadcasts_total } = data;
      if (xp_awarded) {
        showXPToast(xp_awarded, 'beacon recast');
      }
      if (streak_days) {
        showStreakMilestone(streak_days);
      }
    };

    // Vault Upload Success Handler
    const handleVaultUpload = (data) => {
      const { xp_awarded } = data;
      if (xp_awarded) {
        showXPToast(xp_awarded, 'vault upload');
      }
    };

    // FSN Claim Success Handler
    const handleFsnClaim = (data) => {
      const { xp_awarded } = data;
      if (xp_awarded) {
        showXPToast(xp_awarded, 'fsn claim');
      }
    };

    // Profile Update Success Handler
    const handleProfileUpdate = (data) => {
      const { xp_awarded } = data;
      if (xp_awarded) {
        showXPToast(xp_awarded, 'profile update');
      }
    };

    // Register event listeners
    rewardsEmitter.on('xp/award/success', handleXPAward);
    rewardsEmitter.on('beacon/recast/success', handleBeaconRecast);
    rewardsEmitter.on('vault/upload/success', handleVaultUpload);
    rewardsEmitter.on('fsn/claim/success', handleFsnClaim);
    rewardsEmitter.on('profile/update/success', handleProfileUpdate);

    // Cleanup
    return () => {
      rewardsEmitter.off('xp/award/success', handleXPAward);
      rewardsEmitter.off('beacon/recast/success', handleBeaconRecast);
      rewardsEmitter.off('vault/upload/success', handleVaultUpload);
      rewardsEmitter.off('fsn/claim/success', handleFsnClaim);
      rewardsEmitter.off('profile/update/success', handleProfileUpdate);
    };
  }, [featureEnabled, showXPToast, showStreakMilestone]);

  return {
    // Toast management
    toastQueue,
    dismissToast,
    
    // Level up banner
    showLevelUpBanner,
    levelUpData,
    dismissLevelUpBanner,
    showLevelUp,
    
    // Streak celebration
    showStreakCelebration,
    streakData,
    dismissStreakCelebration,
    
    // Perks panel
    showPerksPanel,
    openPerksPanel,
    closePerksPanel,
    
    // Manual triggers (for testing or direct use)
    showXPToast,
    showStreakMilestone
  };
};