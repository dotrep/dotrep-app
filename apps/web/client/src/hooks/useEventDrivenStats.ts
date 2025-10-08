// Event-driven stats updates replacing polling
import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useContractOperations } from './useContractOperations';

interface UserStats {
  xpPoints: number;
  level: number;
  invitedCount: number;
  isLoading: boolean;
}

export function useEventDrivenStats() {
  const { isConnected, address } = useAccount();
  const { points } = useContractOperations();
  const [dbStats, setDbStats] = useState({
    level: 1,
    invitedCount: 0,
    isLoading: true
  });

  // Load initial DB stats (level, invites, etc.)
  useEffect(() => {
    if (!isConnected) {
      setDbStats({ level: 1, invitedCount: 0, isLoading: false });
      return;
    }

    const loadDbStats = async () => {
      try {
        const response = await fetch('/api/user/stats-db-only');
        const data = await response.json();
        setDbStats({
          level: data.level || 1,
          invitedCount: data.invitedCount || 0,
          isLoading: false
        });
      } catch (error) {
        console.error('Failed to load DB stats:', error);
        setDbStats({ level: 1, invitedCount: 0, isLoading: false });
      }
    };

    loadDbStats();
  }, [isConnected, address]);

  // Listen for XP events to trigger refetch
  useEffect(() => {
    const handleXPAwarded = () => {
      points.refetchXP();
      // Also refetch DB stats in case level changed
      if (isConnected) {
        fetch('/api/user/stats-db-only')
          .then(res => res.json())
          .then(data => {
            setDbStats({
              level: data.level || 1,
              invitedCount: data.invitedCount || 0,
              isLoading: false
            });
          })
          .catch(console.error);
      }
    };

    window.addEventListener('fsn:xpAwarded', handleXPAwarded);
    return () => window.removeEventListener('fsn:xpAwarded', handleXPAwarded);
  }, [points.refetchXP, isConnected]);

  // Listen for wallet connection changes
  useEffect(() => {
    if (isConnected && address) {
      // Refetch XP when wallet connects
      points.refetchXP();
    }
  }, [isConnected, address, points.refetchXP]);

  const stats: UserStats = {
    xpPoints: isConnected ? points.totalXP : 0,
    level: dbStats.level,
    invitedCount: dbStats.invitedCount,
    isLoading: dbStats.isLoading
  };

  return stats;
}