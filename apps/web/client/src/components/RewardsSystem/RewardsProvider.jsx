import React from 'react';
import { useRewardsListener } from '@/hooks/useRewardsListener';
import XPToast from './XPToast';
import LevelUpBanner from './LevelUpBanner';
import StreakCelebration from './StreakCelebration';
import PerksPanel from './PerksPanel';
import { useQuery } from '@tanstack/react-query';

const RewardsProvider = ({ children }) => {
  const {
    toastQueue,
    dismissToast,
    showLevelUpBanner,
    levelUpData,
    dismissLevelUpBanner,
    showLevelUp,
    showStreakCelebration,
    streakData,
    dismissStreakCelebration,
    showPerksPanel,
    openPerksPanel,
    closePerksPanel
  } = useRewardsListener();

  // Get current user XP for progress tracking
  const { data: userStats } = useQuery({
    queryKey: ['/api/user/stats'],
    refetchInterval: 5000,
    retry: false
  });

  const currentXP = userStats?.xpPoints || 0;

  // Feature flag check - enable by default for testing
  const featureEnabled = import.meta.env.VITE_FEATURE_REWARDS_FEEDBACK !== 'off';

  if (!featureEnabled) {
    return <>{children}</>;
  }

  return (
    <>
      {children}
      
      {/* XP Toasts - Multiple can be shown */}
      {toastQueue.map((toast, index) => (
        <XPToast
          key={toast.id}
          show={true}
          amount={toast.amount}
          actionName={toast.actionName}
          onDismiss={() => dismissToast(toast.id)}
          style={{
            top: `${80 + (index * 70)}px` // Stack toasts vertically
          }}
        />
      ))}

      {/* Level Up Banner */}
      <LevelUpBanner
        show={showLevelUpBanner}
        level={levelUpData?.level}
        hasNewPerk={levelUpData?.hasNewPerk}
        onDismiss={dismissLevelUpBanner}
        onOpenPerks={openPerksPanel}
      />

      {/* Streak Celebration Modal */}
      <StreakCelebration
        show={showStreakCelebration}
        streakDays={streakData?.streakDays}
        bonusXP={streakData?.bonusXP}
        onDismiss={dismissStreakCelebration}
      />

      {/* Perks Panel */}
      <PerksPanel
        show={showPerksPanel}
        currentXP={currentXP}
        onClose={closePerksPanel}
      />
    </>
  );
};

export default RewardsProvider;