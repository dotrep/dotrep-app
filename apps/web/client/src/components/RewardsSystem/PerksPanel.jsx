import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, Star, Zap, Shield, Crown, Gift } from 'lucide-react';

const PerksPanel = ({ show, currentXP, onClose }) => {
  const featureEnabled = import.meta.env.VITE_FEATURE_REWARDS_FEEDBACK !== 'off';
  const xpLevelsJson = import.meta.env.VITE_XP_LEVELS_JSON || '[0,100,250,500,1000,2000,5000,10000]';
  
  if (!featureEnabled || !show) return null;

  const xpLevels = JSON.parse(xpLevelsJson);
  
  // Calculate current level
  const getCurrentLevel = (xp) => {
    for (let i = xpLevels.length - 1; i >= 0; i--) {
      if (xp >= xpLevels[i]) return i;
    }
    return 0;
  };

  const currentLevel = getCurrentLevel(currentXP);
  const nextLevel = currentLevel + 1;
  const nextLevelXP = xpLevels[nextLevel] || xpLevels[xpLevels.length - 1];

  // Static perks configuration (cosmetic for Phase 0)
  const perks = [
    {
      id: 1,
      icon: Star,
      title: "Profile Theme",
      description: "Customize your profile appearance",
      requirement: "Level 1",
      levelRequired: 1,
      status: "Coming online in Phase 1"
    },
    {
      id: 2,
      icon: Zap,
      title: "Early Access Badge",
      description: "Exclusive badge for early adopters",
      requirement: "Level 3",
      levelRequired: 3,
      status: "Coming online in Phase 1"
    },
    {
      id: 3,
      icon: Shield,
      title: "Enhanced Security",
      description: "Additional security features",
      requirement: "Level 5",
      levelRequired: 5,
      status: "Coming online in Phase 1"
    },
    {
      id: 4,
      icon: Crown,
      title: "VIP Status",
      description: "Priority support and features",
      requirement: "Level 7",
      levelRequired: 7,
      status: "Coming online in Phase 1"
    },
    {
      id: 5,
      icon: Gift,
      title: "Exclusive Rewards",
      description: "Special rewards and bonuses",
      requirement: "Level 10",
      levelRequired: 10,
      status: "Coming online in Phase 1"
    }
  ];

  // Handle keyboard dismissal
  React.useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (show) {
      document.addEventListener('keydown', handleKeyPress);
      return () => document.removeEventListener('keydown', handleKeyPress);
    }
  }, [show, onClose]);

  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Backdrop */}
          <motion.div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              zIndex: 999
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              width: '400px',
              background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95), rgba(0, 30, 60, 0.9))',
              border: '1px solid rgba(0, 240, 255, 0.3)',
              backdropFilter: 'blur(20px)',
              zIndex: 1000,
              overflowY: 'auto',
              padding: '24px'
            }}
            initial={{ x: 400 }}
            animate={{ x: 0 }}
            exit={{ x: 400 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            role="dialog"
            aria-labelledby="perks-title"
            tabIndex={-1}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '24px'
            }}>
              <div>
                <h2 id="perks-title" style={{
                  fontSize: '20px',
                  fontWeight: '700',
                  color: '#00f0ff',
                  margin: 0,
                  marginBottom: '4px'
                }}>
                  Perks & Levels
                </h2>
                <p style={{
                  fontSize: '14px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  margin: 0
                }}>
                  Reach new levels to unlock perks.
                </p>
              </div>
              
              <button
                onClick={onClose}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.7)',
                  cursor: 'pointer',
                  padding: '8px',
                  borderRadius: '4px'
                }}
                aria-label="Close perks panel"
              >
                <X size={20} />
              </button>
            </div>

            {/* Current Level Status */}
            <div style={{
              background: 'rgba(0, 240, 255, 0.1)',
              border: '1px solid rgba(0, 240, 255, 0.3)',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '24px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '8px'
              }}>
                <span style={{ color: '#00f0ff', fontWeight: '600' }}>
                  Current Level: {currentLevel}
                </span>
                <span style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }}>
                  {currentXP.toLocaleString()} XP
                </span>
              </div>
              
              {nextLevel < xpLevels.length && (
                <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)' }}>
                  Next level at {nextLevelXP.toLocaleString()} XP
                </div>
              )}
            </div>

            {/* Perks List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {perks.map((perk) => {
                const IconComponent = perk.icon;
                const isUnlocked = currentLevel >= perk.levelRequired;
                
                return (
                  <motion.div
                    key={perk.id}
                    style={{
                      background: isUnlocked 
                        ? 'rgba(0, 240, 255, 0.1)' 
                        : 'rgba(255, 255, 255, 0.05)',
                      border: `1px solid ${isUnlocked 
                        ? 'rgba(0, 240, 255, 0.3)' 
                        : 'rgba(255, 255, 255, 0.1)'}`,
                      borderRadius: '8px',
                      padding: '16px',
                      opacity: isUnlocked ? 1 : 0.6
                    }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px'
                    }}>
                      {/* Icon */}
                      <div style={{
                        padding: '8px',
                        background: isUnlocked 
                          ? 'rgba(0, 240, 255, 0.2)' 
                          : 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {isUnlocked ? (
                          <IconComponent size={16} color="#00f0ff" />
                        ) : (
                          <Lock size={16} color="rgba(255, 255, 255, 0.5)" />
                        )}
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1 }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '4px'
                        }}>
                          <h3 style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            color: isUnlocked ? '#00f0ff' : 'rgba(255, 255, 255, 0.7)',
                            margin: 0
                          }}>
                            {perk.title}
                          </h3>
                          <span style={{
                            fontSize: '11px',
                            color: 'rgba(255, 255, 255, 0.5)',
                            padding: '2px 6px',
                            background: 'rgba(255, 255, 255, 0.1)',
                            borderRadius: '4px'
                          }}>
                            {perk.requirement}
                          </span>
                        </div>
                        
                        <p style={{
                          fontSize: '12px',
                          color: 'rgba(255, 255, 255, 0.6)',
                          margin: '0 0 8px 0'
                        }}>
                          {perk.description}
                        </p>
                        
                        <div style={{
                          fontSize: '10px',
                          color: 'rgba(255, 165, 0, 0.8)',
                          fontStyle: 'italic'
                        }}>
                          {perk.status}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default PerksPanel;