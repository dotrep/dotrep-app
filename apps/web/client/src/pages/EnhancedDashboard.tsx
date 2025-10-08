import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { 
  Home, 
  FileBox, 
  MessageSquare, 
  MessageCircle, 
  Wallet, 
  Bell, 
  TrendingUp, 
  Trophy,
  User,
  Shield
} from 'lucide-react';
import SharedNetworkAnimation from '@/components/SharedNetworkAnimation';
import Navigation from '@/components/Navigation';
import FsnHexagon from '@/components/FsnHexagon';
import VaultTab from '@/components/VaultTab';
import FsnMessageTab from '@/components/FsnMessageTab';
import ChatDashboard from '@/components/ChatSystem/ChatDashboard';
import WalletTab from '@/components/WalletTab';
import NotificationSystem from '@/components/NotificationSystem';
import QuestSystem from '@/components/QuestSystem';
import ActivityTracker from '@/components/ActivityTracker';
import StatsDashboard from '@/components/StatsDashboard';
import MessageNotification from '@/components/MessageNotification';
import ProfileCustomization from '@/components/ProfileCustomization';
import SimpleProfileManagement from '@/components/SimpleProfileManagement';

import '../styles/dashboard.css';
import '../styles/vault.css';
import '../styles/fsn-messaging.css';
import '../styles/chat.css';
import '../styles/wallet.css';
import '../styles/dashboard-extensions.css';

/**
 * Enhanced FreeSpace Network Dashboard Page
 * Complete user experience with network animation background,
 * real-time notifications, and interactive components
 */
const EnhancedDashboard: React.FC = () => {
  const [location] = useLocation();
  const [userName, setUserName] = useState<string>('');
  const [userId, setUserId] = useState<number | null>(null);
  const [currentLevel, setCurrentLevel] = useState<number>(1);
  const [currentXP, setCurrentXP] = useState<number>(125);
  const [maxXP, setMaxXP] = useState<number>(300);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [fsnName, setFsnName] = useState<string>('');
  const [vaultBalance, setVaultBalance] = useState<number>(0);
  const [vaultItems, setVaultItems] = useState<any[]>([]);
  const [globalStats, setGlobalStats] = useState({
    totalMembers: 8421,
    totalFSNNames: 6243,
    totalVaultStorage: '2.1TB',
    totalXP: 1847362
  });

  // Enhanced user profile fetching
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/user/profile');
        if (response.ok) {
          const userData = await response.json();
          setUserName(userData.username || 'Anonymous');
          setUserId(userData.id);
          setCurrentLevel(userData.level || 1);
          setCurrentXP(userData.xp || 125);
          setMaxXP((userData.level || 1) * 250);
          setFsnName(userData.fsnName || '');
          
          // Simulate vault balance
          setVaultBalance(245.67);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  // Format number for display
  const formatNumber = (num: number) => {
    return num >= 1000 ? `${(num/1000).toFixed(1)}K` : num;
  };

  console.log('Current activeTab:', activeTab);

  // If vault tab is active, render fullscreen vault directly
  if (activeTab === 'vault') {
    console.log('*** FULLSCREEN VAULT MODE ACTIVE ***');
    const FullscreenVault = React.lazy(() => import('../components/FullscreenVault'));
    return (
      <React.Suspense fallback={<div>Loading...</div>}>
        <FullscreenVault onClose={() => setActiveTab('home')} />
      </React.Suspense>
    );
  }

  return (
    <div className="dashboard-page">
      <Navigation />
      <SharedNetworkAnimation className="network-background" />
      
      {/* Real-time message notification */}
      {/* <MessageNotification /> */}
      
      <div className="dashboard-content">
        {/* Left Sidebar */}
        <div className="dashboard-sidebar">
          {/* Profile Section */}
          <div className="profile-section">
            <div className="profile-avatar">
              <User size={32} />
            </div>
            <div className="profile-info">
              <h3>{userName}</h3>
              <p className="fsn-name">{fsnName || 'Unclaimed FSN'}</p>
              <div className="level-badge">
                Level {currentLevel}
              </div>
            </div>
          </div>

          {/* XP Progress */}
          <div className="xp-section">
            <div className="xp-header">
              <span>Experience Points</span>
              <span>{currentXP}/{maxXP}</span>
            </div>
            <div className="xp-bar">
              <div 
                className="xp-fill" 
                style={{ width: `${(currentXP / maxXP) * 100}%` }}
              />
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="dashboard-tabs">
            <button 
              className={`tab-button ${activeTab === 'overview' || activeTab === 'home' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
              data-tab="overview"
            >
              <Home size={16} style={{ marginRight: '6px' }} />
              Home
            </button>
            <button 
              className={`tab-button ${activeTab === 'vault' ? 'active' : ''}`}
              onClick={() => {
                console.log('VAULT TAB CLICKED - FORCING FULLSCREEN');
                setActiveTab('vault');
              }}
              data-tab="vault"
            >
              <FileBox size={16} style={{ marginRight: '6px' }} />
              FSN Vault
            </button>
            <button 
              className={`tab-button ${activeTab === 'messages' ? 'active' : ''}`}
              onClick={() => setActiveTab('messages')}
              data-tab="messages"
            >
              <MessageSquare size={16} style={{ marginRight: '6px' }} />
              Messages
            </button>
            <button 
              className={`tab-button ${activeTab === 'wallet' ? 'active' : ''}`}
              onClick={() => setActiveTab('wallet')}
              data-tab="wallet"
            >
              <Wallet size={16} style={{ marginRight: '6px' }} />
              Wallet
            </button>
          </div>

          {/* Global Network Stats */}
          <div className="global-stats">
            <h4>Network Status</h4>
            <div className="stat-item">
              <span>Active Members</span>
              <span>{formatNumber(globalStats.totalMembers)}</span>
            </div>
            <div className="stat-item">
              <span>FSN Names</span>
              <span>{formatNumber(globalStats.totalFSNNames)}</span>
            </div>
            <div className="stat-item">
              <span>Total Storage</span>
              <span>{globalStats.totalVaultStorage}</span>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="dashboard-main">
          {(activeTab === 'overview' || activeTab === 'home') && (
            <div className="overview-content">
              <div className="welcome-section">
                <h1>Welcome to FSN Vault, {userName}</h1>
                <p>Your secure gateway to the FreeSpace Network</p>
              </div>

              {/* Feature Grid */}
              <div className="feature-grid">
                <div className="feature-card vault-preview">
                  <div className="feature-icon">
                    <FileBox size={24} />
                  </div>
                  <h3>FSN Vault</h3>
                  <p>Secure file storage with quantum encryption</p>
                  <div className="feature-stats">
                    <span>{vaultItems.length} files stored</span>
                  </div>
                </div>

                <div className="feature-card">
                  <div className="feature-icon">
                    <MessageSquare size={24} />
                  </div>
                  <h3>AI Messaging</h3>
                  <p>Connect with FSN AI agents and community</p>
                  <div className="feature-stats">
                    <span>5 active conversations</span>
                  </div>
                </div>

                <div className="feature-card">
                  <div className="feature-icon">
                    <Wallet size={24} />
                  </div>
                  <h3>Crypto Wallet</h3>
                  <p>Manage your digital assets securely</p>
                  <div className="feature-stats">
                    <span>${vaultBalance.toFixed(2)} balance</span>
                  </div>
                </div>

                <div className="feature-card">
                  <div className="feature-icon">
                    <Trophy size={24} />
                  </div>
                  <h3>Achievements</h3>
                  <p>Track your progress and earn rewards</p>
                  <div className="feature-stats">
                    <span>Level {currentLevel} Sentinel</span>
                  </div>
                </div>
              </div>

              {/* Activity Feed */}
              <div className="activity-section">
                <h3>Recent Activity</h3>
                <div className="activity-feed">
                  <div className="activity-item">
                    <div className="activity-icon">
                      <TrendingUp size={16} />
                    </div>
                    <div className="activity-content">
                      <p>XP gained from vault usage</p>
                      <span className="activity-time">2 minutes ago</span>
                    </div>
                    <div className="activity-value">+25 XP</div>
                  </div>
                  
                  <div className="activity-item">
                    <div className="activity-icon">
                      <FileBox size={16} />
                    </div>
                    <div className="activity-content">
                      <p>File uploaded to vault</p>
                      <span className="activity-time">15 minutes ago</span>
                    </div>
                    <div className="activity-value">+10 XP</div>
                  </div>
                  
                  <div className="activity-item">
                    <div className="activity-icon">
                      <MessageCircle size={16} />
                    </div>
                    <div className="activity-content">
                      <p>Message from core.fsn</p>
                      <span className="activity-time">1 hour ago</span>
                    </div>
                    <div className="activity-value">New</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'messages' && (
            <div className="messages-content">
              <ChatDashboard userId={userId || 0} userFsn={fsnName || 'test2.fsn'} />
            </div>
          )}

          {activeTab === 'wallet' && (
            <div className="wallet-content">
              <WalletTab userId={userId || 0} fsnName={fsnName || 'test2.fsn'} />
            </div>
          )}
        </div>
      </div>

      {/* Notification System */}
      <NotificationSystem />
      
      {/* Quest System */}
      <QuestSystem userId={userId} />
      
      {/* Activity Tracker */}
      <ActivityTracker userId={userId} />
    </div>
  );
};

export default EnhancedDashboard;