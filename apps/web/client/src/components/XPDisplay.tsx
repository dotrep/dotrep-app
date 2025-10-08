import React, { useState, useEffect } from 'react';
import { Star, TrendingUp, Award, Zap } from 'lucide-react';

interface XPDisplayProps {
  userId: number;
  showBreakdown?: boolean;
  className?: string;
}

interface XPAction {
  points: number;
  description: string;
  category: string;
  oneTime?: boolean;
}

interface XPActivity {
  action: string;
  xpEarned: number;
  description: string;
  timestamp: string;
  category: string;
}

const XPDisplay: React.FC<XPDisplayProps> = ({ 
  userId, 
  showBreakdown = false, 
  className = '' 
}) => {
  const [totalXP, setTotalXP] = useState(0);
  const [breakdown, setBreakdown] = useState<Record<string, number>>({});
  const [recentActivity, setRecentActivity] = useState<XPActivity[]>([]);
  const [availableActions, setAvailableActions] = useState<Record<string, XPAction>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchXPData();
      fetchAvailableActions();
    }
  }, [userId]);

  const fetchXPData = async () => {
    try {
      setLoading(true);
      
      // Fetch total XP
      const totalResponse = await fetch(`/api/xp/user/${userId}/total`);
      if (totalResponse.ok) {
        const totalData = await totalResponse.json();
        setTotalXP(totalData.totalXP || 0);
      }

      // Fetch XP breakdown by category
      if (showBreakdown) {
        const breakdownResponse = await fetch(`/api/xp/user/${userId}/breakdown`);
        if (breakdownResponse.ok) {
          const breakdownData = await breakdownResponse.json();
          setBreakdown(breakdownData.breakdown || {});
        }

        // Fetch recent activity
        const activityResponse = await fetch(`/api/xp/user/${userId}/activity?limit=5`);
        if (activityResponse.ok) {
          const activityData = await activityResponse.json();
          setRecentActivity(activityData.activity || []);
        }
      }
    } catch (error) {
      console.error('Error fetching XP data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableActions = async () => {
    try {
      const response = await fetch('/api/xp/actions');
      if (response.ok) {
        const data = await response.json();
        setAvailableActions(data.actions || {});
      }
    } catch (error) {
      console.error('Error fetching available XP actions:', error);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'identity': return <Award className="w-4 h-4" />;
      case 'social': return <Star className="w-4 h-4" />;
      case 'content': return <TrendingUp className="w-4 h-4" />;
      case 'engagement': return <Zap className="w-4 h-4" />;
      default: return <Star className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'identity': return 'text-blue-400';
      case 'social': return 'text-green-400';
      case 'content': return 'text-purple-400';
      case 'engagement': return 'text-yellow-400';
      case 'milestones': return 'text-orange-400';
      case 'gamification': return 'text-pink-400';
      default: return 'text-cyan-400';
    }
  };

  if (loading) {
    return (
      <div className={`xp-display ${className}`}>
        <div className="animate-pulse bg-gray-700 h-16 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className={`xp-display ${className}`}>
      {/* Main XP Display */}
      <div className="xp-main bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-cyan-500/20 p-2 rounded-full">
              <Zap className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Total XP</h3>
              <p className="text-cyan-400 text-2xl font-mono">{totalXP.toLocaleString()}</p>
            </div>
          </div>
          
          {/* XP Level Indicator */}
          <div className="text-right">
            <div className="text-sm text-gray-400">Level</div>
            <div className="text-xl font-bold text-white">
              {Math.floor(totalXP / 100) + 1}
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Breakdown */}
      {showBreakdown && (
        <div className="mt-4 space-y-4">
          {/* Category Breakdown */}
          {Object.keys(breakdown).length > 0 && (
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
              <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                XP by Category
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(breakdown).map(([category, xp]) => (
                  <div key={category} className="flex items-center justify-between p-2 bg-gray-700/30 rounded">
                    <div className="flex items-center gap-2">
                      <span className={getCategoryColor(category)}>
                        {getCategoryIcon(category)}
                      </span>
                      <span className="text-gray-300 capitalize text-sm">{category}</span>
                    </div>
                    <span className="text-white font-mono text-sm">{xp}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Activity */}
          {recentActivity.length > 0 && (
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
              <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                <Star className="w-4 h-4" />
                Recent Activity
              </h4>
              <div className="space-y-2">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-700/20 rounded">
                    <div className="flex items-center gap-2">
                      <span className={getCategoryColor(activity.category)}>
                        {getCategoryIcon(activity.category)}
                      </span>
                      <div>
                        <div className="text-gray-300 text-sm">{activity.description}</div>
                        <div className="text-gray-500 text-xs">
                          {new Date(activity.timestamp).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <span className="text-green-400 font-mono text-sm">+{activity.xpEarned}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Available Actions */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Award className="w-4 h-4" />
              Earn More XP
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {Object.entries(availableActions)
                .filter(([, action]) => action.category === 'identity' || action.category === 'social')
                .slice(0, 4)
                .map(([key, action]) => (
                <div key={key} className="flex items-center justify-between p-2 bg-gray-700/20 rounded">
                  <div className="flex items-center gap-2">
                    <span className={getCategoryColor(action.category)}>
                      {getCategoryIcon(action.category)}
                    </span>
                    <span className="text-gray-300 text-sm">{action.description}</span>
                  </div>
                  <span className="text-cyan-400 font-mono text-sm">+{action.points}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export { XPDisplay };
export default XPDisplay;