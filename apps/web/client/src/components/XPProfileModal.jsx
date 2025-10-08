import React from 'react';

const XPProfileModal = ({ user, onClose }) => {
  if (!user) return null;

  // Generate archetype based on user's highest activity
  const getArchetype = (user) => {
    const activities = {
      vault: user.vaultActions || 0,
      signal: user.signalCasts || 0,
      nft: user.nftUploads || 0,
      messages: user.secureMessages || 0
    };

    const max = Math.max(...Object.values(activities));
    
    if (activities.signal === max) return { icon: '🛡', name: 'Sentinel', color: '#00f0ff' };
    if (activities.vault === max) return { icon: '📚', name: 'Archivist', color: '#ffd700' };
    if (activities.nft === max) return { icon: '💎', name: 'Collector', color: '#ff6b6b' };
    if (activities.messages === max) return { icon: '🔐', name: 'Guardian', color: '#9d4edd' };
    return { icon: '🧠', name: 'Cipher', color: '#00f0ff' };
  };

  const archetype = getArchetype(user);

  // Generate mock XP gain data for the last 7 days
  const generateXPHistory = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const baseXP = user.xp / 30; // Average daily XP
    
    // Use consistent multipliers based on user ID for deterministic but varied data
    const multipliers = [
      0.8, 0.6, 0.4, 0.7, 0.5, 0.9, 1.0  // Static weekly pattern
    ];
    
    return days.map((day, index) => ({
      day,
      xp: Math.floor(baseXP * multipliers[index])
    }));
  };

  const xpHistory = generateXPHistory();
  const maxXP = Math.max(...xpHistory.map(d => d.xp));

  // Generate user metrics based on their data
  const userMetrics = {
    vaultActions: user.vaultActions || Math.floor(user.xp / 50),
    signalCasts: user.signalCasts || 0,
    nftUploads: user.nftUploads || Math.floor(user.xp / 100),
    secureMessages: user.secureMessages || Math.floor(user.xp / 30)
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 2000,
      backdropFilter: 'blur(8px)',
      animation: 'fadeIn 0.3s ease-in-out'
    }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
      
      <div style={{
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
        border: '2px solid #00f0ff',
        borderRadius: '20px',
        width: '90%',
        maxWidth: '700px',
        maxHeight: '85vh',
        overflow: 'hidden',
        boxShadow: '0 25px 80px rgba(0, 240, 255, 0.4)',
        fontFamily: 'Orbitron, sans-serif',
        position: 'relative',
        animation: 'fadeIn 0.3s ease-in-out'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '25px 30px',
          borderBottom: '1px solid #00f0ff',
          background: 'rgba(0, 240, 255, 0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{
              fontSize: '40px',
              filter: `drop-shadow(0 0 10px ${archetype.color})`
            }}>
              {archetype.icon}
            </div>
            <div>
              <h2 style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#00f0ff',
                margin: 0,
                textShadow: '0 0 20px rgba(0, 240, 255, 0.5)'
              }}>
                {user.username}
              </h2>
              <div style={{
                fontSize: '14px',
                color: archetype.color,
                margin: '3px 0 0 0',
                textShadow: `0 0 10px ${archetype.color}`
              }}>
                {archetype.name} • Level {user.level}
              </div>
            </div>
          </div>
          
          <div style={{
            textAlign: 'right',
            marginRight: '40px'
          }}>
            <div style={{
              fontSize: '28px',
              fontWeight: 'bold',
              color: '#00f0ff',
              textShadow: '0 0 15px rgba(0, 240, 255, 0.6)'
            }}>
              {user.xp.toLocaleString()} XP
            </div>
          </div>
          
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#00f0ff',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '8px',
              transition: 'all 0.3s ease',
              fontSize: '24px',
              lineHeight: 1
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(0, 240, 255, 0.1)';
              e.currentTarget.style.boxShadow = '0 0 15px rgba(0, 240, 255, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={{
          padding: '30px',
          maxHeight: '500px',
          overflowY: 'auto'
        }}>
          {/* XP Gain Graph */}
          <div style={{
            marginBottom: '30px'
          }}>
            <h3 style={{
              color: '#00f0ff',
              fontSize: '18px',
              marginBottom: '15px',
              textShadow: '0 0 10px rgba(0, 240, 255, 0.5)'
            }}>
              📈 Weekly XP Activity
            </h3>
            
            <div style={{
              background: 'rgba(0, 0, 0, 0.6)',
              border: '1px solid rgba(0, 240, 255, 0.3)',
              borderRadius: '12px',
              padding: '20px',
              height: '200px',
              position: 'relative',
              display: 'flex',
              alignItems: 'end',
              gap: '8px'
            }}>
              {xpHistory.map((day, index) => (
                <div key={day.day} style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <div style={{
                    height: `${(day.xp / maxXP) * 120}px`,
                    minHeight: '20px',
                    width: '100%',
                    background: `linear-gradient(180deg, #00f0ff, rgba(0, 240, 255, 0.3))`,
                    borderRadius: '4px',
                    boxShadow: '0 0 10px rgba(0, 240, 255, 0.4)',
                    position: 'relative',
                    transition: 'all 0.3s ease'
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: '-25px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      fontSize: '10px',
                      color: '#00f0ff',
                      fontWeight: 'bold',
                      opacity: 0,
                      transition: 'opacity 0.3s ease'
                    }}>
                      {day.xp}
                    </div>
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#888',
                    fontWeight: 'bold'
                  }}>
                    {day.day}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Horizontal Divider */}
          <div style={{
            height: '1px',
            background: 'linear-gradient(90deg, transparent, #00f0ff, transparent)',
            margin: '30px 0',
            boxShadow: '0 0 10px rgba(0, 240, 255, 0.3)'
          }}></div>

          {/* User Metrics */}
          <div>
            <h3 style={{
              color: '#00f0ff',
              fontSize: '18px',
              marginBottom: '20px',
              textShadow: '0 0 10px rgba(0, 240, 255, 0.5)'
            }}>
              📊 Activity Metrics
            </h3>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '15px'
            }}>
              <div style={{
                background: 'rgba(0, 240, 255, 0.05)',
                border: '1px solid rgba(0, 240, 255, 0.3)',
                borderRadius: '12px',
                padding: '18px',
                textAlign: 'center',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0, 240, 255, 0.1)';
                e.currentTarget.style.boxShadow = '0 0 15px rgba(0, 240, 255, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(0, 240, 255, 0.05)';
                e.currentTarget.style.boxShadow = 'none';
              }}>
                <div style={{
                  fontSize: '24px',
                  marginBottom: '5px'
                }}>🗃️</div>
                <div style={{
                  fontSize: '20px',
                  fontWeight: 'bold',
                  color: '#00f0ff',
                  marginBottom: '3px'
                }}>
                  {userMetrics.vaultActions}
                </div>
                <div style={{
                  fontSize: '11px',
                  color: '#888'
                }}>
                  Vault Actions
                </div>
              </div>

              <div style={{
                background: 'rgba(0, 240, 255, 0.05)',
                border: '1px solid rgba(0, 240, 255, 0.3)',
                borderRadius: '12px',
                padding: '18px',
                textAlign: 'center',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0, 240, 255, 0.1)';
                e.currentTarget.style.boxShadow = '0 0 15px rgba(0, 240, 255, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(0, 240, 255, 0.05)';
                e.currentTarget.style.boxShadow = 'none';
              }}>
                <div style={{
                  fontSize: '24px',
                  marginBottom: '5px'
                }}>📡</div>
                <div style={{
                  fontSize: '20px',
                  fontWeight: 'bold',
                  color: '#00f0ff',
                  marginBottom: '3px'
                }}>
                  {userMetrics.signalCasts}
                </div>
                <div style={{
                  fontSize: '11px',
                  color: '#888'
                }}>
                  Signal Casts
                </div>
              </div>

              <div style={{
                background: 'rgba(0, 240, 255, 0.05)',
                border: '1px solid rgba(0, 240, 255, 0.3)',
                borderRadius: '12px',
                padding: '18px',
                textAlign: 'center',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0, 240, 255, 0.1)';
                e.currentTarget.style.boxShadow = '0 0 15px rgba(0, 240, 255, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(0, 240, 255, 0.05)';
                e.currentTarget.style.boxShadow = 'none';
              }}>
                <div style={{
                  fontSize: '24px',
                  marginBottom: '5px'
                }}>🎨</div>
                <div style={{
                  fontSize: '20px',
                  fontWeight: 'bold',
                  color: '#00f0ff',
                  marginBottom: '3px'
                }}>
                  {userMetrics.nftUploads}
                </div>
                <div style={{
                  fontSize: '11px',
                  color: '#888'
                }}>
                  NFT Uploads
                </div>
              </div>

              <div style={{
                background: 'rgba(0, 240, 255, 0.05)',
                border: '1px solid rgba(0, 240, 255, 0.3)',
                borderRadius: '12px',
                padding: '18px',
                textAlign: 'center',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0, 240, 255, 0.1)';
                e.currentTarget.style.boxShadow = '0 0 15px rgba(0, 240, 255, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(0, 240, 255, 0.05)';
                e.currentTarget.style.boxShadow = 'none';
              }}>
                <div style={{
                  fontSize: '24px',
                  marginBottom: '5px'
                }}>🔐</div>
                <div style={{
                  fontSize: '20px',
                  fontWeight: 'bold',
                  color: '#00f0ff',
                  marginBottom: '3px'
                }}>
                  {userMetrics.secureMessages}
                </div>
                <div style={{
                  fontSize: '11px',
                  color: '#888'
                }}>
                  Secure Messages
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default XPProfileModal;