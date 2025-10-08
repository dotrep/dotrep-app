import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface Picture6AbsoluteProps {
  xpPoints?: number;
  onXPUpdate?: () => void;
}

export default function Picture6Absolute({ xpPoints = 50, onXPUpdate }: Picture6AbsoluteProps) {
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  const xpMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/user/xp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 10 })
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/stats'] });
      onXPUpdate?.();
    }
  });

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/vault/upload', {
        method: 'POST',
        body: formData
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vault'] });
    }
  });

  const handleXPClick = () => xpMutation.mutate();
  const handleSimUpload = () => {
    const formData = new FormData();
    const blob = new Blob(['Simulated file content'], { type: 'text/plain' });
    formData.append('file', blob, `sim-file-${Date.now()}.txt`);
    uploadMutation.mutate(formData);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    uploadMutation.mutate(formData, {
      onSettled: () => setUploading(false)
    });
  };

  return (
    <div style={{
      position: 'relative',
      width: '100vw',
      height: '100vh',
      backgroundColor: '#000811',
      background: `
        radial-gradient(circle at 25% 25%, rgba(0, 30, 60, 0.4) 0%, transparent 60%),
        radial-gradient(circle at 75% 75%, rgba(0, 20, 40, 0.3) 0%, transparent 50%),
        linear-gradient(135deg, #000811 0%, #0f1419 50%, #1a1f2e 100%)
      `,
      overflow: 'hidden',
      fontFamily: 'Inter, sans-serif'
    }}>
      
      {/* Vertical divider line */}
      <div style={{
        position: 'absolute',
        left: '50%',
        top: '0',
        bottom: '0',
        width: '1px',
        backgroundColor: 'rgba(0, 180, 230, 0.3)',
        transform: 'translateX(-50%)'
      }} />
      
      {/* Left Panel - FSN Circle */}
      <div style={{
        position: 'absolute',
        left: '12.5%',
        top: '35%',
        transform: 'translate(-50%, -50%)'
      }}>
        <div style={{
          width: '280px',
          height: '280px',
          borderRadius: '50%',
          background: `
            radial-gradient(circle at center, 
              rgba(5, 20, 35, 1) 0%, 
              rgba(0, 40, 80, 0.95) 25%, 
              rgba(0, 60, 120, 0.8) 50%, 
              rgba(0, 100, 160, 0.6) 75%,
              rgba(0, 150, 200, 0.4) 100%
            )
          `,
          border: '3px solid rgba(0, 200, 255, 0.8)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
          boxShadow: `
            0 0 60px rgba(0, 200, 255, 0.5),
            inset 0 0 40px rgba(0, 80, 140, 0.4)
          `
        }}>
          {/* Outer ring */}
          <div style={{
            position: 'absolute',
            width: '250px',
            height: '250px',
            borderRadius: '50%',
            border: '2px solid rgba(0, 180, 230, 0.4)',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)'
          }} />
          
          {/* Inner ring */}
          <div style={{
            position: 'absolute',
            width: '220px',
            height: '220px',
            borderRadius: '50%',
            border: '1px solid rgba(0, 160, 200, 0.3)',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)'
          }} />
          
          {/* Center content */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            zIndex: 10
          }}>
            <div style={{
              color: '#00d4ff',
              fontSize: '20px',
              fontWeight: '600',
              letterSpacing: '0.1em',
              marginBottom: '8px',
              textShadow: '0 0 25px rgba(0, 212, 255, 1)'
            }}>+{xpPoints} XP</div>
            
            <div style={{
              color: '#ffffff',
              fontSize: '64px',
              fontWeight: '700',
              letterSpacing: '-0.02em',
              lineHeight: '1',
              textShadow: '0 0 40px rgba(255, 255, 255, 0.9)'
            }}>.fsn</div>
          </div>
        </div>
      </div>
      
      {/* Left Panel - Sentinel Badge */}
      <div style={{
        position: 'absolute',
        left: '12.5%',
        top: '65%',
        transform: 'translate(-50%, -50%)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{ 
            fontSize: '32px',
            filter: 'drop-shadow(0 0 15px rgba(0, 200, 255, 0.7))'
          }}>🛡️</div>
          <div>
            <div style={{
              color: '#ffffff',
              fontSize: '28px',
              fontWeight: '600',
              marginBottom: '4px',
              textShadow: '0 0 25px rgba(255, 255, 255, 0.8)'
            }}>Sentinel</div>
            <div style={{
              color: '#00d4ff',
              fontSize: '16px',
              fontWeight: '500',
              textShadow: '0 0 20px rgba(0, 212, 255, 0.9)'
            }}>Initial Pulse</div>
          </div>
        </div>
      </div>
      
      {/* Right Panel Background */}
      <div style={{
        position: 'absolute',
        left: '50%',
        top: '0',
        right: '0',
        bottom: '0',
        backgroundColor: 'rgba(5, 15, 25, 0.8)',
        backdropFilter: 'blur(8px)'
      }} />
      
      {/* Upload Section */}
      <div style={{
        position: 'absolute',
        left: '52%',
        right: '2%',
        top: '8%',
        height: '20%'
      }}>
        <h2 style={{
          color: '#ffffff',
          fontSize: '36px',
          fontWeight: '600',
          margin: '0 0 20px 0',
          textShadow: '0 0 30px rgba(255, 255, 255, 0.6)'
        }}>Upload</h2>
        <div 
          style={{
            border: '2px dashed rgba(0, 200, 255, 0.6)',
            borderRadius: '12px',
            padding: '30px 25px',
            textAlign: 'center',
            backgroundColor: 'rgba(0, 30, 60, 0.4)',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            height: '60px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onClick={() => document.getElementById('file-upload-input')?.click()}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(0, 200, 255, 1)';
            e.currentTarget.style.backgroundColor = 'rgba(0, 50, 100, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(0, 200, 255, 0.6)';
            e.currentTarget.style.backgroundColor = 'rgba(0, 30, 60, 0.4)';
          }}
        >
          <input
            id="file-upload-input"
            type="file"
            style={{ display: 'none' }}
            onChange={handleFileUpload}
            disabled={uploading}
          />
          <div style={{
            color: '#00d4ff',
            fontSize: '20px',
            fontWeight: '500',
            textShadow: '0 0 20px rgba(0, 212, 255, 0.9)'
          }}>{uploading ? 'Uploading...' : 'Click to upload files'}</div>
        </div>
      </div>

      {/* My Vault Files */}
      <div style={{
        position: 'absolute',
        left: '52%',
        right: '2%',
        top: '32%',
        height: '20%'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '20px'
        }}>
          <div style={{ 
            fontSize: '24px',
            filter: 'drop-shadow(0 0 12px rgba(255, 200, 0, 0.7))'
          }}>📁</div>
          <h3 style={{
            color: '#ffffff',
            fontSize: '24px',
            fontWeight: '600',
            margin: 0,
            textShadow: '0 0 25px rgba(255, 255, 255, 0.6)'
          }}>My Vault Files</h3>
        </div>
        
        <div style={{ display: 'grid', gap: '16px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{
              color: '#ffffff',
              fontSize: '16px',
              fontWeight: '500',
              textShadow: '0 0 15px rgba(255, 255, 255, 0.4)'
            }}>report.pdf</span>
            <span style={{
              color: '#00d4ff',
              fontSize: '12px',
              textShadow: '0 0 12px rgba(0, 212, 255, 0.7)'
            }}>4/24/2024</span>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{
              color: '#ffffff',
              fontSize: '16px',
              fontWeight: '500',
              textShadow: '0 0 15px rgba(255, 255, 255, 0.4)'
            }}>photo.png</span>
            <span style={{
              color: '#00d4ff',
              fontSize: '12px',
              textShadow: '0 0 12px rgba(0, 212, 255, 0.7)'
            }}>4/24/2024</span>
          </div>
        </div>
      </div>

      {/* Sentinel Progress */}
      <div style={{
        position: 'absolute',
        left: '52%',
        right: '2%',
        top: '56%',
        height: '20%'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '16px'
        }}>
          <div style={{ 
            fontSize: '24px',
            filter: 'drop-shadow(0 0 12px rgba(0, 200, 255, 0.7))'
          }}>▶️</div>
          <h3 style={{
            color: '#ffffff',
            fontSize: '24px',
            fontWeight: '600',
            margin: 0,
            textShadow: '0 0 25px rgba(255, 255, 255, 0.6)'
          }}>Sentinel</h3>
        </div>
        
        <div style={{
          backgroundColor: 'rgba(0, 20, 40, 0.8)',
          borderRadius: '16px',
          height: '12px',
          overflow: 'hidden',
          marginBottom: '12px',
          border: '1px solid rgba(0, 180, 230, 0.4)'
        }}>
          <div style={{
            background: 'linear-gradient(90deg, #00d4ff 0%, #0088cc 100%)',
            height: '100%',
            width: '96%',
            borderRadius: '16px',
            boxShadow: '0 0 20px rgba(0, 212, 255, 0.9)'
          }} />
        </div>
        <div style={{
          color: '#ffffff',
          fontSize: '16px',
          fontWeight: '600',
          textShadow: '0 0 20px rgba(255, 255, 255, 0.5)'
        }}>960 / 1000 XP</div>
      </div>

      {/* Debug Panel */}
      <div style={{
        position: 'absolute',
        left: '52%',
        right: '2%',
        top: '80%',
        height: '18%',
        borderTop: '1px solid rgba(0, 180, 230, 0.5)',
        paddingTop: '20px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{
            color: '#ffffff',
            fontSize: '20px',
            fontWeight: '600',
            textShadow: '0 0 25px rgba(255, 255, 255, 0.6)'
          }}>Debug Panel</span>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handleXPClick}
              style={{
                backgroundColor: 'rgba(0, 200, 255, 0.25)',
                border: '2px solid #00d4ff',
                borderRadius: '6px',
                color: '#00d4ff',
                fontSize: '12px',
                padding: '6px 12px',
                cursor: 'pointer',
                fontWeight: '600',
                transition: 'all 0.3s ease'
              }}
            >
              +10 XP
            </button>
            <button
              onClick={handleSimUpload}
              style={{
                backgroundColor: 'rgba(80, 120, 160, 0.35)',
                border: '2px solid rgba(120, 160, 200, 0.7)',
                borderRadius: '6px',
                color: '#ffffff',
                fontSize: '12px',
                padding: '6px 12px',
                cursor: 'pointer',
                fontWeight: '600',
                transition: 'all 0.3s ease'
              }}
            >
              Sim Upload
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}