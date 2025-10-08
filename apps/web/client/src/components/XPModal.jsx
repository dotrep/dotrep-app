import React, { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/queryClient';
import './XPModal.css';

const XPModal = ({ xp, level, xpToNext, recentLogs, xpBoost, pulseHz, onClose, signalActive = false }) => {
  const [animatedPercentage, setAnimatedPercentage] = useState(0);
  const [questCooldowns, setQuestCooldowns] = useState({});
  const [completingQuest, setCompletingQuest] = useState(null);
  const [activeTab, setActiveTab] = useState('TASKS');
  const [showTaskComplete, setShowTaskComplete] = useState(false);
  const [completedTaskId, setCompletedTaskId] = useState(null);
  const [nextTaskBounce, setNextTaskBounce] = useState(false);
  const targetPercentage = Math.min(100, (xp / xpToNext) * 100);
  
  // Calculate XP needed for current level
  const currentLevelXP = level > 1 ? (level - 1) * 500 : 0;
  const nextLevelXP = level * 500;
  const progressXP = xp - currentLevelXP;
  const levelProgressPercentage = Math.min(100, (progressXP / (nextLevelXP - currentLevelXP)) * 100);

  // Icon mapping for activity logs
  const getActivityIcon = (activity) => {
    if (activity.includes('Dashboard')) return '📊';
    if (activity.includes('Signal')) return '📡';
    if (activity.includes('Pulse')) return '🔄';
    if (activity.includes('Login')) return '🔑';
    if (activity.includes('Vault')) return '🗄️';
    if (activity.includes('Upload')) return '📤';
    if (activity.includes('Quest')) return '🎯';
    return '⚡';
  };

  // Format XP amounts in activity logs
  const formatActivityLog = (log) => {
    const parts = log.split(' – ');
    if (parts.length === 2) {
      const xpAmount = parts[0];
      const activity = parts[1];
      return { xpAmount, activity };
    }
    return { xpAmount: '', activity: log };
  };

  useEffect(() => {
    // Animate XP bar on mount
    const timer = setTimeout(() => {
      setAnimatedPercentage(levelProgressPercentage);
    }, 200);
    return () => clearTimeout(timer);
  }, [levelProgressPercentage]);

  // Handle overlay click to close
  const handleOverlayClick = (e) => {
    if (e.target.classList.contains('xp-modal-overlay')) {
      onClose();
    }
  };

  // Map activity types to quest IDs
  const getQuestIdFromActivity = (activity) => {
    if (activity.includes('Dashboard')) return 'dashboard_visit';
    if (activity.includes('Signal')) return 'signal_tuning';
    if (activity.includes('Pulse')) return 'pulse_activity';
    if (activity.includes('Login')) return 'daily_login';
    if (activity.includes('Vault')) return 'vault_access';
    if (activity.includes('Message')) return 'message_send';
    if (activity.includes('Profile')) return 'profile_update';
    if (activity.includes('Beacon')) return 'beacon_activation';
    return null;
  };

  // Check if quest is on cooldown
  const isQuestOnCooldown = (questId) => {
    const lastCompleted = questCooldowns[questId];
    if (!lastCompleted) return false;
    
    const cooldownDuration = 300000; // 5 minutes for most quests
    const timeElapsed = Date.now() - lastCompleted;
    return timeElapsed < cooldownDuration;
  };

  // Handle quest completion
  const handleQuestClick = async (activity) => {
    const questId = getQuestIdFromActivity(activity);
    if (!questId) return;
    
    if (isQuestOnCooldown(questId)) {
      console.log(`Quest ${questId} is on cooldown`);
      return;
    }
    
    if (completingQuest === questId) return;
    
    try {
      setCompletingQuest(questId);
      
      // Use hardcoded user ID for now (this would normally come from auth context)
      const userId = 7;
      
      const response = await apiRequest('/api/quest/complete', {
        method: 'POST',
        body: { questId, userId }
      });
      
      if (response.success) {
        // Set cooldown
        setQuestCooldowns(prev => ({
          ...prev,
          [questId]: Date.now()
        }));
        
        // Show success feedback
        console.log(`Quest completed: ${response.questCompleted}, XP gained: ${response.xpGained}`);
        
        // Close modal to refresh XP data
        setTimeout(() => {
          onClose();
        }, 1000);
      }
    } catch (error) {
      console.error('Error completing quest:', error);
    } finally {
      setCompletingQuest(null);
    }
  };

  return (
    <div className="xp-modal-overlay" onClick={handleOverlayClick}>
      <div className="xp-modal">
        <button className="xp-close" onClick={onClose}>×</button>
        <h2>Level {level}</h2>
        <p>Total XP: {xp.toLocaleString()}</p>
        
        <div className="xp-bar-container">
          <div 
            className="xp-bar-fill" 
            style={{ width: `${animatedPercentage}%` }} 
          />
        </div>
        
        <p>
          {progressXP.toLocaleString()} / {(nextLevelXP - currentLevelXP).toLocaleString()} XP to Level {level + 1}
        </p>
        
        <h3 data-tooltip={`Pulse: ${pulseHz}Hz → Active XP Multiplier`}>
          XP Boost: +{xpBoost}%
        </h3>
        
        {signalActive && (
          <div className="signal-status">
            <span className="signal-status-dot"></span>
            Signal Active
          </div>
        )}
        
        <h4>Recent Activity</h4>
        <ul>
          {recentLogs && recentLogs.length > 0 ? (
            recentLogs.map((log, index) => {
              const { xpAmount, activity } = formatActivityLog(log);
              const icon = getActivityIcon(activity);
              const questId = getQuestIdFromActivity(activity);
              const onCooldown = questId ? isQuestOnCooldown(questId) : false;
              const isCompleting = completingQuest === questId;
              
              return (
                <li 
                  key={index}
                  className={`quest-item ${questId ? 'clickable' : ''} ${onCooldown ? 'on-cooldown' : ''} ${isCompleting ? 'completing' : ''}`}
                  onClick={() => questId && handleQuestClick(activity)}
                  title={questId ? (onCooldown ? 'Quest on cooldown' : 'Click to repeat quest') : ''}
                >
                  <span className="xp-icon">{icon}</span>
                  <span className="xp-amount">{xpAmount}</span>
                  <span> – {activity}</span>
                  {isCompleting && <span className="completing-indicator">...</span>}
                </li>
              );
            })
          ) : (
            <li style={{ opacity: 0.6, fontStyle: 'italic' }}>
              <span className="xp-icon">⚡</span>
              <span>No recent activity</span>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default XPModal;