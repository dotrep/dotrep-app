import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { computePulseLevel, getPulseLabel, isPulseActive } from '@/lib/xpEngine';

/**
 * Phase 0 ONLY - Debug Panel
 * Hidden admin panel for debugging user state
 */
const DebugPanel: React.FC = () => {
  const [userStats, setUserStats] = useState<any>(null);
  const [vaultItems, setVaultItems] = useState<any[]>([]);
  const [debugError, setDebugError] = useState<string>('');
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Simple auth check using localStorage
  const userId = localStorage.getItem("fsn_user_id");
  const isAuthenticated = !!userId;

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchDebugData();
  }, [isAuthenticated]);

  const fetchDebugData = async () => {
    try {
      // Fetch user data first
      const userResponse = await fetch(`/api/fsn/user/${userId}`);
      if (userResponse.ok) {
        const userData = await userResponse.json();
        setCurrentUser(userData);
      }

      const statsResponse = await fetch(`/api/user/stats/${userId}`);
      if (statsResponse.ok) {
        const stats = await statsResponse.json();
        setUserStats(stats);
      }

      const vaultResponse = await fetch(`/api/vault/users/${userId}/items`);
      if (vaultResponse.ok) {
        const items = await vaultResponse.json();
        setVaultItems(items);
      }
    } catch (error) {
      setDebugError('Failed to fetch debug data');
      console.error('Debug fetch error:', error);
    }
  };

  // Basic admin check - for Phase 0, allow all authenticated users
  const isAdmin = currentUser?.isAdmin || true;

  if (!isAuthenticated) {
    return (
      <div className="debug-panel">
        <div className="debug-error">Access denied - not authenticated</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="debug-panel">
        <div className="debug-error">Access denied - admin privileges required</div>
      </div>
    );
  }

  const totalXP = userStats?.xpPoints || 0;
  const pulseLevel = computePulseLevel(totalXP);
  const pulseLabel = getPulseLabel(pulseLevel);
  const pulseActive = isPulseActive(totalXP);

  return (
    <div className="debug-panel">
      <div className="debug-header">
        <h1>FSN Debug Panel</h1>
        <p>Phase 0 Development • Admin Only</p>
      </div>

      {debugError && (
        <div className="debug-error">
          {debugError}
        </div>
      )}

      <div className="debug-sections">
        <section className="debug-section">
          <h2>User Information</h2>
          <div className="debug-data">
            <div className="debug-item">
              <span className="debug-label">User ID:</span>
              <span className="debug-value">{currentUser?.id || userId || 'N/A'}</span>
            </div>
            <div className="debug-item">
              <span className="debug-label">Username:</span>
              <span className="debug-value">{currentUser?.username || 'N/A'}</span>
            </div>
            <div className="debug-item">
              <span className="debug-label">FSN Name:</span>
              <span className="debug-value">{currentUser?.fsnName || 'Not claimed'}</span>
            </div>
            <div className="debug-item">
              <span className="debug-label">Admin Status:</span>
              <span className="debug-value">{isAdmin ? 'Yes' : 'No'}</span>
            </div>
          </div>
        </section>

        <section className="debug-section">
          <h2>XP System</h2>
          <div className="debug-data">
            <div className="debug-item">
              <span className="debug-label">Total XP:</span>
              <span className="debug-value">{totalXP}</span>
            </div>
            <div className="debug-item">
              <span className="debug-label">User Level:</span>
              <span className="debug-value">{userStats?.level || 1}</span>
            </div>
            <div className="debug-item">
              <span className="debug-label">Last Active:</span>
              <span className="debug-value">
                {userStats?.lastActive ? new Date(userStats.lastActive).toLocaleString() : 'N/A'}
              </span>
            </div>
          </div>
        </section>

        <section className="debug-section">
          <h2>Pulse Status</h2>
          <div className="debug-data">
            <div className="debug-item">
              <span className="debug-label">Pulse Active:</span>
              <span className={`debug-value ${pulseActive ? 'success' : 'error'}`}>
                {pulseActive ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="debug-item">
              <span className="debug-label">Pulse Level:</span>
              <span className="debug-value">{pulseLevel}</span>
            </div>
            <div className="debug-item">
              <span className="debug-label">Pulse Label:</span>
              <span className="debug-value">{pulseLabel}</span>
            </div>
          </div>
        </section>

        <section className="debug-section">
          <h2>Signal Status</h2>
          <div className="debug-data">
            <div className="debug-item">
              <span className="debug-label">Signal Eligible:</span>
              <span className="debug-value error">Locked (Phase 1)</span>
            </div>
            <div className="debug-item">
              <span className="debug-label">Signal Level:</span>
              <span className="debug-value">N/A</span>
            </div>
          </div>
        </section>

        <section className="debug-section">
          <h2>Vault Contents</h2>
          <div className="debug-data">
            <div className="debug-item">
              <span className="debug-label">Total Files:</span>
              <span className="debug-value">{vaultItems.length}</span>
            </div>
            {vaultItems.length > 0 && (
              <div className="vault-files-debug">
                {vaultItems.map((item, index) => (
                  <div key={item.itemId} className="debug-vault-item">
                    <div className="debug-item">
                      <span className="debug-label">File #{index + 1}:</span>
                      <span className="debug-value">{item.itemId}</span>
                    </div>
                    <div className="debug-item">
                      <span className="debug-label">Created:</span>
                      <span className="debug-value">
                        {new Date(item.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="debug-section">
          <h2>Actions</h2>
          <div className="debug-actions">
            <button 
              className="debug-btn" 
              onClick={fetchDebugData}
            >
              Refresh Data
            </button>
            <button 
              className="debug-btn secondary" 
              onClick={() => window.location.href = '/dashboard'}
            >
              Back to Dashboard
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default DebugPanel;