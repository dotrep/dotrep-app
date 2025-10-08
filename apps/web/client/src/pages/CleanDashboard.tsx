import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { 
  Home, 
  FileBox, 
  MessageSquare, 
  MessageCircle, 
  Wallet, 
  LogOut,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';

// Import the fullscreen vault component
import FullscreenVault from '@/components/FullscreenVault';

// Tab content components
const OverviewTab = () => {
  return (
    <div className="space-y-6">
      {/* Your FSN Identity */}
      <div className="bg-slate-800/50 border border-cyan-500/20 rounded-lg p-6">
        <h3 className="text-cyan-400 text-lg font-medium mb-4">Your FSN Identity</h3>
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">.fsn</span>
          </div>
          <div>
            <div className="text-white font-medium">test2.fsn</div>
            <div className="text-cyan-400 text-sm">● Connected</div>
            <div className="text-gray-400 text-sm">Level 1</div>
          </div>
        </div>
      </div>

      {/* Network Activity */}
      <div className="bg-slate-800/50 border border-cyan-500/20 rounded-lg p-6">
        <h3 className="text-cyan-400 text-lg font-medium mb-4">Network Activity</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-gray-400 text-sm">Uptime</div>
            <div className="text-cyan-400 font-mono">3 days, 7 hours</div>
          </div>
          <div>
            <div className="text-gray-400 text-sm">Connections</div>
            <div className="text-cyan-400 font-mono">24 peers</div>
          </div>
          <div>
            <div className="text-gray-400 text-sm">Bandwidth</div>
            <div className="text-cyan-400 font-mono">4.2 TB used</div>
          </div>
        </div>
      </div>

      {/* Experience Points */}
      <div className="bg-slate-800/50 border border-cyan-500/20 rounded-lg p-6">
        <h3 className="text-cyan-400 text-lg font-medium mb-4">Experience Points</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-white">Level 1</span>
            <span className="text-cyan-400">125 / 300 XP</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full" style={{width: '41%'}}></div>
          </div>
          <div className="text-gray-400 text-sm">41% to Level 2</div>
        </div>
        
        <div className="mt-4 space-y-2">
          <div className="text-sm text-gray-300">How to earn XP:</div>
          <div className="text-xs text-gray-400 space-y-1">
            <div>Complete your profile <span className="text-cyan-400">+50 XP</span></div>
            <div>Connect a wallet <span className="text-cyan-400">+75 XP</span></div>
            <div>Verify your signal <span className="text-cyan-400">+25 XP</span></div>
            <div>Make first transaction <span className="text-cyan-400">+100 XP</span></div>
          </div>
        </div>
      </div>

      {/* Achievement Badges */}
      <div className="bg-slate-800/50 border border-cyan-500/20 rounded-lg p-6">
        <h3 className="text-cyan-400 text-lg font-medium mb-4">Achievement Badges</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-3 p-3 bg-slate-700/50 rounded-lg">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">✓</span>
            </div>
            <div>
              <div className="text-white text-sm font-medium">Explorer</div>
              <div className="text-gray-400 text-xs">Joined the network</div>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-slate-700/50 rounded-lg opacity-50">
            <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
              <span className="text-gray-400 text-xs">○</span>
            </div>
            <div>
              <div className="text-gray-300 text-sm font-medium">Voyager</div>
              <div className="text-gray-500 text-xs">Connections needed</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const MessagesTab = () => {
  return (
    <div className="bg-slate-800/50 border border-cyan-500/20 rounded-lg p-6 h-full">
      <h3 className="text-cyan-400 text-lg font-medium mb-4">FSN Messaging</h3>
      <p className="text-gray-400 text-sm mb-4">Send messages and files securely with your FSN identity.</p>
      
      <div className="space-y-2 mb-4">
        <button className="w-full text-left px-3 py-2 bg-cyan-500/20 text-cyan-400 rounded border border-cyan-500/30">
          Inbox
        </button>
        <button className="w-full text-left px-3 py-2 text-gray-400 hover:bg-slate-700/50 rounded">
          Sent
        </button>
        <button className="w-full text-left px-3 py-2 text-gray-400 hover:bg-slate-700/50 rounded">
          New Message
        </button>
      </div>

      <div className="space-y-4">
        <h4 className="text-white font-medium">Messages Received</h4>
        
        <div className="space-y-3">
          <div className="p-3 bg-slate-700/50 rounded border border-cyan-500/20">
            <div className="flex justify-between items-start mb-2">
              <span className="text-cyan-400 font-medium">core.fsn</span>
              <span className="text-gray-500 text-xs">11 minutes ago</span>
            </div>
            <div className="text-gray-300 text-sm mb-2">
              <span className="bg-gray-700 px-2 py-1 rounded text-xs font-mono mr-2">FLICKERING TERMINAL</span>
              <span className="bg-gray-700 px-2 py-1 rounded text-xs font-mono">||</span>
            </div>
          </div>

          <div className="p-3 bg-slate-700/50 rounded border border-cyan-500/20">
            <div className="flex justify-between items-start mb-2">
              <span className="text-cyan-400 font-medium">core.fsn</span>
              <span className="text-gray-500 text-xs">11 minutes ago</span>
            </div>
            <div className="text-gray-300 text-sm">
              You approach the terminal. It sparks. "Type: 'use terminal'."
            </div>
          </div>

          <div className="p-3 bg-slate-700/50 rounded border border-cyan-500/20">
            <div className="flex justify-between items-start mb-2">
              <span className="text-cyan-400 font-medium">core.fsn</span>
              <span className="text-gray-500 text-xs">32 minutes ago</span>
            </div>
            <div className="text-gray-300 text-sm mb-2">
              <span className="bg-gray-700 px-2 py-1 rounded text-xs font-mono mr-2">████████████</span>
              <span className="text-gray-400">|| You are here --|| ||.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ChatTab = () => {
  return (
    <div className="bg-slate-800/50 border border-cyan-500/20 rounded-lg p-6 h-full">
      <h3 className="text-cyan-400 text-lg font-medium mb-4">Chat</h3>
      <p className="text-gray-400 text-sm">Real-time communication with FSN network participants.</p>
      <div className="mt-8 text-center text-gray-500">
        <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>No active conversations</p>
      </div>
    </div>
  );
};

const WalletTab = () => {
  return (
    <div className="bg-slate-800/50 border border-cyan-500/20 rounded-lg p-6 h-full">
      <h3 className="text-cyan-400 text-lg font-medium mb-4">FSN Wallet</h3>
      <p className="text-gray-400 text-sm mb-6">Send and receive crypto with your FSN identity</p>
      
      <div className="flex space-x-2 mb-6">
        <button className="px-4 py-2 bg-blue-600 text-white rounded">My Addresses</button>
        <button className="px-4 py-2 bg-slate-700 text-gray-300 rounded">Send</button>
        <button className="px-4 py-2 bg-slate-700 text-gray-300 rounded">Receive</button>
        <button className="px-4 py-2 bg-slate-700 text-gray-300 rounded">Transactions</button>
      </div>

      <div className="mb-6">
        <h4 className="text-white font-medium mb-3">Transaction History</h4>
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-3">
            <Wallet className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-400">No transactions yet</p>
          <button className="mt-3 px-4 py-2 bg-blue-600 text-white rounded">
            Make Your First Transaction
          </button>
        </div>
      </div>
    </div>
  );
};

const CleanDashboard: React.FC = () => {
  const [location] = useLocation();
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [showVault, setShowVault] = useState<boolean>(false);

  // Get user profile
  const { data: userProfile } = useQuery({
    queryKey: ['/api/user/profile'],
    retry: false,
  });

  // Handle logout
  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
      localStorage.removeItem('fsn_logged_in');
      localStorage.removeItem('fsn_user_id');
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      window.location.href = '/';
    }
  };

  // Handle vault click - show fullscreen vault
  const handleVaultClick = () => {
    console.log('Opening fullscreen vault...');
    setShowVault(true);
  };

  // Handle vault close
  const handleVaultClose = () => {
    console.log('Closing fullscreen vault...');
    setShowVault(false);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab />;
      case 'messages':
        return <MessagesTab />;
      case 'chat':
        return <ChatTab />;
      case 'wallet':
        return <WalletTab />;
      default:
        return <OverviewTab />;
    }
  };

  // If vault is open, show fullscreen vault
  if (showVault) {
    return <FullscreenVault onClose={handleVaultClose} />;
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Network Background Animation */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"></div>
        <div className="absolute inset-0 opacity-20">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="absolute bg-cyan-400 rounded-full"
              style={{
                width: Math.random() * 3 + 1 + 'px',
                height: Math.random() * 3 + 1 + 'px',
                left: Math.random() * 100 + '%',
                top: Math.random() * 100 + '%',
                animation: `twinkle ${Math.random() * 3 + 2}s infinite`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Top Navigation */}
      <header className="relative z-10 bg-slate-800/80 backdrop-blur-sm border-b border-cyan-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-white">
                <span className="text-cyan-400">FSN Network</span> Dashboard
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-gray-300 text-sm">
                Welcome to your FreeSpace Network control center
              </span>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10">
                  Home
                </Button>
                <Button variant="outline" size="sm" className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10">
                  Dashboard
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleLogout}
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                >
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="mb-8">
          <nav className="flex space-x-8 border-b border-cyan-500/20">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-cyan-400 text-cyan-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={handleVaultClick}
              className="pb-3 px-1 border-b-2 border-transparent font-medium text-sm text-gray-400 hover:text-gray-300 hover:border-gray-300"
            >
              FSN Vault
            </button>
            <button
              onClick={() => setActiveTab('messages')}
              className={`pb-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'messages'
                  ? 'border-cyan-400 text-cyan-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
              }`}
            >
              Messages
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`pb-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'chat'
                  ? 'border-cyan-400 text-cyan-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
              }`}
            >
              Chat
            </button>
            <button
              onClick={() => setActiveTab('wallet')}
              className={`pb-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'wallet'
                  ? 'border-cyan-400 text-cyan-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
              }`}
            >
              Wallet
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="min-h-[600px]">
          {renderTabContent()}
        </div>
      </div>


    </div>
  );
};

export default CleanDashboard;