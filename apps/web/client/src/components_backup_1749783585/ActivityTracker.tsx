import React, { useState, useEffect } from 'react';
import { Clock, FileText, MessageSquare, Key, Award, ChevronRight } from 'lucide-react';
import '../styles/dashboard-extensions.css';

interface Activity {
  id: string;
  type: 'message' | 'file' | 'login' | 'quest' | 'reward' | 'achievement';
  action: string;
  timestamp: string;
  reward?: string;
  icon: React.ReactNode;
}

interface ActivityTrackerProps {
  userId?: number | null;
  limit?: number;
}

/**
 * Enhanced activity tracker component showing user activity with XP rewards
 */
const ActivityTracker: React.FC<ActivityTrackerProps> = ({ userId, limit = 5 }) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAll, setShowAll] = useState<boolean>(false);
  
  // Get icon for activity type
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <MessageSquare size={20} />;
      case 'file':
        return <FileText size={20} />;
      case 'login':
        return <Key size={20} />;
      case 'quest':
      case 'achievement':
        return <Award size={20} />;
      default:
        return <Clock size={20} />;
    }
  };
  
  // Load activity data (would connect to API in production)
  useEffect(() => {
    if (!userId) return;
    
    // Simulate API fetch delay
    const timer = setTimeout(() => {
      // Example activities (would be fetched from API in production)
      const demoActivities: Activity[] = [
        {
          id: 'act-1',
          type: 'login',
          action: 'Logged in to FreeSpace Network',
          timestamp: '2 hours ago',
          reward: '+10 XP',
          icon: getActivityIcon('login')
        },
        {
          id: 'act-2',
          type: 'message',
          action: 'Sent message to ghost.fsn',
          timestamp: '3 hours ago',
          reward: '+15 XP',
          icon: getActivityIcon('message')
        },
        {
          id: 'act-3',
          type: 'file',
          action: 'Uploaded file to FSN Vault',
          timestamp: '1 day ago',
          reward: '+25 XP',
          icon: getActivityIcon('file')
        },
        {
          id: 'act-4',
          type: 'quest',
          action: 'Completed "Signal Discovery" quest',
          timestamp: '2 days ago',
          reward: '+100 XP',
          icon: getActivityIcon('quest')
        },
        {
          id: 'act-5',
          type: 'message',
          action: 'Started conversation with echo.fsn',
          timestamp: '3 days ago',
          reward: '+15 XP',
          icon: getActivityIcon('message')
        },
        {
          id: 'act-6',
          type: 'achievement',
          action: 'Earned "Explorer" badge',
          timestamp: '5 days ago',
          reward: '+50 XP',
          icon: getActivityIcon('achievement')
        },
        {
          id: 'act-7',
          type: 'file',
          action: 'Downloaded file from FSN Vault',
          timestamp: '1 week ago',
          reward: '+5 XP',
          icon: getActivityIcon('file')
        }
      ];
      
      setActivities(demoActivities);
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [userId]);
  
  // Calculate total XP earned
  const totalXPEarned = activities.reduce((total, activity) => {
    if (!activity.reward) return total;
    const xpMatch = activity.reward.match(/\+(\d+) XP/);
    return total + (xpMatch ? parseInt(xpMatch[1]) : 0);
  }, 0);
  
  return (
    <div className="activity-feed">
      <div className="activity-header">
        <div className="activity-title">
          <Clock size={18} style={{ marginRight: '8px' }} />
          Recent Activity
        </div>
        <div className="activity-view-all" onClick={() => setShowAll(!showAll)}>
          <span>{showAll ? 'Show Less' : 'View All'}</span>
          <ChevronRight 
            size={14} 
            style={{ 
              marginLeft: '4px',
              transform: showAll ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease'
            }} 
          />
        </div>
      </div>
      
      {loading ? (
        <div className="activity-loading">
          <p>Loading activity data...</p>
        </div>
      ) : activities.length === 0 ? (
        <div className="activity-empty">
          <p>No activity yet</p>
        </div>
      ) : (
        <div className="activity-content">
          {activities.slice(0, showAll ? activities.length : limit).map(activity => (
            <div key={activity.id} className="activity-entry">
              <div className="activity-icon">
                {activity.icon}
              </div>
              
              <div className="activity-content">
                <div className="activity-action">{activity.action}</div>
                <div className="activity-details">
                  <span className="activity-timestamp">{activity.timestamp}</span>
                  {activity.reward && (
                    <span className="activity-reward">{activity.reward}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="activity-summary">
        <div className="activity-total">
          Total XP earned: <span className="xp-total">{totalXPEarned} XP</span>
        </div>
      </div>
    </div>
  );
};

export default ActivityTracker;