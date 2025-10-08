import React, { useState, useEffect } from 'react';
import { useXP } from '../context/XPContext';
import XPProfileModal from './XPProfileModal';

const XPLeaderboard = ({ isOpen, onClose }) => {
  const { xpPoints, level } = useXP();
  const [sortMode, setSortMode] = useState('all-time');
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  // Comprehensive leaderboard data with more realistic FSN usernames and detailed metrics
  const leaderboardData = [
    { username: "sentinel_2047.fsn", xp: 12000, level: 8, signalCasts: 156, weeklyXP: 2800, vaultActions: 89, nftUploads: 23, secureMessages: 245 },
    { username: "archivist_alpha.fsn", xp: 9850, level: 7, signalCasts: 134, weeklyXP: 2100, vaultActions: 167, nftUploads: 45, secureMessages: 189 },
    { username: "cipher_nexus.fsn", xp: 8420, level: 6, signalCasts: 189, weeklyXP: 3200, vaultActions: 56, nftUploads: 12, secureMessages: 298 },
    { username: "quantum_drift.fsn", xp: 7200, level: 5, signalCasts: 98, weeklyXP: 1800, vaultActions: 134, nftUploads: 31, secureMessages: 156 },
    { username: "neural_echo.fsn", xp: 6500, level: 5, signalCasts: 223, weeklyXP: 2400, vaultActions: 67, nftUploads: 8, secureMessages: 203 },
    { username: "void_walker.fsn", xp: 5800, level: 4, signalCasts: 87, weeklyXP: 1600, vaultActions: 98, nftUploads: 19, secureMessages: 145 },
    { username: "data_ghost.fsn", xp: 5200, level: 4, signalCasts: 145, weeklyXP: 1900, vaultActions: 78, nftUploads: 15, secureMessages: 167 },
    { username: "code_sage.fsn", xp: 4900, level: 4, signalCasts: 76, weeklyXP: 1400, vaultActions: 112, nftUploads: 26, secureMessages: 134 },
    { username: "neon_blade.fsn", xp: 4400, level: 3, signalCasts: 112, weeklyXP: 1200, vaultActions: 45, nftUploads: 9, secureMessages: 123 },
    { username: "flux_rider.fsn", xp: 4100, level: 3, signalCasts: 67, weeklyXP: 1100, vaultActions: 89, nftUploads: 17, secureMessages: 98 },
    { username: "shadow_mint.fsn", xp: 3800, level: 3, signalCasts: 54, weeklyXP: 950, vaultActions: 67, nftUploads: 21, secureMessages: 87 },
    { username: "pulse_forge.fsn", xp: 3500, level: 3, signalCasts: 89, weeklyXP: 880, vaultActions: 34, nftUploads: 7, secureMessages: 76 },
    { username: "echo_storm.fsn", xp: 3200, level: 2, signalCasts: 43, weeklyXP: 750, vaultActions: 56, nftUploads: 12, secureMessages: 67 },
    { username: "cyber_hex.fsn", xp: 2900, level: 2, signalCasts: 38, weeklyXP: 680, vaultActions: 45, nftUploads: 9, secureMessages: 54 },
    { username: "grid_phantom.fsn", xp: 2600, level: 2, signalCasts: 29, weeklyXP: 620, vaultActions: 34, nftUploads: 6, secureMessages: 43 },
    { username: "byte_hunter.fsn", xp: 2300, level: 2, signalCasts: 25, weeklyXP: 560, vaultActions: 28, nftUploads: 5, secureMessages: 38 },
    { username: "signal_drift.fsn", xp: 2000, level: 2, signalCasts: 34, weeklyXP: 480, vaultActions: 23, nftUploads: 4, secureMessages: 29 },
    { username: "matrix_link.fsn", xp: 1800, level: 1, signalCasts: 18, weeklyXP: 420, vaultActions: 19, nftUploads: 3, secureMessages: 25 },
    { username: "trace_vector.fsn", xp: 1600, level: 1, signalCasts: 22, weeklyXP: 380, vaultActions: 16, nftUploads: 2, secureMessages: 18 },
    { username: "node_keeper.fsn", xp: 1400, level: 1, signalCasts: 15, weeklyXP: 340, vaultActions: 14, nftUploads: 1, secureMessages: 15 },
    { username: "user.fsn", xp: 865, level: 1, signalCasts: 12, weeklyXP: 280, vaultActions: 17, nftUploads: 8, secureMessages: 28 }
  ];

  // Get sorted data based on current mode
  const getSortedData = () => {
    const data = [...leaderboardData];
    switch(sortMode) {
      case 'weekly':
        return data.sort((a, b) => b.weeklyXP - a.weeklyXP);
      case 'signals':
        return data.sort((a, b) => b.signalCasts - a.signalCasts);
      default:
        return data.sort((a, b) => b.xp - a.xp);
    }
  };

  const sortedData = getSortedData();
  
  // Add rank numbers to sorted data
  const rankedData = sortedData.map((user, index) => ({
    ...user,
    rank: index + 1
  }));

  // Find current user and their rank
  useEffect(() => {
    if (isOpen) {
      const user = rankedData.find(u => u.username === 'user.fsn');
      setCurrentUser(user);
    }
  }, [sortMode, isOpen]);

  if (!isOpen) return null;

  const getRankIcon = (rank) => {
    switch(rank) {
      case 1: return "🥇";
      case 2: return "🥈"; 
      case 3: return "🥉";
      default: return `#${rank}`;
    }
  };

  const getRankGlow = (rank) => {
    switch(rank) {
      case 1: return "rank-gold";
      case 2: return "rank-silver";
      case 3: return "rank-bronze";
      default: return "";
    }
  };

  const getDisplayValue = (user) => {
    switch(sortMode) {
      case 'weekly':
        return `${user.weeklyXP.toLocaleString()} XP`;
      case 'signals':
        return `${user.signalCasts} Casts`;
      default:
        return `${user.xp.toLocaleString()} XP`;
    }
  };

  // Get top 10 users for main display
  const topUsers = rankedData.slice(0, 10);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(5px)'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
        border: '2px solid #00f0ff',
        borderRadius: '20px',
        width: '90%',
        maxWidth: '600px',
        maxHeight: '80vh',
        overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0, 240, 255, 0.3)',
        fontFamily: 'Orbitron, sans-serif',
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px 25px',
          borderBottom: '1px solid #00f0ff',
          background: 'rgba(0, 240, 255, 0.05)'
        }}>
          <div>
            <h2 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#00f0ff',
              margin: 0,
              textShadow: '0 0 20px rgba(0, 240, 255, 0.5)'
            }}>🏆 XP LEADERBOARD</h2>
            <div style={{
              fontSize: '14px',
              color: '#888',
              margin: '5px 0 0 0'
            }}>Top FSN Network Users</div>
          </div>
          <button 
            onClick={() => onClose()}
            style={{
              background: 'none',
              border: 'none',
              color: '#00f0ff',
              cursor: 'pointer',
              padding: '5px',
              borderRadius: '5px',
              transition: 'all 0.3s ease',
              fontSize: '20px'
            }}
          >
            ✕
          </button>
        </div>

        {/* Sort Tabs */}
        <div style={{
          display: 'flex',
          padding: '15px 25px',
          gap: '10px',
          borderBottom: '1px solid rgba(0, 240, 255, 0.2)'
        }}>
          <button 
            onClick={() => setSortMode('all-time')}
            style={{
              background: sortMode === 'all-time' ? 'linear-gradient(135deg, #00f0ff, #0080ff)' : 'rgba(0, 240, 255, 0.1)',
              color: sortMode === 'all-time' ? '#000' : '#00f0ff',
              border: `1px solid ${sortMode === 'all-time' ? '#00f0ff' : 'rgba(0, 240, 255, 0.3)'}`,
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '12px',
              fontFamily: 'Orbitron, sans-serif',
              transition: 'all 0.3s ease',
              fontWeight: sortMode === 'all-time' ? 'bold' : 'normal'
            }}
          >
            🥇 All-Time
          </button>
          <button 
            onClick={() => setSortMode('weekly')}
            style={{
              background: sortMode === 'weekly' ? 'linear-gradient(135deg, #00f0ff, #0080ff)' : 'rgba(0, 240, 255, 0.1)',
              color: sortMode === 'weekly' ? '#000' : '#00f0ff',
              border: `1px solid ${sortMode === 'weekly' ? '#00f0ff' : 'rgba(0, 240, 255, 0.3)'}`,
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '12px',
              fontFamily: 'Orbitron, sans-serif',
              transition: 'all 0.3s ease',
              fontWeight: sortMode === 'weekly' ? 'bold' : 'normal'
            }}
          >
            🔥 Weekly
          </button>
          <button 
            onClick={() => setSortMode('signals')}
            style={{
              background: sortMode === 'signals' ? 'linear-gradient(135deg, #00f0ff, #0080ff)' : 'rgba(0, 240, 255, 0.1)',
              color: sortMode === 'signals' ? '#000' : '#00f0ff',
              border: `1px solid ${sortMode === 'signals' ? '#00f0ff' : 'rgba(0, 240, 255, 0.3)'}`,
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '12px',
              fontFamily: 'Orbitron, sans-serif',
              transition: 'all 0.3s ease',
              fontWeight: sortMode === 'signals' ? 'bold' : 'normal'
            }}
          >
            🧠 Most Signal Casts
          </button>
        </div>

        {/* Leaderboard Content */}
        <div style={{
          padding: '0 25px',
          maxHeight: '400px',
          overflowY: 'auto'
        }}>
          {/* Top Users */}
          {topUsers.map((user, index) => (
            <div key={user.username} style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px 0',
              borderBottom: '1px solid rgba(0, 240, 255, 0.1)',
              background: user.rank <= 3 ? 
                (user.rank === 1 ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(0, 240, 255, 0.1))' :
                 user.rank === 2 ? 'linear-gradient(135deg, rgba(192, 192, 192, 0.1), rgba(0, 240, 255, 0.1))' :
                 'linear-gradient(135deg, rgba(205, 127, 50, 0.1), rgba(0, 240, 255, 0.1))') : 
                'transparent',
              borderRadius: '8px',
              margin: '5px 0',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = user.rank <= 3 ? 
                (user.rank === 1 ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(0, 240, 255, 0.2))' :
                 user.rank === 2 ? 'linear-gradient(135deg, rgba(192, 192, 192, 0.2), rgba(0, 240, 255, 0.2))' :
                 'linear-gradient(135deg, rgba(205, 127, 50, 0.2), rgba(0, 240, 255, 0.2))') : 
                'rgba(0, 240, 255, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = user.rank <= 3 ? 
                (user.rank === 1 ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(0, 240, 255, 0.1))' :
                 user.rank === 2 ? 'linear-gradient(135deg, rgba(192, 192, 192, 0.1), rgba(0, 240, 255, 0.1))' :
                 'linear-gradient(135deg, rgba(205, 127, 50, 0.1), rgba(0, 240, 255, 0.1))') : 
                'transparent';
            }}
            >
              {/* Rank */}
              <div style={{
                fontSize: '18px',
                fontWeight: 'bold',
                color: user.rank <= 3 ? '#ffd700' : '#00f0ff',
                width: '50px',
                textAlign: 'center'
              }}>
                {getRankIcon(user.rank)}
              </div>
              
              {/* User Info */}
              <div style={{ flex: 1, marginLeft: '15px' }}>
                <div style={{
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: '#00f0ff',
                  marginBottom: '2px'
                }}>
                  {user.username}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#888'
                }}>
                  Lvl {user.level}
                </div>
              </div>
              
              {/* XP/Stats */}
              <div style={{
                fontSize: '14px',
                fontWeight: 'bold',
                color: '#00f0ff',
                textAlign: 'right',
                marginRight: '15px'
              }}>
                {getDisplayValue(user)}
              </div>
              
              {/* Signal Icon */}
              <div style={{
                width: '30px',
                height: '30px',
                background: 'rgba(0, 240, 255, 0.1)',
                border: '1px solid #00f0ff',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                marginRight: '10px',
                cursor: 'pointer'
              }}>
                📡
              </div>
              
              {/* View Button */}
              <button 
                onClick={() => setSelectedUser(user)}
                style={{
                  background: 'rgba(0, 240, 255, 0.1)',
                  border: '1px solid #00f0ff',
                  color: '#00f0ff',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '10px',
                  fontFamily: 'Orbitron, sans-serif',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 240, 255, 0.2)';
                  e.currentTarget.style.boxShadow = '0 0 10px rgba(0, 240, 255, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 240, 255, 0.1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                View
              </button>
            </div>
          ))}
          
          {/* Current User Row (if not in top 10) */}
          {currentUser && currentUser.rank > 10 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px 0',
              borderTop: '2px solid #ffd700',
              marginTop: '15px',
              background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(0, 240, 255, 0.1))',
              borderRadius: '8px',
              border: '2px solid #ffd700',
              boxShadow: '0 0 15px rgba(255, 215, 0, 0.3)'
            }}>
              {/* Rank */}
              <div style={{
                fontSize: '18px',
                fontWeight: 'bold',
                color: '#ffd700',
                width: '50px',
                textAlign: 'center'
              }}>
                #{currentUser.rank}
              </div>
              
              {/* User Info */}
              <div style={{ flex: 1, marginLeft: '15px' }}>
                <div style={{
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: '#ffd700',
                  marginBottom: '2px'
                }}>
                  YOU • {currentUser.username}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#888'
                }}>
                  Lvl {currentUser.level}
                </div>
              </div>
              
              {/* XP/Stats */}
              <div style={{
                fontSize: '14px',
                fontWeight: 'bold',
                color: '#ffd700',
                textAlign: 'right',
                marginRight: '15px'
              }}>
                {getDisplayValue(currentUser)}
              </div>
              
              {/* Signal Icon */}
              <div style={{
                width: '30px',
                height: '30px',
                background: 'rgba(255, 215, 0, 0.1)',
                border: '1px solid #ffd700',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                marginRight: '10px',
                cursor: 'pointer'
              }}>
                📡
              </div>
              
              {/* View Button */}
              <button 
                onClick={() => setSelectedUser(currentUser)}
                style={{
                  background: 'rgba(255, 215, 0, 0.1)',
                  border: '1px solid #ffd700',
                  color: '#ffd700',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '10px',
                  fontFamily: 'Orbitron, sans-serif',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 215, 0, 0.2)';
                  e.currentTarget.style.boxShadow = '0 0 10px rgba(255, 215, 0, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 215, 0, 0.1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                View
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* XP Profile Modal */}
      {selectedUser && (
        <XPProfileModal 
          user={selectedUser} 
          onClose={() => setSelectedUser(null)} 
        />
      )}
    </div>
  );
};

export default XPLeaderboard;