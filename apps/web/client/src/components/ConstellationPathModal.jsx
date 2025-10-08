import React from 'react';
import { X, Zap, Radio, Activity } from 'lucide-react';

const ConstellationPathModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const stages = [
    {
      icon: <Zap size={48} color="#00bcd4" />,
      title: "🌀 PULSE",
      subtitle: "Emits your identity frequency",
      description: "Your Pulse represents the strength of your FSN identity. Complete daily actions, upload files, and engage with the network to build your identity frequency.",
      requirements: [
        "Daily login streaks",
        "File uploads to Vault", 
        "Profile completion",
        "Network engagement"
      ],
      benefits: [
        "Unlocks Signal broadcasting",
        "Increases trust score",
        "Powers constellation visibility"
      ],
      unlocked: true
    },
    {
      icon: <Radio size={48} color="#00bcd4" />,
      title: "📡 SIGNAL", 
      subtitle: "Casts your trust + intent",
      description: "Signal allows you to broadcast your intentions and connect with the FSN constellation. Tune frequencies, cast signals, and communicate across the network.",
      requirements: [
        "Pulse ≥ 70Hz",
        "XP ≥ 100 points",
        "At least 1 broadcast attempt"
      ],
      benefits: [
        "Frequency tuning capability",
        "Network broadcasting",
        "Constellation communication",
        "Unlock special frequencies"
      ],
      unlocked: false
    },
    {
      icon: <Activity size={48} color="#00bcd4" />,
      title: "🔦 BEACON",
      subtitle: "Lights up the FSN constellation", 
      description: "Beacon transforms you into a network lighthouse, guiding others and amplifying the entire FSN constellation with your sustained activity.",
      requirements: [
        "Signal unlocked",
        "3+ day login streak",
        "Multiple broadcasts",
        "High network activity"
      ],
      benefits: [
        "Maximum constellation power",
        "Network leadership status", 
        "Enhanced signal range",
        "Guide other FSN users"
      ],
      unlocked: false
    }
  ];

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
        maxWidth: '800px',
        maxHeight: '90vh',
        overflow: 'auto',
        border: '3px solid rgba(0, 188, 212, 0.4)',
        boxShadow: '0 0 50px rgba(0, 188, 212, 0.3)',
        fontFamily: 'Orbitron, sans-serif'
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
          <h2 style={{
            color: '#00bcd4',
            margin: 0,
            fontSize: '28px',
            fontWeight: 'bold',
            textShadow: '0 0 15px rgba(0, 188, 212, 0.8)'
          }}>
            FSN Constellation Path
          </h2>
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

        {/* Journey Description */}
        <div style={{
          textAlign: 'center',
          marginBottom: '32px',
          color: 'rgba(255, 255, 255, 0.8)',
          fontSize: '14px',
          lineHeight: '1.6'
        }}>
          Your journey through the FreeSpace Network follows a progression of identity, communication, and leadership.
          Each stage unlocks new capabilities and deeper network integration.
        </div>

        {/* Stages */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}>
          {stages.map((stage, index) => (
            <div
              key={index}
              style={{
                background: stage.unlocked 
                  ? 'linear-gradient(135deg, rgba(0, 188, 212, 0.1) 0%, rgba(0, 150, 169, 0.1) 100%)'
                  : 'linear-gradient(135deg, rgba(60, 60, 60, 0.1) 0%, rgba(40, 40, 40, 0.1) 100%)',
                border: `2px solid ${stage.unlocked ? 'rgba(0, 188, 212, 0.4)' : 'rgba(100, 100, 100, 0.3)'}`,
                borderRadius: '16px',
                padding: '24px',
                display: 'flex',
                gap: '20px',
                position: 'relative',
                transition: 'all 0.3s ease'
              }}
            >
              {/* Glowing ring for unlocked stages */}
              {stage.unlocked && (
                <div style={{
                  position: 'absolute',
                  top: '-3px',
                  left: '-3px',
                  right: '-3px', 
                  bottom: '-3px',
                  border: '2px solid #00bcd4',
                  borderRadius: '18px',
                  boxShadow: '0 0 20px rgba(0, 188, 212, 0.6)',
                  animation: 'pathGlow 3s ease-in-out infinite',
                  pointerEvents: 'none'
                }} />
              )}

              {/* Icon */}
              <div style={{
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: stage.unlocked 
                  ? 'radial-gradient(circle, rgba(0, 188, 212, 0.2) 0%, rgba(0, 188, 212, 0.05) 100%)'
                  : 'radial-gradient(circle, rgba(100, 100, 100, 0.1) 0%, rgba(60, 60, 60, 0.05) 100%)',
                border: `2px solid ${stage.unlocked ? '#00bcd4' : '#666666'}`
              }}>
                {stage.icon}
              </div>

              {/* Content */}
              <div style={{ flex: 1 }}>
                {/* Title */}
                <h3 style={{
                  color: stage.unlocked ? '#00bcd4' : '#888888',
                  fontSize: '20px',
                  fontWeight: 'bold',
                  margin: '0 0 4px 0',
                  textShadow: stage.unlocked ? '0 0 10px rgba(0, 188, 212, 0.6)' : 'none'
                }}>
                  {stage.title}
                </h3>

                {/* Subtitle */}
                <div style={{
                  color: stage.unlocked ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.5)',
                  fontSize: '14px',
                  fontStyle: 'italic',
                  marginBottom: '12px'
                }}>
                  {stage.subtitle}
                </div>

                {/* Description */}
                <p style={{
                  color: stage.unlocked ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.4)',
                  fontSize: '12px',
                  lineHeight: '1.5',
                  marginBottom: '16px'
                }}>
                  {stage.description}
                </p>

                {/* Requirements and Benefits */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '16px'
                }}>
                  {/* Requirements */}
                  <div>
                    <h4 style={{
                      color: stage.unlocked ? '#ff9800' : '#666666',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      marginBottom: '8px',
                      textTransform: 'uppercase'
                    }}>
                      Requirements
                    </h4>
                    <ul style={{
                      listStyle: 'none',
                      padding: 0,
                      margin: 0,
                      fontSize: '10px',
                      color: stage.unlocked ? 'rgba(255, 255, 255, 0.7)' : 'rgba(255, 255, 255, 0.4)'
                    }}>
                      {stage.requirements.map((req, i) => (
                        <li key={i} style={{ marginBottom: '4px' }}>
                          • {req}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Benefits */}
                  <div>
                    <h4 style={{
                      color: stage.unlocked ? '#4caf50' : '#666666',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      marginBottom: '8px',
                      textTransform: 'uppercase'
                    }}>
                      Benefits
                    </h4>
                    <ul style={{
                      listStyle: 'none',
                      padding: 0,
                      margin: 0,
                      fontSize: '10px',
                      color: stage.unlocked ? 'rgba(255, 255, 255, 0.7)' : 'rgba(255, 255, 255, 0.4)'
                    }}>
                      {stage.benefits.map((benefit, i) => (
                        <li key={i} style={{ marginBottom: '4px' }}>
                          ✓ {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          marginTop: '24px',
          padding: '16px',
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '12px',
          border: '1px solid rgba(0, 188, 212, 0.2)'
        }}>
          <div style={{
            color: '#00bcd4',
            fontSize: '12px',
            fontWeight: 'bold',
            marginBottom: '8px'
          }}>
            🌟 Your Progress Matters
          </div>
          <div style={{
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '11px',
            lineHeight: '1.4'
          }}>
            Each interaction strengthens the entire FSN constellation. Your journey from Pulse to Beacon 
            creates pathways for others to follow and builds the decentralized future.
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pathGlow {
          0%, 100% { 
            box-shadow: 0 0 20px rgba(0, 188, 212, 0.4);
          }
          50% { 
            box-shadow: 0 0 30px rgba(0, 188, 212, 0.8);
          }
        }
      `}</style>
    </div>
  );
};

export default ConstellationPathModal;