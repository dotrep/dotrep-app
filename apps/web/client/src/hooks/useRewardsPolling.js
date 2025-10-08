import { useEffect, useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';

export const useRewardsPolling = (onNewReward) => {
  const isEnabled = import.meta.env.VITE_REWARDS_UI_ENABLED === 'true';
  const lastChecked = useRef(new Date().toISOString());
  
  // Poll for new rewards every 30 seconds
  const { data: newRewards = [] } = useQuery({
    queryKey: ['/api/rewards/since', lastChecked.current],
    queryFn: async () => {
      const response = await fetch(`/api/rewards/since?cursor=${lastChecked.current}`);
      if (!response.ok) {
        throw new Error('Failed to fetch new rewards');
      }
      return response.json();
    },
    enabled: isEnabled,
    refetchInterval: 30000, // Poll every 30 seconds
    refetchOnWindowFocus: true,
  });

  // Handle new rewards
  useEffect(() => {
    if (newRewards && newRewards.length > 0) {
      // Update cursor to most recent timestamp
      const mostRecent = newRewards[0];
      lastChecked.current = mostRecent.createdAt;
      
      // Trigger toast for each new reward
      newRewards.reverse().forEach((reward, index) => {
        setTimeout(() => {
          onNewReward(reward);
        }, index * 500); // Stagger toasts by 500ms
      });
    }
  }, [newRewards, onNewReward]);

  return {
    isEnabled,
    newRewardsCount: newRewards?.length || 0
  };
};