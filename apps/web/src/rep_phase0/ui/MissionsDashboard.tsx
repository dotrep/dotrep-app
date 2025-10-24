import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useLocation } from 'wouter';
import './missions.css';

interface Mission {
  slug: string;
  title: string;
  description: string;
  xp: number;
  status: 'locked' | 'available' | 'completed';
  updatedAt: string | null;
  meta: any;
  gatedBy: string[];
}

interface MissionState {
  missions: Mission[];
  totalXP: number;
}

export default function MissionsDashboard() {
  const [, setLocation] = useLocation();
  const { address, isConnected } = useAccount();
  const [state, setState] = useState<MissionState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [completingMission, setCompletingMission] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthAndLoadMissions();
  }, [isConnected, address]);

  const checkAuthAndLoadMissions = async () => {
    setLoading(true);
    try {
      // Check if user has a valid session
      const sessionRes = await fetch('/api/auth/me', {
        credentials: 'include',
      });

      if (!sessionRes.ok) {
        console.log('[MISSIONS] No session found, redirecting to claim');
        setLocation('/claim');
        return;
      }

      const sessionData = await sessionRes.json();
      const walletAddress = address?.toLowerCase() || sessionData.address?.toLowerCase();
      
      if (!walletAddress) {
        console.log('[MISSIONS] No wallet address, redirecting to claim');
        setLocation('/claim');
        return;
      }

      // Check if user has a claimed .rep name
      const lookupRes = await fetch(`/api/rep/lookup-wallet?address=${encodeURIComponent(walletAddress)}`, {
        credentials: 'include',
      });

      const lookupData = await lookupRes.json();

      if (!lookupData.ok || !lookupData.walletFound) {
        console.log('[MISSIONS] No .rep found, redirecting to claim');
        setLocation('/claim');
        return;
      }

      // User is authenticated and has a .rep name
      setIsAuthenticated(true);
      
      // Record heartbeat and load missions
      await recordHeartbeat();
      await loadState();
    } catch (error) {
      console.error('[MISSIONS] Auth check error:', error);
      setLocation('/claim');
    } finally {
      setLoading(false);
    }
  };

  const recordHeartbeat = async () => {
    try {
      await fetch('/api/rep_phase0/heartbeat', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (e) {
      console.error('Failed to record heartbeat:', e);
    }
  };

  const loadState = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/rep_phase0/state', {
        credentials: 'include',
      });
      
      if (!res.ok) {
        throw new Error('Failed to load mission state');
      }
      
      const data = await res.json();
      setState(data.state);
    } catch (e: any) {
      setError(e.message || 'Failed to load missions');
    } finally {
      setLoading(false);
    }
  };

  const completeMission = async (slug: string) => {
    setCompletingMission(slug);
    try {
      const res = await fetch('/api/rep_phase0/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'complete',
          mission: slug,
        }),
        credentials: 'include',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to complete mission');
      }

      await loadState();
    } catch (e: any) {
      alert(e.message || 'Failed to complete mission');
    } finally {
      setCompletingMission(null);
    }
  };

  if (loading) {
    return (
      <div className="missions-container">
        <div className="missions-loading">Loading missions...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="missions-container">
        <div className="missions-loading">Checking authentication...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="missions-container">
        <div className="missions-error">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={loadState} className="missions-retry-btn">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!state) {
    return null;
  }

  const maxXP = 240;
  const xpPercentage = Math.min((state.totalXP / maxXP) * 100, 100);

  return (
    <div className="missions-container">
      <header className="missions-header">
        <h1>Phase 0 Missions</h1>
        <div className="missions-xp-display">
          <div className="missions-xp-bar">
            <div
              className="missions-xp-fill"
              style={{ width: `${xpPercentage}%` }}
            />
          </div>
          <div className="missions-xp-text">
            {state.totalXP} / {maxXP} XP
          </div>
        </div>
      </header>

      <div className="missions-grid">
        {state.missions.map((mission) => (
          <div
            key={mission.slug}
            className={`mission-card mission-${mission.status}`}
          >
            <div className="mission-header">
              <h3 className="mission-title">{mission.title}</h3>
              <div className="mission-xp">+{mission.xp} XP</div>
            </div>
            
            <p className="mission-description">{mission.description}</p>
            
            {mission.gatedBy.length > 0 && mission.status === 'locked' && (
              <div className="mission-locked-info">
                🔒 Complete "{mission.gatedBy[0]}" first
              </div>
            )}
            
            <div className="mission-footer">
              {mission.status === 'completed' && (
                <div className="mission-completed-badge">✓ Completed</div>
              )}
              
              {mission.status === 'available' && (
                <button
                  onClick={() => completeMission(mission.slug)}
                  disabled={completingMission === mission.slug}
                  className="mission-complete-btn"
                >
                  {completingMission === mission.slug
                    ? 'Completing...'
                    : 'Complete Mission'}
                </button>
              )}
              
              {mission.status === 'locked' && (
                <div className="mission-locked-badge">Locked</div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="missions-footer">
        <p>Complete all missions to earn the full {maxXP} XP!</p>
      </div>
    </div>
  );
}
