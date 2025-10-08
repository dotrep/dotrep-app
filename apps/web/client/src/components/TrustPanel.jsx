import React, { useState, useEffect } from 'react';
import { X, Shield, CheckCircle, Circle, Mail, Smartphone, User, FileCheck } from 'lucide-react';
import { useXP } from '../context/XPContext';

const TrustPanel = ({ isOpen, onClose }) => {
  const { xpPoints, rewardBadge } = useXP();
  const [userProgress, setUserProgress] = useState(() => {
    const saved = localStorage.getItem('userProgress');
    const defaultProgress = {
      trust: {
        verified: false,
        requirements: {
          emailAdded: true,  // Pre-filled as user likely has email
          twoFactor: false,
          profileFilled: true, // Pre-filled as user has profile
          idVerified: false
        },
        xpRewarded: false
      }
    };
    return saved ? { ...defaultProgress, ...JSON.parse(saved) } : defaultProgress;
  });

  const [showIdModal, setShowIdModal] = useState(false);

  // Save progress to localStorage
  useEffect(() => {
    localStorage.setItem('userProgress', JSON.stringify(userProgress));
  }, [userProgress]);

  // Check if all requirements are met
  const allRequirementsMet = Object.values(userProgress.trust.requirements).every(req => req === true);

  // Handle verification completion
  useEffect(() => {
    if (allRequirementsMet && !userProgress.trust.verified && !userProgress.trust.xpRewarded) {
      setUserProgress(prev => ({
        ...prev,
        trust: {
          ...prev.trust,
          verified: true,
          xpRewarded: true
        }
      }));
      
      // Award XP and badge
      rewardBadge('Trust Verified', 100);
    }
  }, [allRequirementsMet, userProgress.trust.verified, userProgress.trust.xpRewarded, rewardBadge]);

  const toggleRequirement = (requirement) => {
    if (requirement === 'idVerified') {
      setShowIdModal(true);
      return;
    }
    
    setUserProgress(prev => ({
      ...prev,
      trust: {
        ...prev.trust,
        requirements: {
          ...prev.trust.requirements,
          [requirement]: !prev.trust.requirements[requirement]
        }
      }
    }));
  };

  const handleIdVerification = () => {
    setUserProgress(prev => ({
      ...prev,
      trust: {
        ...prev.trust,
        requirements: {
          ...prev.trust.requirements,
          idVerified: true
        }
      }
    }));
    setShowIdModal(false);
  };

  if (!isOpen) return null;

  const requirements = [
    {
      id: 'emailAdded',
      label: 'Add recovery email',
      icon: Mail,
      completed: userProgress.trust.requirements.emailAdded
    },
    {
      id: 'twoFactor',
      label: 'Enable 2FA (Google Auth)',
      icon: Smartphone,
      completed: userProgress.trust.requirements.twoFactor
    },
    {
      id: 'profileFilled',
      label: 'Complete Profile Info',
      icon: User,
      completed: userProgress.trust.requirements.profileFilled
    },
    {
      id: 'idVerified',
      label: 'Identity check (mock)',
      icon: FileCheck,
      completed: userProgress.trust.requirements.idVerified
    }
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        onClick={onClose}
      >
        {/* Trust Panel */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(0, 20, 40, 0.95) 0%, rgba(0, 40, 80, 0.95) 100%)',
            border: '2px solid #00bcd4',
            borderRadius: '16px',
            padding: '32px',
            width: '500px',
            maxWidth: '90vw',
            maxHeight: '80vh',
            overflow: 'auto',
            position: 'relative',
            fontFamily: 'Orbitron, sans-serif',
            color: '#ffffff',
            boxShadow: '0 20px 40px rgba(0, 188, 212, 0.3)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'transparent',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              padding: '8px'
            }}
          >
            <X size={20} />
          </button>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              marginBottom: '16px'
            }}>
              <Shield 
                size={32} 
                color={userProgress.trust.verified ? '#00ff88' : '#00bcd4'} 
                style={{
                  filter: userProgress.trust.verified ? 
                    'drop-shadow(0 0 8px rgba(0, 255, 136, 0.6))' : 
                    'drop-shadow(0 0 8px rgba(0, 188, 212, 0.6))'
                }}
              />
              <h2 style={{ 
                fontSize: '24px', 
                fontWeight: 'bold', 
                margin: 0,
                color: userProgress.trust.verified ? '#00ff88' : '#00bcd4',
                textShadow: '0 0 8px rgba(0, 188, 212, 0.6)'
              }}>
                Trust Verification
              </h2>
            </div>
            
            <p style={{
              fontSize: '14px',
              color: 'rgba(255, 255, 255, 0.8)',
              lineHeight: '1.6',
              margin: 0
            }}>
              Verification lets you unlock higher tiers of FSN — including enhanced Signal, 
              governance tools, and staking boosts. You remain pseudonymous, but trusted.
            </p>
          </div>

          {/* Requirements */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ 
              fontSize: '16px', 
              color: '#00bcd4', 
              marginBottom: '16px',
              textAlign: 'center'
            }}>
              Progress Status
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {requirements.map(req => {
                const IconComponent = req.icon;
                return (
                  <div
                    key={req.id}
                    onClick={() => toggleRequirement(req.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 16px',
                      background: req.completed ? 
                        'rgba(0, 255, 136, 0.1)' : 
                        'rgba(0, 188, 212, 0.1)',
                      border: `1px solid ${req.completed ? '#00ff88' : '#00bcd4'}`,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = req.completed ? 
                        'rgba(0, 255, 136, 0.2)' : 
                        'rgba(0, 188, 212, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = req.completed ? 
                        'rgba(0, 255, 136, 0.1)' : 
                        'rgba(0, 188, 212, 0.1)';
                    }}
                  >
                    <IconComponent size={18} color={req.completed ? '#00ff88' : '#00bcd4'} />
                    <span style={{ flex: 1, fontSize: '14px' }}>{req.label}</span>
                    {req.completed ? (
                      <CheckCircle size={20} color="#00ff88" />
                    ) : (
                      <Circle size={20} color="#666666" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reward Section */}
          <div style={{
            background: userProgress.trust.verified ? 
              'linear-gradient(135deg, rgba(0, 255, 136, 0.2) 0%, rgba(0, 188, 212, 0.2) 100%)' :
              'rgba(0, 188, 212, 0.1)',
            border: `2px solid ${userProgress.trust.verified ? '#00ff88' : '#00bcd4'}`,
            borderRadius: '12px',
            padding: '16px',
            textAlign: 'center'
          }}>
            <h4 style={{ 
              fontSize: '14px', 
              color: userProgress.trust.verified ? '#00ff88' : '#00bcd4',
              margin: '0 0 8px 0'
            }}>
              {userProgress.trust.verified ? 'Verification Complete!' : 'Verification Reward'}
            </h4>
            <p style={{
              fontSize: '12px',
              color: 'rgba(255, 255, 255, 0.9)',
              margin: 0,
              lineHeight: '1.4'
            }}>
              🏅 Verified Status Unlocked: +100 XP, Trust Badge, Signal Core Amplified
            </p>
          </div>
        </div>
      </div>

      {/* Identity Verification Modal */}
      {showIdModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.9)',
            zIndex: 1001,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onClick={() => setShowIdModal(false)}
        >
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(0, 20, 40, 0.95) 0%, rgba(0, 40, 80, 0.95) 100%)',
              border: '2px solid #00bcd4',
              borderRadius: '16px',
              padding: '32px',
              width: '400px',
              maxWidth: '90vw',
              fontFamily: 'Orbitron, sans-serif',
              color: '#ffffff',
              textAlign: 'center'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <FileCheck size={48} color="#00bcd4" style={{ marginBottom: '16px' }} />
            <h3 style={{ fontSize: '18px', marginBottom: '16px', color: '#00bcd4' }}>
              Identity Verification
            </h3>
            <p style={{ 
              fontSize: '14px', 
              color: 'rgba(255, 255, 255, 0.8)', 
              marginBottom: '24px',
              lineHeight: '1.6'
            }}>
              In the future, this step will let you verify with AI or zero-knowledge KYC. 
              For now, click to simulate verification.
            </p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
              <button
                onClick={() => setShowIdModal(false)}
                style={{
                  background: 'transparent',
                  border: '2px solid #666666',
                  color: '#666666',
                  borderRadius: '8px',
                  padding: '12px 20px',
                  fontSize: '14px',
                  fontFamily: 'Orbitron, sans-serif',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleIdVerification}
                style={{
                  background: 'linear-gradient(135deg, rgba(0, 188, 212, 0.3) 0%, rgba(0, 255, 136, 0.3) 100%)',
                  border: '2px solid #00bcd4',
                  color: '#ffffff',
                  borderRadius: '8px',
                  padding: '12px 20px',
                  fontSize: '14px',
                  fontFamily: 'Orbitron, sans-serif',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 12px rgba(0, 188, 212, 0.3)'
                }}
              >
                Confirm Verification
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TrustPanel;