import React, { useState } from 'react';
import { X, Mail, Smartphone, User, FileCheck, Shield } from 'lucide-react';

const TrustVerificationModal = ({ isOpen, onClose }) => {
  const [progress, setProgress] = useState({
    emailAdded: true, // Already completed (user has email verified)
    twoFactor: true,  // Mock as completed
    profileFilled: true, // User has profile info
    idVerified: true  // Mock as completed
  });

  if (!isOpen) return null;

  const requirements = [
    {
      id: 'emailAdded',
      label: 'Add recovery email',
      icon: Mail,
      completed: progress.emailAdded
    },
    {
      id: 'twoFactor',
      label: 'Enable 2FA (Google Auth)',
      icon: Smartphone,
      completed: progress.twoFactor
    },
    {
      id: 'profileFilled',
      label: 'Complete Profile Info',
      icon: User,
      completed: progress.profileFilled
    },
    {
      id: 'idVerified',
      label: 'Identity check (mock)',
      icon: FileCheck,
      completed: progress.idVerified
    }
  ];

  const completedCount = requirements.filter(req => req.completed).length;
  const allCompleted = completedCount === requirements.length;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.9)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(8px)'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, rgba(0, 20, 40, 0.95) 0%, rgba(0, 30, 60, 0.95) 100%)',
        borderRadius: '20px',
        padding: '32px',
        width: '90%',
        maxWidth: '600px',
        border: '3px solid rgba(0, 188, 212, 0.4)',
        boxShadow: '0 0 50px rgba(0, 188, 212, 0.3)',
        fontFamily: 'Orbitron, sans-serif',
        color: '#ffffff'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          borderBottom: '2px solid rgba(0, 188, 212, 0.3)',
          paddingBottom: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Shield size={28} color="#00ff88" />
            <h2 style={{
              color: '#00ff88',
              margin: 0,
              fontSize: '24px',
              fontWeight: 'bold',
              textShadow: '0 0 15px rgba(0, 255, 136, 0.8)'
            }}>
              Trust Verification
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '6px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.1)';
              e.target.style.color = '#00bcd4';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'none';
              e.target.style.color = '#ffffff';
            }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Description */}
        <div style={{
          textAlign: 'center',
          marginBottom: '32px',
          color: 'rgba(255, 255, 255, 0.8)',
          lineHeight: '1.6',
          fontSize: '14px'
        }}>
          Verification lets you unlock higher tiers of FSN — including enhanced Signal, 
          governance tools, and staking boosts. You remain pseudonymous, but trusted.
        </div>

        {/* Progress Status */}
        <div style={{
          textAlign: 'center',
          marginBottom: '24px'
        }}>
          <h3 style={{
            color: '#00bcd4',
            fontSize: '18px',
            fontWeight: 'bold',
            marginBottom: '16px',
            textShadow: '0 0 10px rgba(0, 188, 212, 0.6)'
          }}>
            Progress Status
          </h3>
        </div>

        {/* Verification Steps */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          marginBottom: '32px'
        }}>
          {requirements.map((req) => {
            const IconComponent = req.icon;
            return (
              <div
                key={req.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '16px',
                  background: req.completed ? 
                    'rgba(0, 255, 136, 0.1)' : 
                    'rgba(0, 0, 0, 0.3)',
                  border: req.completed ? 
                    '2px solid rgba(0, 255, 136, 0.3)' : 
                    '2px solid rgba(100, 100, 100, 0.3)',
                  borderRadius: '12px',
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{ 
                  marginRight: '16px',
                  color: req.completed ? '#00ff88' : '#888888'
                }}>
                  <IconComponent size={24} />
                </div>
                
                <div style={{ flex: 1 }}>
                  <span style={{ 
                    color: req.completed ? '#ffffff' : '#cccccc',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}>
                    {req.label}
                  </span>
                </div>
                
                <div style={{ 
                  marginLeft: '16px',
                  color: req.completed ? '#00ff88' : '#666666'
                }}>
                  {req.completed ? '✓' : '○'}
                </div>
              </div>
            );
          })}
        </div>

        {/* Completion Status */}
        {allCompleted && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(0, 255, 136, 0.1) 0%, rgba(0, 255, 136, 0.05) 100%)',
            border: '2px solid rgba(0, 255, 136, 0.3)',
            borderRadius: '12px',
            padding: '20px',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '16px',
              fontWeight: 'bold',
              color: '#00ff88',
              marginBottom: '8px',
              textShadow: '0 0 10px rgba(0, 255, 136, 0.6)'
            }}>
              Verification Complete!
            </div>
            <div style={{
              fontSize: '12px',
              color: '#ffffff',
              lineHeight: '1.4'
            }}>
              🏆 Verified Status Unlocked: +100 XP, Trust Badge, Signal Core Amplified
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrustVerificationModal;