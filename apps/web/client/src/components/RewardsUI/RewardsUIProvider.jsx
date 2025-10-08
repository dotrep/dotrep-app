import React, { createContext, useContext, useState, useCallback } from 'react';
import RewardsToast from './RewardsToast';
import RecentRewardsPanel from './RecentRewardsPanel';
import { useRewardsPolling } from '@/hooks/useRewardsPolling';

// Rewards UI Context
const RewardsUIContext = createContext({
  showToast: () => {},
  showRecentPanel: () => {},
  hideRecentPanel: () => {},
  isRecentPanelOpen: false
});

export const useRewardsUI = () => {
  const context = useContext(RewardsUIContext);
  if (!context) {
    throw new Error('useRewardsUI must be used within a RewardsUIProvider');
  }
  return context;
};

// Rewards UI Provider Component
export const RewardsUIProvider = ({ children }) => {
  // Check if rewards UI is enabled
  const isEnabled = import.meta.env.VITE_REWARDS_UI_ENABLED === 'true';
  
  // State for toast notifications
  const [toastState, setToastState] = useState({
    show: false,
    amount: 0,
    friendlyReason: ''
  });
  
  // State for recent rewards panel
  const [isRecentPanelOpen, setIsRecentPanelOpen] = useState(false);
  
  // Callback for new reward notifications
  const handleNewReward = useCallback((reward) => {
    if (!isEnabled) return;
    
    console.log('New reward received:', reward);
    
    // Show toast notification
    setToastState({
      show: true,
      amount: reward.amount,
      friendlyReason: reward.friendlyReason
    });
  }, [isEnabled]);
  
  // Initialize polling for new rewards
  useRewardsPolling(handleNewReward);
  
  // Toast functions
  const showToast = useCallback((amount, friendlyReason) => {
    if (!isEnabled) return;
    
    setToastState({
      show: true,
      amount,
      friendlyReason
    });
  }, [isEnabled]);
  
  const hideToast = useCallback(() => {
    setToastState(prev => ({ ...prev, show: false }));
  }, []);
  
  // Panel functions
  const showRecentPanel = useCallback(() => {
    if (!isEnabled) return;
    setIsRecentPanelOpen(true);
  }, [isEnabled]);
  
  const hideRecentPanel = useCallback(() => {
    setIsRecentPanelOpen(false);
  }, []);
  
  // Context value
  const value = {
    showToast,
    showRecentPanel,
    hideRecentPanel,
    isRecentPanelOpen,
    isEnabled
  };
  
  // If rewards UI is disabled, just render children without any UI
  if (!isEnabled) {
    return <>{children}</>;
  }
  
  return (
    <RewardsUIContext.Provider value={value}>
      {children}
      
      {/* Toast Notifications */}
      <RewardsToast
        show={toastState.show}
        amount={toastState.amount}
        friendlyReason={toastState.friendlyReason}
        onClose={hideToast}
      />
      
      {/* Recent Rewards Panel */}
      <RecentRewardsPanel
        show={isRecentPanelOpen}
        onClose={hideRecentPanel}
      />
    </RewardsUIContext.Provider>
  );
};

export default RewardsUIProvider;