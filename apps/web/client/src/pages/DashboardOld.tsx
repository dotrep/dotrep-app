import React, { useState, useEffect } from 'react';
import fsnLogoImage from "@assets/ChatGPT Image Jun 12, 2025, 11_46_43 PM_1749787174472.png";
import SharedNetworkAnimation from '@/components/SharedNetworkAnimation';
import XpIndicator from '@/components/XpIndicator';
import { PulseRing } from '@/components/PulseRing';
import { SignalGauge } from '@/components/SignalGauge';
import { BeaconPanel } from '@/components/BeaconPanel';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';

const Dashboard: React.FC = () => {
  const [isPulsing, setIsPulsing] = useState(false);
  const [isTextPulsing, setIsTextPulsing] = useState(false);

  // Fetch user stats and data
  const { data: userStats } = useQuery({
    queryKey: ['/api/user/stats'],
    retry: false,
  });

  const { data: vaultItems } = useQuery({
    queryKey: ['/api/vault/items'],
    retry: false,
  });

  // Extract trust engine data from API response
  const pulseScore = (userStats as any)?.pulseScore || 30;
  const signalScore = (userStats as any)?.signalScore || 0;
  const beaconStatus = (userStats as any)?.beaconStatus || 'locked';
  const nextRecoveryAction = (userStats as any)?.nextRecoveryAction || '';
  const statusMessage = (userStats as any)?.statusMessage || '';
  const xpLast7Days = (userStats as any)?.xpLast7Days || 0;
  const currentXP = (userStats as any)?.xpPoints || 0;

  const triggerPulse = () => {
    if (isPulsing) return;
    
    setIsPulsing(true);
    
    // Trigger text pulse after 1800ms delay (signal propagation effect)
    setTimeout(() => {
      setIsTextPulsing(true);
    }, 1800);
    
    setTimeout(() => {
      setIsPulsing(false);
    }, 2400);
    
    // End text pulse after 2000ms duration for slower wave effect
    setTimeout(() => {
      setIsTextPulsing(false);
    }, 3800);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      triggerPulse();
    }, 5000);

    return () => clearInterval(interval);
  }, [isPulsing]);

  return (
    <>
      <SharedNetworkAnimation />
      <XpIndicator />
      <section style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        position: 'relative',
        color: '#fff',
        fontFamily: 'Inter, sans-serif',
        overflow: 'hidden',
        padding: '5px 15px',
        zIndex: 1
      }}>
      
      {/* Logout Button - Bottom Right */}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 20
      }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <div style={{ 
            cursor: 'pointer',
            padding: '8px',
            transition: 'all 0.4s cubic-bezier(0.25, 0.1, 0.25, 1)',
            borderRadius: '6px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(0,96,100,0.08)';
            e.currentTarget.style.transform = 'translateY(-1px) scale(1.02)';
            const svg = e.currentTarget.querySelector('svg');
            if (svg) {
              svg.style.filter = 'drop-shadow(0 0 3px rgba(0,96,100,0.4)) drop-shadow(0 0 6px rgba(0,96,100,0.2))';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            const svg = e.currentTarget.querySelector('svg');
            if (svg) {
              svg.style.filter = 'drop-shadow(0 0 1px rgba(0,96,100,0.3))';
            }
          }}>
            <svg 
              width="32" 
              height="32" 
              viewBox="0 0 24 24" 
              style={{
                filter: 'drop-shadow(0 0 1px rgba(0,96,100,0.3))'
              }}
            >
              <defs>
                <filter id="logout-glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                  <feMerge> 
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              <g filter="url(#logout-glow)">
                {/* Outer bracket - left side */}
                <path 
                  d="M3 6 Q3 4 5 4 L12 4" 
                  stroke="#006064" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  fill="none"
                />
                <path 
                  d="M3 18 Q3 20 5 20 L12 20" 
                  stroke="#006064" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  fill="none"
                />
                <line 
                  x1="3" y1="6" x2="3" y2="18" 
                  stroke="#006064" 
                  strokeWidth="2" 
                  strokeLinecap="round"
                />
                
                {/* Exit arrow */}
                <line 
                  x1="9" y1="12" x2="19" y2="12" 
                  stroke="#006064" 
                  strokeWidth="2.5" 
                  strokeLinecap="round"
                />
                <polyline 
                  points="15,8 19,12 15,16" 
                  stroke="#006064" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  fill="none"
                />
              </g>
            </svg>
          </div>
        </Link>
      </div>

      {/* Navigation Header */}
      <nav style={{
        display: 'flex',
        gap: '30px',
        marginBottom: '10px',
        fontSize: '14px',
        fontWeight: '500',
        letterSpacing: '0.5px',
        justifyContent: 'center'
      }}>
        <div style={{ 
          color: '#00bcd4', 
          borderBottom: '2px solid #00bcd4',
          paddingBottom: '4px'
        }}>HOME</div>
        <Link href="/vault" style={{ textDecoration: 'none' }}>
          <div style={{ color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>VAULT</div>
        </Link>
        <Link href="/social" style={{ textDecoration: 'none' }}>
          <div style={{ color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>SOCIAL</div>
        </Link>
        <Link href="/game-center" style={{ textDecoration: 'none' }}>
          <div style={{ color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>GAME CENTER</div>
        </Link>
      </nav>

      {/* Main Circle Container */}
      <div 
        style={{
          position: 'relative',
          width: '320px',
          height: '320px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          borderRadius: '50%',
          zIndex: 10,
          margin: '0 auto 10px',
          flexShrink: 0
        }}
        onClick={triggerPulse}
      >
        
        {/* Outermost Ring */}
        <div style={{
          position: 'absolute',
          width: '320px',
          height: '320px',
          borderRadius: '50%',
          border: '1px solid rgba(0, 188, 212, 0.3)',
          opacity: isPulsing ? 0.05 : 0.6,
          transform: isPulsing ? 'scale3d(1.28, 1.28, 1)' : 'scale3d(1, 1, 1)',
          transition: 'all 2.2s cubic-bezier(0.25, 0.1, 0.25, 1)',
          transitionDelay: '0.6s',
          willChange: 'transform, opacity',
          backfaceVisibility: 'hidden',
          transformStyle: 'preserve-3d'
        }} />
        
        {/* Middle Ring */}
        <div style={{
          position: 'absolute',
          width: '280px',
          height: '280px',
          borderRadius: '50%',
          border: '1px solid rgba(0, 188, 212, 0.5)',
          opacity: isPulsing ? 0.1 : 0.8,
          transform: isPulsing ? 'scale3d(1.18, 1.18, 1)' : 'scale3d(1, 1, 1)',
          transition: 'all 2.0s cubic-bezier(0.25, 0.1, 0.25, 1)',
          transitionDelay: '0.3s',
          willChange: 'transform, opacity',
          backfaceVisibility: 'hidden',
          transformStyle: 'preserve-3d'
        }} />
        
        {/* Inner Ring */}
        <div style={{
          position: 'absolute',
          width: '240px',
          height: '240px',
          borderRadius: '50%',
          border: '2px solid rgba(0, 188, 212, 0.7)',
          opacity: isPulsing ? 0.2 : 1,
          transform: isPulsing ? 'scale3d(1.08, 1.08, 1)' : 'scale3d(1, 1, 1)',
          transition: 'all 1.8s cubic-bezier(0.25, 0.1, 0.25, 1)',
          transitionDelay: '0s',
          willChange: 'transform, opacity',
          backfaceVisibility: 'hidden',
          transformStyle: 'preserve-3d'
        }} />

        {/* FSN Logo */}
        <div style={{
          position: 'relative',
          zIndex: 5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '90px',
          height: '90px'
        }}>
          <img 
            src={fsnLogoImage}
            alt="FSN Logo"
            style={{
              width: '90px',
              height: '90px',
              minWidth: '90px',
              maxWidth: '90px',
              minHeight: '90px',
              maxHeight: '90px',
              filter: `
                drop-shadow(0 0 ${isPulsing ? 45 : 12}px rgba(0, 150, 168, ${isPulsing ? 1.0 : 0.4}))
                drop-shadow(0 0 ${isPulsing ? 65 : 20}px rgba(0, 188, 212, ${isPulsing ? 0.8 : 0.3}))
                drop-shadow(0 0 ${isPulsing ? 90 : 28}px rgba(64, 164, 188, ${isPulsing ? 0.7 : 0.2}))
                drop-shadow(0 0 ${isPulsing ? 120 : 0}px rgba(77, 208, 225, ${isPulsing ? 0.5 : 0}))
                brightness(${isPulsing ? 1.5 : 1.0})
                contrast(${isPulsing ? 1.4 : 1.0})
                saturate(${isPulsing ? 1.8 : 1.2})
                hue-rotate(${isPulsing ? 8 : 0}deg)
              `,
              transition: 'filter 1.5s cubic-bezier(0.25, 0.1, 0.25, 1)',
              objectFit: 'contain',
              background: 'transparent',
              position: 'relative',
              zIndex: 10,
              transform: 'none'
            }}
          />
        </div>
      </div>

      {/* Username */}
      <div style={{
        fontSize: '24px',
        fontWeight: '400',
        color: 'rgba(255,255,255,0.9)',
        marginBottom: '8px',
        letterSpacing: '0.5px'
      }}>
        username.fsn
      </div>

      {/* Identity Journey Tabs */}
      <div style={{
        width: '100%',
        maxWidth: '500px',
        marginBottom: '20px'
      }}>
        {/* Tab Strip */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '8px',
          marginBottom: '24px',
          padding: '0 20px'
        }}>
          {/* Pulse Tab */}
          <button
            onClick={() => setActiveJourneyTab('pulse')}
            style={{
              padding: '12px 20px',
              fontSize: '13px',
              fontWeight: '600',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              border: pulseComplete 
                ? '1px solid #00bcd4' 
                : activeJourneyTab === 'pulse' 
                  ? '1px solid rgba(255, 255, 255, 0.4)'
                  : '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '6px',
              background: pulseComplete 
                ? 'rgba(0, 188, 212, 0.1)' 
                : activeJourneyTab === 'pulse'
                  ? 'rgba(255, 255, 255, 0.05)'
                  : 'transparent',
              color: pulseComplete 
                ? '#00bcd4' 
                : activeJourneyTab === 'pulse'
                  ? '#fff'
                  : 'rgba(255, 255, 255, 0.6)',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: pulseComplete 
                ? '0 0 12px rgba(0, 188, 212, 0.3)' 
                : 'none',
              minWidth: '120px'
            }}
          >
            🫀 Pulse
          </button>

          {/* Signal Tab */}
          <button
            onClick={() => pulseComplete && setActiveJourneyTab('signal')}
            disabled={!pulseComplete}
            style={{
              padding: '12px 20px',
              fontSize: '13px',
              fontWeight: '600',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              border: signalComplete 
                ? '1px solid #00bcd4' 
                : pulseComplete && activeJourneyTab === 'signal'
                  ? '1px solid rgba(255, 255, 255, 0.4)'
                  : '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '6px',
              background: signalComplete 
                ? 'rgba(0, 188, 212, 0.1)' 
                : pulseComplete && activeJourneyTab === 'signal'
                  ? 'rgba(255, 255, 255, 0.05)'
                  : 'transparent',
              color: !pulseComplete 
                ? 'rgba(255, 255, 255, 0.3)'
                : signalComplete 
                  ? '#00bcd4' 
                  : activeJourneyTab === 'signal'
                    ? '#fff'
                    : 'rgba(255, 255, 255, 0.6)',
              cursor: pulseComplete ? 'pointer' : 'not-allowed',
              transition: 'all 0.3s ease',
              boxShadow: signalComplete 
                ? '0 0 12px rgba(0, 188, 212, 0.3)' 
                : 'none',
              minWidth: '120px'
            }}
            title={!pulseComplete ? "Complete Pulse stage to unlock" : ""}
          >
            📡 Signal
          </button>

          {/* Beacon Tab */}
          <button
            onClick={() => signalComplete && setActiveJourneyTab('beacon')}
            disabled={!signalComplete}
            style={{
              padding: '12px 20px',
              fontSize: '13px',
              fontWeight: '600',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              border: beaconEligible 
                ? '1px solid #00bcd4' 
                : signalComplete && activeJourneyTab === 'beacon'
                  ? '1px solid rgba(255, 255, 255, 0.4)'
                  : '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '6px',
              background: beaconEligible 
                ? 'rgba(0, 188, 212, 0.1)' 
                : signalComplete && activeJourneyTab === 'beacon'
                  ? 'rgba(255, 255, 255, 0.05)'
                  : 'transparent',
              color: !signalComplete 
                ? 'rgba(255, 255, 255, 0.3)'
                : beaconEligible 
                  ? '#00bcd4' 
                  : activeJourneyTab === 'beacon'
                    ? '#fff'
                    : 'rgba(255, 255, 255, 0.6)',
              cursor: signalComplete ? 'pointer' : 'not-allowed',
              transition: 'all 0.3s ease',
              boxShadow: beaconEligible 
                ? '0 0 12px rgba(0, 188, 212, 0.3)' 
                : 'none',
              minWidth: '120px'
            }}
            title={!signalComplete ? "Complete Signal stage to unlock" : ""}
          >
            🛰️ Beacon
          </button>
        </div>

        {/* Quest Content Area */}
        <div style={{
          border: '1px solid rgba(0, 188, 212, 0.3)',
          borderRadius: '8px',
          padding: '16px',
          background: 'rgba(0, 20, 40, 0.2)'
        }}>
          {/* Pulse Quests */}
          {activeJourneyTab === 'pulse' && (
            <div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '10px'
              }}>
                <h3 style={{
                  fontSize: '16px',
                  color: '#00bcd4',
                  letterSpacing: '1px',
                  fontWeight: '600',
                  margin: 0
                }}>
                  🫀 PULSE STAGE
                </h3>
                <div style={{
                  fontSize: '12px',
                  color: 'rgba(255, 255, 255, 0.6)',
                  letterSpacing: '0.5px'
                }}>
                  SHOW UP & INTERACT
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {[
                  { key: 'uploadFile', label: 'Upload first file', xp: 50, completed: pulseQuests.uploadFile },
                  { key: 'verifyEmail', label: 'Verify email', xp: 25, completed: pulseQuests.verifyEmail },
                  { key: 'profilePicture', label: 'Set profile picture', xp: 10, completed: pulseQuests.profilePicture },
                  { key: 'loginStreak3', label: '3-day login streak', xp: 30, completed: pulseQuests.loginStreak3 },
                  { key: 'inviteUser', label: 'Invite 1 user', xp: 30, completed: pulseQuests.inviteUser }
                ].map(quest => (
                  <div
                    key={quest.key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 8px',
                      border: quest.completed 
                        ? '1px solid rgba(76, 175, 80, 0.4)' 
                        : '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '6px',
                      background: quest.completed 
                        ? 'rgba(76, 175, 80, 0.05)' 
                        : 'rgba(255, 255, 255, 0.02)',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        border: quest.completed 
                          ? '2px solid #4caf50' 
                          : '2px solid rgba(255, 255, 255, 0.3)',
                        background: quest.completed ? '#4caf50' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        color: '#fff'
                      }}>
                        {quest.completed && '✓'}
                      </div>
                      <span style={{
                        color: quest.completed ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.7)',
                        fontSize: '14px'
                      }}>
                        {quest.label}
                      </span>
                    </div>
                    <span style={{
                      color: quest.completed ? '#4caf50' : '#00bcd4',
                      fontSize: '13px',
                      fontWeight: '600'
                    }}>
                      +{quest.xp} XP
                    </span>
                  </div>
                ))}
              </div>

              {pulseComplete && (
                <div style={{
                  marginTop: '10px',
                  padding: '8px 12px',
                  border: '1px solid rgba(0, 188, 212, 0.4)',
                  borderRadius: '6px',
                  background: 'rgba(0, 188, 212, 0.05)',
                  textAlign: 'center'
                }}>
                  <div style={{
                    color: '#00bcd4',
                    fontSize: '14px',
                    fontWeight: '600',
                    marginBottom: '4px'
                  }}>
                    ✅ Pulse Complete!
                  </div>
                  <div style={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontSize: '12px'
                  }}>
                    Badge: Pulse Active • Signal Stage Unlocked
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Signal Quests */}
          {activeJourneyTab === 'signal' && (
            <div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px'
              }}>
                <h3 style={{
                  fontSize: '16px',
                  color: '#00bcd4',
                  letterSpacing: '1px',
                  fontWeight: '600',
                  margin: 0
                }}>
                  📡 SIGNAL STAGE
                </h3>
                <div style={{
                  fontSize: '12px',
                  color: 'rgba(255, 255, 255, 0.6)',
                  letterSpacing: '0.5px'
                }}>
                  BUILD TRUST & CONSISTENCY
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {[
                  { key: 'upload5Files', label: 'Upload 5 files', xp: 50, completed: signalQuests.upload5Files },
                  { key: 'reach500XP', label: 'Reach 500 XP', xp: 25, completed: signalQuests.reach500XP },
                  { key: 'loginStreak5', label: '5-day login streak', xp: 40, completed: signalQuests.loginStreak5 },
                  { key: 'gameCenterMission', label: 'Complete game mission', xp: 50, completed: signalQuests.gameCenterMission },
                  { key: 'refer2Users', label: 'Refer 2 users', xp: 75, completed: signalQuests.refer2Users }
                ].map(quest => (
                  <div
                    key={quest.key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 8px',
                      border: quest.completed 
                        ? '1px solid rgba(76, 175, 80, 0.4)' 
                        : '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '6px',
                      background: quest.completed 
                        ? 'rgba(76, 175, 80, 0.05)' 
                        : 'rgba(255, 255, 255, 0.02)',
                      cursor: quest.completed || !pulseComplete ? 'default' : 'pointer',
                      transition: 'all 0.3s ease',
                      opacity: pulseComplete ? 1 : 0.5
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        border: quest.completed 
                          ? '2px solid #4caf50' 
                          : '2px solid rgba(255, 255, 255, 0.3)',
                        background: quest.completed ? '#4caf50' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        color: '#fff'
                      }}>
                        {quest.completed && '✓'}
                      </div>
                      <span style={{
                        color: quest.completed ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.7)',
                        fontSize: '14px'
                      }}>
                        {quest.label}
                      </span>
                    </div>
                    <span style={{
                      color: quest.completed ? '#4caf50' : '#00bcd4',
                      fontSize: '13px',
                      fontWeight: '600'
                    }}>
                      +{quest.xp} XP
                    </span>
                  </div>
                ))}
              </div>

              {signalComplete && (
                <div style={{
                  marginTop: '16px',
                  padding: '12px',
                  border: '1px solid rgba(0, 188, 212, 0.4)',
                  borderRadius: '6px',
                  background: 'rgba(0, 188, 212, 0.05)',
                  textAlign: 'center'
                }}>
                  <div style={{
                    color: '#00bcd4',
                    fontSize: '14px',
                    fontWeight: '600',
                    marginBottom: '4px'
                  }}>
                    ✅ Signal Complete!
                  </div>
                  <div style={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontSize: '12px'
                  }}>
                    Badge: Signal Online • Beacon Stage Unlocked
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Beacon Preview */}
          {activeJourneyTab === 'beacon' && (
            <div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px'
              }}>
                <h3 style={{
                  fontSize: '16px',
                  color: '#00bcd4',
                  letterSpacing: '1px',
                  fontWeight: '600',
                  margin: 0
                }}>
                  🛰️ BEACON STATUS: LOCKED
                </h3>
                <div style={{
                  fontSize: '12px',
                  color: 'rgba(255, 255, 255, 0.6)',
                  letterSpacing: '0.5px'
                }}>
                  FUTURE READY
                </div>
              </div>

              <div style={{
                textAlign: 'center',
                padding: '40px 20px'
              }}>
                <div style={{
                  fontSize: '48px',
                  marginBottom: '16px',
                  opacity: 0.3
                }}>
                  🛰️
                </div>
                <div style={{
                  fontSize: '16px',
                  color: 'rgba(255, 255, 255, 0.8)',
                  marginBottom: '12px',
                  fontWeight: '600'
                }}>
                  Coming Soon
                </div>
                <div style={{
                  fontSize: '14px',
                  color: 'rgba(255, 255, 255, 0.6)',
                  lineHeight: '1.6',
                  marginBottom: '20px'
                }}>
                  • Airdrop eligibility<br/>
                  • Map visibility<br/>
                  • Trust-based rewards<br/>
                  • Advanced Vault powers
                </div>
                <button
                  disabled={!signalComplete}
                  style={{
                    padding: '10px 20px',
                    fontSize: '12px',
                    fontWeight: '600',
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '6px',
                    background: 'transparent',
                    color: signalComplete ? 'rgba(255, 255, 255, 0.7)' : 'rgba(255, 255, 255, 0.3)',
                    cursor: signalComplete ? 'pointer' : 'not-allowed',
                    transition: 'all 0.3s ease'
                  }}
                >
                  Join Trustlist
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Section */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px'
      }}>
        {/* Identity Incentivized */}
        <div style={{
          fontSize: '14px',
          color: '#00bcd4',
          letterSpacing: '2px',
          fontWeight: '500',
          textShadow: isTextPulsing 
            ? `0 0 18px rgba(0, 188, 212, 0.8),
               0 0 30px rgba(0, 188, 212, 0.5),
               0 0 45px rgba(0, 188, 212, 0.3),
               0 0 60px rgba(77, 208, 225, 0.2)`
            : `0 0 8px rgba(0, 188, 212, 0.4),
               0 0 12px rgba(0, 188, 212, 0.2)`,
          filter: isTextPulsing
            ? `brightness(1.2) saturate(1.2) drop-shadow(0 0 12px rgba(0, 188, 212, 0.4))`
            : `brightness(1.0) saturate(1.0)`,
          transition: 'all 2.0s cubic-bezier(0.16, 1, 0.3, 1)',
          transform: isTextPulsing ? 'scale(1.008)' : 'scale(1.0)',
          transformOrigin: 'center center'
        }}>
          IDENTITY INCENTIVIZED
        </div>
      </div>
      
      </section>


    </>
  );
};

export default Dashboard;