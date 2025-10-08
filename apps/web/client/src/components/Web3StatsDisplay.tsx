// Web3-enabled stats display component
import React, { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { useEventDrivenStats } from '../hooks/useEventDrivenStats';

export function Web3StatsDisplay() {
  const { isConnected } = useAccount();
  const stats = useEventDrivenStats();
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Update timestamp when stats change
  useEffect(() => {
    setLastUpdate(new Date());
  }, [stats.xpPoints, stats.level]);

  // Listen for custom events to show real-time updates
  useEffect(() => {
    const handleXPAwarded = (event: CustomEvent) => {
      console.log('XP awarded event detected:', event.detail);
      setLastUpdate(new Date());
    };

    const handleNameRegistered = (event: CustomEvent) => {
      console.log('Name registered event detected:', event.detail);
      setLastUpdate(new Date());
    };

    window.addEventListener('fsn:xpAwarded', handleXPAwarded as EventListener);
    window.addEventListener('fsn:nameRegistered', handleNameRegistered as EventListener);

    return () => {
      window.removeEventListener('fsn:xpAwarded', handleXPAwarded as EventListener);
      window.removeEventListener('fsn:nameRegistered', handleNameRegistered as EventListener);
    };
  }, []);

  if (stats.isLoading) {
    return (
      <div className="stats-display loading">
        <div className="loading-spinner"></div>
        <span>Loading stats...</span>
      </div>
    );
  }

  return (
    <div className="stats-display">
      <div className="stats-grid">
        <div className="stat-item xp">
          <div className="stat-label">
            XP {isConnected ? '(On-Chain)' : '(Database)'}
          </div>
          <div className="stat-value">{stats.xpPoints.toLocaleString()}</div>
          {isConnected && (
            <div className="stat-indicator">🔗</div>
          )}
        </div>
        
        <div className="stat-item level">
          <div className="stat-label">Level</div>
          <div className="stat-value">{stats.level}</div>
        </div>
        
        <div className="stat-item invites">
          <div className="stat-label">Invites</div>
          <div className="stat-value">{stats.invitedCount}</div>
        </div>
      </div>
      
      <div className="last-update">
        Last updated: {lastUpdate.toLocaleTimeString()}
      </div>
      
      <style>{`
        .stats-display {
          background: rgba(10, 25, 41, 0.8);
          border: 1px solid rgba(0, 240, 255, 0.3);
          border-radius: 12px;
          padding: 20px;
          backdrop-filter: blur(10px);
        }
        
        .stats-display.loading {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          color: #66fcf1;
        }
        
        .loading-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid #333;
          border-top: 2px solid #00f0ff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 16px;
          margin-bottom: 16px;
        }
        
        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          position: relative;
        }
        
        .stat-label {
          color: #66fcf1;
          font-size: 12px;
          margin-bottom: 8px;
          font-weight: 500;
        }
        
        .stat-value {
          color: #00f0ff;
          font-size: 24px;
          font-weight: bold;
          text-shadow: 0 0 8px rgba(0, 240, 255, 0.6);
        }
        
        .stat-indicator {
          position: absolute;
          top: -8px;
          right: -8px;
          font-size: 16px;
          background: rgba(34, 197, 94, 0.2);
          border: 1px solid #22c55e;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .xp .stat-value {
          background: linear-gradient(135deg, #00f0ff 0%, #66fcf1 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .last-update {
          text-align: center;
          color: #666;
          font-size: 10px;
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid rgba(0, 240, 255, 0.1);
        }
        
        @media (max-width: 768px) {
          .stats-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
          }
          
          .stat-value {
            font-size: 20px;
          }
          
          .stat-label {
            font-size: 11px;
          }
        }
      `}</style>
    </div>
  );
}