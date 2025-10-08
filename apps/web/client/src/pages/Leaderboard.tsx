// Leaderboard page with real-time rankings and verification
import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { config } from '../../shared/config';

interface LeaderboardEntry {
  rank: number;
  address: string;
  name: string;
  xpMirror: number;
  streak: number;
  lastSeen: string;
  verified?: boolean;
}

export default function Leaderboard() {
  const { address, isConnected } = useAccount();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [verifyingAddress, setVerifyingAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load leaderboard data
  const loadLeaderboard = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/leaderboard?limit=100');
      const data = await response.json();
      
      if (data.success) {
        setLeaderboard(data.leaderboard);
      } else {
        setError(data.error || 'Failed to load leaderboard');
      }
    } catch (err: any) {
      setError('Network error loading leaderboard');
      console.error('Leaderboard error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Verify on-chain XP for a specific address
  const verifyAddress = async (targetAddress: string) => {
    if (!config.enableEventBadges) return; // Only in PUBLIC mode
    
    try {
      setVerifyingAddress(targetAddress);
      const response = await fetch(`/api/leaderboard/verify/${targetAddress}`);
      const data = await response.json();
      
      if (data.success) {
        // Update leaderboard entry with verification status
        setLeaderboard(prev => prev.map(entry => 
          entry.address === targetAddress 
            ? { ...entry, verified: data.verified }
            : entry
        ));
      }
    } catch (err: any) {
      console.error('Verification error:', err);
    } finally {
      setVerifyingAddress(null);
    }
  };

  useEffect(() => {
    loadLeaderboard();
    
    // Refresh leaderboard every 60 seconds
    const interval = setInterval(loadLeaderboard, 60000);
    return () => clearInterval(interval);
  }, []);

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatTimeAgo = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  if (isLoading && leaderboard.length === 0) {
    return (
      <div className="leaderboard-page">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="leaderboard-page">
      <div className="leaderboard-header">
        <h1>XP Leaderboard</h1>
        <p className="leaderboard-subtitle">
          Top performers by experience points
          {config.enableEventBadges && (
            <span className="verification-note">
              • Click verify to check on-chain totals
            </span>
          )}
        </p>
      </div>

      {error && (
        <div className="error-banner">
          <span>⚠️ {error}</span>
          <button onClick={loadLeaderboard} className="retry-button">
            Retry
          </button>
        </div>
      )}

      <div className="leaderboard-table">
        <div className="table-header">
          <div className="rank-col">Rank</div>
          <div className="name-col">Name</div>
          <div className="xp-col">XP</div>
          <div className="streak-col">Streak</div>
          <div className="activity-col">Last Seen</div>
          {config.enableEventBadges && <div className="verify-col">Verify</div>}
        </div>

        <div className="table-body">
          {leaderboard.map((entry) => (
            <div key={entry.address} className="table-row">
              <div className="rank-col">
                <span className={`rank-badge ${entry.rank <= 3 ? 'top-three' : ''}`}>
                  {entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : `#${entry.rank}`}
                </span>
              </div>
              
              <div className="name-col">
                <span className="user-name">
                  {entry.name || formatAddress(entry.address)}
                </span>
                {entry.address === address && (
                  <span className="you-badge">You</span>
                )}
              </div>
              
              <div className="xp-col">
                <span className="xp-amount">{entry.xpMirror.toLocaleString()}</span>
                {entry.verified === true && (
                  <span className="verified-badge">✓</span>
                )}
                {entry.verified === false && (
                  <span className="unverified-badge">⚠️</span>
                )}
              </div>
              
              <div className="streak-col">
                <span className="streak-badge">{entry.streak} days</span>
              </div>
              
              <div className="activity-col">
                <span className="last-seen">{formatTimeAgo(entry.lastSeen)}</span>
              </div>
              
              {config.enableEventBadges && (
                <div className="verify-col">
                  <button
                    onClick={() => verifyAddress(entry.address)}
                    disabled={verifyingAddress === entry.address}
                    className="verify-button"
                  >
                    {verifyingAddress === entry.address ? '...' : 'Verify'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {leaderboard.length === 0 && !isLoading && (
        <div className="empty-state">
          <p>No leaderboard data available yet.</p>
          <p>Start earning XP to appear on the leaderboard!</p>
        </div>
      )}

      <style>{`
        .leaderboard-page {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }

        .leaderboard-header {
          text-align: center;
          margin-bottom: 30px;
        }

        .leaderboard-header h1 {
          font-size: 2.5rem;
          font-weight: bold;
          background: linear-gradient(135deg, #66fcf1, #00f0ff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 10px;
        }

        .leaderboard-subtitle {
          color: #b0bec5;
          font-size: 1.1rem;
        }

        .verification-note {
          display: block;
          font-size: 0.9rem;
          color: #66fcf1;
          margin-top: 5px;
        }

        .error-banner {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid #ef4444;
          border-radius: 8px;
          padding: 12px 16px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .retry-button {
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 6px 12px;
          cursor: pointer;
          font-size: 0.9rem;
        }

        .loading-state {
          text-align: center;
          padding: 60px 20px;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(102, 252, 241, 0.3);
          border-top: 3px solid #66fcf1;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .leaderboard-table {
          background: rgba(0, 20, 40, 0.8);
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid rgba(102, 252, 241, 0.2);
        }

        .table-header, .table-row {
          display: grid;
          grid-template-columns: 80px 1fr 120px 100px 120px ${config.enableEventBadges ? '100px' : ''};
          gap: 16px;
          padding: 16px 20px;
          align-items: center;
        }

        .table-header {
          background: rgba(102, 252, 241, 0.1);
          font-weight: bold;
          color: #66fcf1;
          border-bottom: 1px solid rgba(102, 252, 241, 0.2);
        }

        .table-row {
          border-bottom: 1px solid rgba(102, 252, 241, 0.1);
          transition: background-color 0.2s;
        }

        .table-row:hover {
          background: rgba(102, 252, 241, 0.05);
        }

        .table-row:last-child {
          border-bottom: none;
        }

        .rank-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          font-weight: bold;
          font-size: 0.9rem;
        }

        .rank-badge.top-three {
          font-size: 1.2rem;
        }

        .rank-badge:not(.top-three) {
          background: rgba(102, 252, 241, 0.1);
          color: #66fcf1;
        }

        .user-name {
          font-weight: 500;
          color: #ffffff;
        }

        .you-badge {
          background: #66fcf1;
          color: #001a2e;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 0.7rem;
          font-weight: bold;
          margin-left: 8px;
        }

        .xp-amount {
          font-weight: bold;
          font-size: 1.1rem;
          color: #66fcf1;
        }

        .verified-badge {
          color: #10b981;
          margin-left: 8px;
          font-size: 1.1rem;
        }

        .unverified-badge {
          color: #f59e0b;
          margin-left: 8px;
          font-size: 1.1rem;
        }

        .streak-badge {
          background: rgba(16, 185, 129, 0.2);
          color: #10b981;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 500;
        }

        .last-seen {
          color: #b0bec5;
          font-size: 0.9rem;
        }

        .verify-button {
          background: rgba(102, 252, 241, 0.1);
          color: #66fcf1;
          border: 1px solid rgba(102, 252, 241, 0.3);
          border-radius: 6px;
          padding: 6px 12px;
          cursor: pointer;
          font-size: 0.8rem;
          transition: all 0.2s;
        }

        .verify-button:hover:not(:disabled) {
          background: rgba(102, 252, 241, 0.2);
          border-color: #66fcf1;
        }

        .verify-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: #b0bec5;
        }

        .empty-state p {
          margin-bottom: 10px;
          font-size: 1.1rem;
        }

        /* Mobile responsiveness */
        @media (max-width: 768px) {
          .leaderboard-page {
            padding: 15px;
          }

          .leaderboard-header h1 {
            font-size: 2rem;
          }

          .table-header, .table-row {
            grid-template-columns: 60px 1fr 80px 80px;
            gap: 12px;
            padding: 12px 15px;
            font-size: 0.9rem;
          }

          .activity-col, .verify-col {
            display: none;
          }

          .rank-badge {
            width: 32px;
            height: 32px;
            font-size: 0.8rem;
          }

          .you-badge {
            display: block;
            margin: 4px 0 0 0;
          }
        }
      `}</style>
    </div>
  );
}