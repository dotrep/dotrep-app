import React, { useState, useEffect } from 'react';
import { Compass, Search, MessageSquare, Shield, FileBox, Target, Award } from 'lucide-react';
import '../styles/dashboard-extensions.css';

// Quest interface
interface Quest {
  id: string;
  name: string;
  description: string;
  type: 'story' | 'daily' | 'achievement';
  progress: number;
  total: number;
  reward: string;
  icon: React.ReactNode;
  completed?: boolean;
  isNew?: boolean;
}

interface QuestSystemProps {
  userId?: number | null;
}

/**
 * Interactive Quest System component that displays available quests
 * and tracks progress towards completion
 */
const QuestSystem: React.FC<QuestSystemProps> = ({ userId }) => {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
  const [showQuestModal, setShowQuestModal] = useState<boolean>(false);
  const [questCooldowns, setQuestCooldowns] = useState<{[questId: string]: number}>({});
  const [cooldownTimers, setCooldownTimers] = useState<{[questId: string]: number}>({});
  
  // Update cooldown timers every second
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const updatedTimers: {[questId: string]: number} = {};
      
      Object.entries(questCooldowns).forEach(([questId, lastClick]) => {
        const cooldownTime = 300000; // 5 minutes
        const remaining = Math.max(0, cooldownTime - (now - lastClick));
        if (remaining > 0) {
          updatedTimers[questId] = Math.ceil(remaining / 1000);
        }
      });
      
      setCooldownTimers(updatedTimers);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [questCooldowns]);

  // Load quests (would connect to API in production)
  useEffect(() => {
    if (!userId) return;
    
    // Demo quests (would be fetched from API in production)
    const demoQuests: Quest[] = [
      {
        id: 'quest-1',
        name: 'Signal Discovery',
        description: 'Find hidden signals across the network',
        type: 'story',
        progress: 65,
        total: 100,
        reward: '150 XP + Explorer Badge',
        icon: <Compass size={20} color="#66fcf1" />,
      },
      {
        id: 'quest-2',
        name: 'Digital Pathfinder',
        description: 'Connect with 3 different FSN AI agents',
        type: 'story',
        progress: 2,
        total: 3,
        reward: '100 XP + Networker Badge',
        icon: <Search size={20} color="#66fcf1" />,
      },
      {
        id: 'quest-3',
        name: 'Daily Communication',
        description: 'Send a message to any FSN agent today',
        type: 'daily',
        progress: 0,
        total: 1,
        reward: '25 XP',
        icon: <MessageSquare size={20} color="#66fcf1" />,
        isNew: true,
      },
      {
        id: 'quest-4',
        name: 'Secure Your Data',
        description: 'Upload 5 files to your FSN Vault',
        type: 'achievement',
        progress: 2,
        total: 5,
        reward: '100 XP + Expanded Storage',
        icon: <FileBox size={20} color="#66fcf1" />,
      },
      {
        id: 'quest-5',
        name: 'Identity Mastery',
        description: 'Reach Level 10 with your FSN identity',
        type: 'achievement',
        progress: 300,
        total: 1000,
        reward: '500 XP + Special Hexagon Style',
        icon: <Target size={20} color="#66fcf1" />,
      },
      {
        id: 'quest-6',
        name: 'First Steps',
        description: 'Claim your FSN name and complete onboarding',
        type: 'story',
        progress: 100,
        total: 100,
        reward: '50 XP',
        icon: <Award size={20} color="#66fcf1" />,
        completed: true,
      },
    ];
    
    setQuests(demoQuests);
  }, [userId]);
  
  // Filter quests based on selected filter
  const filteredQuests = quests.filter(quest => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'active') return !quest.completed;
    if (activeFilter === 'completed') return quest.completed;
    if (activeFilter === 'daily') return quest.type === 'daily';
    if (activeFilter === 'story') return quest.type === 'story';
    if (activeFilter === 'achievement') return quest.type === 'achievement';
    return true;
  });

  // Handle quest click
  const handleQuestClick = (quest: Quest) => {
    // Check for cooldown on Signal Discovery quest
    if (quest.name === 'Signal Discovery') {
      const now = Date.now();
      const lastClick = questCooldowns[quest.id] || 0;
      const cooldownTime = 300000; // 5 minutes
      
      if (now - lastClick < cooldownTime) {
        const remainingMinutes = Math.ceil((cooldownTime - (now - lastClick)) / 60000);
        setSelectedQuest({
          ...quest,
          description: `Quest progress is tracked by actual platform usage. Manual progress updates are limited to prevent exploitation. Try again in ${remainingMinutes} minutes, or progress naturally by using vault, messaging, and other features.`
        });
        setShowQuestModal(true);
        return;
      }
      
      // Update cooldown and show guidance
      setQuestCooldowns(prev => ({ ...prev, [quest.id]: now }));
      
      setSelectedQuest({
        ...quest,
        description: 'Great! You can progress this quest by exploring FSN features: message AI agents, upload files to vault, or interact with different dashboard sections. Real engagement is rewarded!'
      });
      setShowQuestModal(true);
      return;
    }
    
    setSelectedQuest(quest);
    setShowQuestModal(true);
  };

  // Start quest action - actually take users to complete the quest
  const handleStartQuest = (questId: string) => {
    const quest = quests.find(q => q.id === questId);
    if (!quest) return;

    setShowQuestModal(false);
    
    // Route users to the appropriate section based on quest type
    if (quest.name === 'Daily Communication') {
      // Take user to chat section with helpful tip
      alert('Great! Heading to the Chat section where you can message any FSN AI agent like core.fsn, ghost.fsn, vault.fsn, forge.fsn, or echo.fsn to complete this quest!');
      if (window.location.pathname.includes('enhanced-dashboard')) {
        window.location.hash = '#chat';
        setTimeout(() => {
          const chatTab = document.querySelector('[data-tab="chat"]') as HTMLButtonElement;
          if (chatTab) chatTab.click();
        }, 100);
      } else {
        window.location.href = '/enhanced-dashboard#chat';
      }
    } else if (quest.name === 'Secure Your Data') {
      // Take user to vault section with helpful tip
      alert('Excellent! Taking you to the FSN Vault where you can upload files to complete this quest. Upload any 5 files to reach your goal!');
      if (window.location.pathname.includes('enhanced-dashboard')) {
        window.location.hash = '#vault';
        setTimeout(() => {
          const vaultTab = document.querySelector('[data-tab="vault"]') as HTMLButtonElement;
          if (vaultTab) vaultTab.click();
        }, 100);
      } else {
        window.location.href = '/enhanced-dashboard#vault';
      }
    } else if (quest.name === 'Digital Pathfinder') {
      // Take user to chat to connect with AI agents
      // Show quest guidance via modal instead of alert
      setSelectedQuest({
        ...quest,
        description: 'Perfect! Going to the Chat section where you can connect with different FSN AI agents. Try messaging core.fsn, ghost.fsn, and vault.fsn to complete this quest!'
      });
      setShowQuestModal(true);
      if (window.location.pathname.includes('enhanced-dashboard')) {
        window.location.hash = '#chat';
        setTimeout(() => {
          const chatTab = document.querySelector('[data-tab="chat"]') as HTMLButtonElement;
          if (chatTab) chatTab.click();
        }, 100);
      } else {
        window.location.href = '/enhanced-dashboard#chat';
      }
    } else if (quest.name === 'Signal Discovery') {
      // Signal Discovery quest guidance - cooldown is handled in handleQuestClick
      setSelectedQuest({
        ...quest,
        description: 'Awesome! This quest involves exploring the network and discovering hidden signals. Continue using the platform - visit different sections, interact with AI agents, and upload files to progress!'
      });
      setShowQuestModal(true);
    } else {
      // For other quests, update progress
      setQuests(prevQuests => 
        prevQuests.map(q => 
          q.id === questId ? { ...q, progress: Math.min(q.progress + 1, q.total) } : q
        )
      );
    }
  };

  // Complete quest action
  const handleCompleteQuest = (questId: string) => {
    setQuests(prevQuests => 
      prevQuests.map(q => 
        q.id === questId ? { ...q, progress: q.total, completed: true } : q
      )
    );
    setShowQuestModal(false);
  };
  
  return (
    <div className="quest-card">
      <div className="quest-header">
        <div className="quest-title">
          <Shield className="quest-title-icon" size={18} />
          <span>FSN Quests</span>
        </div>
        <div className="quest-filters">
          <select 
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            className="quest-filter-select"
          >
            <option value="all">All Quests</option>
            <option value="active">Active</option>
            <option value="daily">Daily</option>
            <option value="story">Story</option>
            <option value="achievement">Achievements</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>
      
      <div className="quest-list">
        {filteredQuests.length === 0 ? (
          <div className="empty-quests">
            <p>No quests found</p>
          </div>
        ) : (
          filteredQuests.map(quest => (
            <div 
              key={quest.id}
              className={`quest-item ${quest.completed ? 'completed' : ''} ${quest.isNew ? 'new-quest' : ''} ${cooldownTimers[quest.id] ? 'on-cooldown' : ''} clickable`}
              onClick={() => handleQuestClick(quest)}
            >
              <div className="quest-icon">
                {quest.icon}
              </div>
              
              <div className="quest-content">
                <div className="quest-name">
                  {quest.name}
                  {quest.isNew && <span className="quest-new-tag">NEW</span>}
                </div>
                
                <div className="quest-description">{quest.description}</div>
                
                {!quest.completed ? (
                  <>
                    <div className="quest-progress-bar">
                      <div 
                        className="quest-progress-fill" 
                        style={{ width: `${(quest.progress / quest.total) * 100}%` }}
                      ></div>
                    </div>
                    
                    <div className="quest-stats">
                      <span className="quest-completion">
                        {quest.progress} / {quest.total} {quest.total === 1 ? 'Task' : 'Steps'}
                      </span>
                      <span className="quest-reward">{quest.reward}</span>
                      {cooldownTimers[quest.id] && (
                        <div className="quest-cooldown">
                          <span className="cooldown-timer">
                            🕒 {Math.floor(cooldownTimers[quest.id] / 60)}:{(cooldownTimers[quest.id] % 60).toString().padStart(2, '0')}
                          </span>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="quest-completed-status">
                    <span className="quest-completed-text">Completed</span>
                    <span className="quest-reward">{quest.reward} earned</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
      
      <div className="quest-footer">
        <div className="quest-info">
          <div className="quest-count">
            <span className="active-count">{quests.filter(q => !q.completed).length}</span> active quests
          </div>
          <div className="quest-xp-summary">
            <span className="xp-available">
              {quests.filter(q => !q.completed).reduce((total, quest) => {
                const xpMatch = quest.reward.match(/(\d+) XP/);
                return total + (xpMatch ? parseInt(xpMatch[1]) : 0);
              }, 0)} XP
            </span> available
          </div>
        </div>
      </div>

      {/* Quest Modal */}
      {showQuestModal && selectedQuest && (
        <div className="quest-modal-overlay" onClick={() => setShowQuestModal(false)}>
          <div className="quest-modal" onClick={(e) => e.stopPropagation()}>
            <div className="quest-modal-header">
              <div className="quest-modal-icon">
                {selectedQuest.icon}
              </div>
              <div className="quest-modal-title">
                <h3>{selectedQuest.name}</h3>
                <span className={`quest-type-badge ${selectedQuest.type}`}>
                  {selectedQuest.type.charAt(0).toUpperCase() + selectedQuest.type.slice(1)}
                </span>
              </div>
              <button 
                className="quest-modal-close"
                onClick={() => setShowQuestModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="quest-modal-content">
              <p className="quest-modal-description">{selectedQuest.description}</p>
              
              {!selectedQuest.completed ? (
                <>
                  <div className="quest-modal-progress">
                    <div className="quest-modal-progress-bar">
                      <div 
                        className="quest-modal-progress-fill" 
                        style={{ width: `${(selectedQuest.progress / selectedQuest.total) * 100}%` }}
                      ></div>
                    </div>
                    <span className="quest-modal-progress-text">
                      {selectedQuest.progress} / {selectedQuest.total} completed
                    </span>
                  </div>
                  
                  <div className="quest-modal-reward">
                    <strong>Reward: </strong>{selectedQuest.reward}
                  </div>
                  
                  <div className="quest-modal-actions">
                    {selectedQuest.progress === 0 ? (
                      <button 
                        className="quest-start-btn"
                        onClick={() => handleStartQuest(selectedQuest.id)}
                      >
                        Start Quest
                      </button>
                    ) : selectedQuest.progress < selectedQuest.total ? (
                      <button 
                        className="quest-continue-btn"
                        onClick={() => handleStartQuest(selectedQuest.id)}
                      >
                        Continue Quest
                      </button>
                    ) : (
                      <button 
                        className="quest-complete-btn"
                        onClick={() => handleCompleteQuest(selectedQuest.id)}
                      >
                        Claim Reward
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <div className="quest-modal-completed">
                  <div className="quest-completed-badge">✓ Completed</div>
                  <div className="quest-modal-reward">
                    <strong>Earned: </strong>{selectedQuest.reward}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestSystem;