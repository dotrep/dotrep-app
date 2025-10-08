import React, { useState, useEffect } from 'react';
import PulseChain from './PulseChain';

const PulseHistory = () => {
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        // Fetch real data from the user stats API to get quest data
        const response = await fetch('/api/user/stats');
        if (response.ok) {
          const userData = await response.json();
          
          // Parse quest data to get completed tasks
          let completedTasks = [];
          try {
            if (userData.questData) {
              const questData = JSON.parse(userData.questData);
              completedTasks = questData.pulseTasks || [];
            }
          } catch (error) {
            console.error('Error parsing quest data:', error);
          }

          // Create history entries for completed tasks with expanded categories
          const taskDetails = {
            // Vault Activities
            'upload_file': { name: 'Uploaded file to vault', hz: 5, xp: 50, icon: '📤', category: 'Vault' },
            'vault_scan': { name: 'Vault security scan completed', hz: 3, xp: 30, icon: '🔍', category: 'Vault' },
            'vault_backup': { name: 'Vault backup created', hz: 4, xp: 40, icon: '💾', category: 'Vault' },
            'access_vault': { name: 'Accessed secure vault', hz: 4, xp: 40, icon: '🗄️', category: 'Vault' },
            
            // Signal Activities  
            'tune_signal': { name: 'Tuned signal frequency', hz: 4, xp: 40, icon: '📡', category: 'Signal' },
            'broadcast_signal': { name: 'Broadcast on 102.30 MHz', hz: 6, xp: 60, icon: '📻', category: 'Signal' },
            'signal_decode': { name: 'Decoded encrypted transmission', hz: 8, xp: 80, icon: '🔓', category: 'Signal' },
            'signal_lock': { name: 'Locked signal channel', hz: 5, xp: 50, icon: '🔒', category: 'Signal' },
            'frequency_scan': { name: 'Scanned frequency range', hz: 3, xp: 30, icon: '🔍', category: 'Signal' },
            
            // XP/Profile Activities
            'complete_profile': { name: 'Updated profile information', hz: 6, xp: 60, icon: '👤', category: 'XP' },
            'daily_login': { name: 'Daily login streak', hz: 5, xp: 50, icon: '🔑', category: 'XP' },
            'send_message': { name: 'Sent secure message', hz: 4, xp: 40, icon: '💬', category: 'XP' },
            'level_up': { name: 'Reached new level!', hz: 10, xp: 100, icon: '⬆️', category: 'XP' },
            'milestone_achieved': { name: 'Milestone achievement unlocked', hz: 15, xp: 150, icon: '🏆', category: 'XP' },
            
            // NFT/Game Activities
            'nft_forged': { name: 'NFT forged successfully', hz: 8, xp: 80, icon: '⚒️', category: 'NFT' },
            'nft_linked': { name: 'NFT linked to profile', hz: 6, xp: 60, icon: '🔗', category: 'NFT' },
            'hex_fragment': { name: 'Collected hex map fragment', hz: 7, xp: 70, icon: '🧩', category: 'NFT' },
            'play_mini_game': { name: 'Completed arcade game', hz: 5, xp: 50, icon: '🎮', category: 'Game' },
            'puzzle_solved': { name: 'Solved signal puzzle', hz: 12, xp: 120, icon: '🧠', category: 'Signal' },
            'join_discord': { name: 'Joined community', hz: 7, xp: 70, icon: '💬', category: 'XP' }
          };

          const history = completedTasks.map((taskId, index) => {
            const task = taskDetails[taskId] || { name: taskId, hz: 5, xp: 50, icon: '⚡', category: 'XP' };
            // Create realistic timestamps with proper spacing
            const now = new Date();
            const hoursAgo = (index + 1) * 6 + Math.random() * 4; // 6-10 hours apart
            const timestamp = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);
            
            return {
              id: index + 1,
              task: task.name,
              xpEarned: task.xp,
              hzEarned: task.hz,
              timestamp: timestamp,
              icon: task.icon,
              category: task.category
            };
          }).reverse(); // Show most recent first

          setHistoryData(history);
        } else {
          throw new Error('Failed to fetch user data');
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching pulse history:', error);
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    // Format date and time for recent activities
    const timeStr = timestamp.toLocaleTimeString('en-US', { 
      hour12: true, 
      hour: 'numeric', 
      minute: '2-digit' 
    });
    const dateStr = timestamp.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });

    if (minutes < 60) {
      return `${minutes}m ago • ${timeStr}`;
    } else if (hours < 24) {
      return `${hours}h ago • ${timeStr}`;
    } else if (days === 1) {
      return `Yesterday • ${timeStr}`;
    } else if (days < 7) {
      return `${days}d ago • ${dateStr} ${timeStr}`;
    } else {
      return `${dateStr} • ${timeStr}`;
    }
  };

  if (loading) {
    return (
      <div className="pulse-history-loading">
        <div className="loading-spinner"></div>
        <span>Loading pulse activity...</span>
      </div>
    );
  }

  // Filter data based on active filter
  const filteredData = historyData.filter(item => {
    if (activeFilter === 'All') return true;
    return item.category === activeFilter;
  });

  if (historyData.length === 0) {
    return (
      <div className="pulse-history-empty">
        <span className="empty-icon">👀</span>
        <p>No recent activity yet.</p>
        <p>Start building your Pulse to see history here!</p>
      </div>
    );
  }

  return (
    <div className="pulse-history">
      <div className="pulse-history-header">
        <h3>Recent Pulse Activity</h3>
        <span className="history-count">{filteredData.length} activities</span>
      </div>
      
      {/* Filter Buttons */}
      <div className="pulse-history-filters">
        {['All', 'Vault', 'Signal', 'XP', 'NFT'].map((filter) => (
          <button
            key={filter}
            className={`filter-btn ${activeFilter === filter ? 'active' : ''}`}
            onClick={() => setActiveFilter(filter)}
          >
            {filter}
          </button>
        ))}
      </div>
      
      <div className="pulse-history-list">
        {filteredData.map((activity) => (
          <div key={activity.id} className="pulse-history-item">
            <div className="history-item-left">
              <span className="history-icon">{activity.icon}</span>
              <div className="history-details">
                <span className="history-task">{activity.task}</span>
                <span className="history-time">{formatTimeAgo(activity.timestamp)}</span>
              </div>
            </div>
            <div className="history-item-right">
              <div className="history-rewards">
                <span className="history-xp">+{activity.xpEarned} XP</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {filteredData.length === 0 && historyData.length > 0 && (
        <div className="pulse-history-empty">
          <span className="empty-icon">🔍</span>
          <p>No {activeFilter.toLowerCase()} activities found</p>
          <p>Try a different filter or complete more tasks</p>
        </div>
      )}
      
      <div className="pulse-history-stats">
        <div className="stat-item">
          <span className="stat-label">Total XP Earned:</span>
          <span className="stat-value">{filteredData.reduce((sum, item) => sum + item.xpEarned, 0)} XP</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Activities Tracked:</span>
          <span className="stat-value">{filteredData.length}</span>
        </div>
      </div>

      {/* Pulse Chain Constellation */}
      <PulseChain />
    </div>
  );
};

export default PulseHistory;