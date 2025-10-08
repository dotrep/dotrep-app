// Streak Display Component - Task 7 Daily Login Streak
import React, { useState, useEffect } from 'react';
import { Flame, Calendar, Target, Trophy } from 'lucide-react';

interface StreakStats {
  currentStreak: number;
  lastLogin: string | null;
  nextMilestone: number | null;
  daysToNextMilestone: number | null;
}

interface StreakDisplayProps {
  userId: number;
  className?: string;
}

export const StreakDisplay: React.FC<StreakDisplayProps> = ({ userId, className = '' }) => {
  const [streakStats, setStreakStats] = useState<StreakStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStreakStats();
  }, [userId]);

  const fetchStreakStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/streak/user/${userId}/stats`);
      const data = await response.json();
      
      if (data.success) {
        setStreakStats({
          currentStreak: data.currentStreak,
          lastLogin: data.lastLogin,
          nextMilestone: data.nextMilestone,
          daysToNextMilestone: data.daysToNextMilestone
        });
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch streak stats');
      }
    } catch (err) {
      console.error('Error fetching streak stats:', err);
      setError('Failed to load streak information');
    } finally {
      setLoading(false);
    }
  };

  const getStreakColor = (streak: number) => {
    if (streak >= 30) return 'text-purple-400';
    if (streak >= 14) return 'text-blue-400';
    if (streak >= 7) return 'text-green-400';
    if (streak >= 3) return 'text-yellow-400';
    return 'text-orange-400';
  };

  const getStreakGlow = (streak: number) => {
    if (streak >= 30) return 'shadow-purple-500/50';
    if (streak >= 14) return 'shadow-blue-500/50';
    if (streak >= 7) return 'shadow-green-500/50';
    if (streak >= 3) return 'shadow-yellow-500/50';
    return 'shadow-orange-500/50';
  };

  const getMilestoneReward = (milestone: number) => {
    const rewards: Record<number, number> = {
      1: 5,
      3: 15,
      7: 35,
      14: 70,
      30: 150
    };
    return rewards[milestone] || 0;
  };

  if (loading) {
    return (
      <div className={`bg-slate-900/50 border border-cyan-500/30 rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cyan-400"></div>
          <span className="text-cyan-400">Loading streak...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-slate-900/50 border border-red-500/30 rounded-lg p-4 ${className}`}>
        <div className="flex items-center space-x-2 text-red-400">
          <Calendar className="h-4 w-4" />
          <span>Error: {error}</span>
        </div>
      </div>
    );
  }

  if (!streakStats) {
    return null;
  }

  const { currentStreak, nextMilestone, daysToNextMilestone } = streakStats;

  return (
    <div className={`bg-slate-900/50 border border-cyan-500/30 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className={`p-2 rounded-lg bg-slate-800/50 border border-cyan-500/20 shadow-lg ${getStreakGlow(currentStreak)}`}>
            <Flame className={`h-5 w-5 ${getStreakColor(currentStreak)}`} />
          </div>
          <div>
            <h3 className="text-white font-semibold">Login Streak</h3>
            <p className="text-slate-400 text-sm">Keep it going!</p>
          </div>
        </div>
        
        <div className="text-right">
          <div className={`text-2xl font-bold ${getStreakColor(currentStreak)}`}>
            {currentStreak}
          </div>
          <div className="text-slate-400 text-sm">
            {currentStreak === 1 ? 'day' : 'days'}
          </div>
        </div>
      </div>

      {/* Progress to Next Milestone */}
      {nextMilestone && daysToNextMilestone !== null && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-1 text-slate-400">
              <Target className="h-3 w-3" />
              <span>Next milestone: {nextMilestone} days</span>
            </div>
            <div className="flex items-center space-x-1 text-cyan-400">
              <Trophy className="h-3 w-3" />
              <span>+{getMilestoneReward(nextMilestone)} XP</span>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-slate-800 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${((nextMilestone - daysToNextMilestone) / nextMilestone) * 100}%` 
              }}
            />
          </div>
          
          <p className="text-xs text-slate-400 text-center">
            {daysToNextMilestone} more {daysToNextMilestone === 1 ? 'day' : 'days'} to reach {nextMilestone}-day streak
          </p>
        </div>
      )}

      {/* Streak Milestones */}
      <div className="mt-3 pt-3 border-t border-slate-800">
        <div className="flex justify-between text-xs text-slate-400">
          {[1, 3, 7, 14, 30].map((milestone) => (
            <div 
              key={milestone}
              className={`flex flex-col items-center space-y-1 ${
                currentStreak >= milestone ? 'text-cyan-400' : 'text-slate-600'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${
                currentStreak >= milestone ? 'bg-cyan-400' : 'bg-slate-600'
              }`} />
              <span>{milestone}d</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StreakDisplay;