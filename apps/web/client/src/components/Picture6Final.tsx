import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface Picture6FinalProps {
  xpPoints?: number;
  onXPUpdate?: () => void;
}

export default function Picture6Final({ xpPoints = 50, onXPUpdate }: Picture6FinalProps) {
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

  const handleXPClick = () => {
    xpMutation.mutate();
  };

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
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      height: '100vh',
      backgroundColor: '#000511',
      background: `
        radial-gradient(circle at 25% 25%, rgba(0, 30, 60, 0.4) 0%, transparent 60%),
        radial-gradient(circle at 75% 75%, rgba(0, 20, 40, 0.3) 0%, transparent 50%),
        linear-gradient(135deg, #000511 0%, #0f1419 50%, #1a1f2e 100%)
      `,
      overflow: 'hidden',
      fontFamily: 'Inter, sans-serif'
    }}>
      
      {/* Left Panel - FSN Circle & Sentinel */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '40px',
        position: 'relative'
      }}>
        
        {/* FSN Circle with exact styling */}
        <div style={{
          width: '320px',
          height: '320px',
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
          `,
          marginBottom: '80px'
        }}>
          
          {/* Outer ring */}
          <div style={{
            position: 'absolute',
            width: '280px',
            height: '280px',
            borderRadius: '50%',
            border: '2px solid rgba(0, 180, 230, 0.4)',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)'
          }} />
          
          {/* Inner ring */}
          <div style={{
            position: 'absolute',
            width: '240px',
            height: '240px',
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
            {/* +50 XP */}
            <div style={{
              color: '#00d4ff',
              fontSize: '22px',
              fontWeight: '600',
              letterSpacing: '0.1em',
              marginBottom: '12px',
              textShadow: '0 0 25px rgba(0, 212, 255, 1)'
            }}>+{xpPoints} XP</div>
            
            {/* .fsn */}
            <div style={{
              color: '#ffffff',
              fontSize: '72px',
              fontWeight: '700',
              letterSpacing: '-0.02em',
              lineHeight: '1',
              textShadow: '0 0 40px rgba(255, 255, 255, 0.9)'
            }}>.fsn</div>
          </div>
        </div>
        
        {/* Sentinel Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '20px'
        }}>
          <div style={{ 
            fontSize: '36px',
            filter: 'drop-shadow(0 0 15px rgba(0, 200, 255, 0.7))'
          }}>🛡️</div>
          <div>
            <div style={{
              color: '#ffffff',
              fontSize: '32px',
              fontWeight: '600',
              marginBottom: '6px',
              textShadow: '0 0 25px rgba(255, 255, 255, 0.8)'
            }}>Sentinel</div>
            <div style={{
              color: '#00d4ff',
              fontSize: '18px',
              fontWeight: '500',
              textShadow: '0 0 20px rgba(0, 212, 255, 0.9)'
            }}>Initial Pulse</div>
          </div>
        </div>
      </div>
      
      {/* Right Panel - Content Stack */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        padding: '60px 50px 40px 50px',
        backgroundColor: 'rgba(5, 15, 25, 0.8)',
        borderLeft: '1px solid rgba(0, 180, 230, 0.3)',
        backdropFilter: 'blur(8px)',
        gap: '0px'
      }}>
        
        {/* Upload Section */}
        <div style={{ marginBottom: '50px' }}>
          <h2 style={{
            color: '#ffffff',
            fontSize: '40px',
            fontWeight: '600',
            margin: '0 0 25px 0',
            textShadow: '0 0 30px rgba(255, 255, 255, 0.6)'
          }}>Upload</h2>
          <div 
            style={{
              border: '2px dashed rgba(0, 200, 255, 0.6)',
              borderRadius: '12px',
              padding: '45px 30px',
              textAlign: 'center',
              backgroundColor: 'rgba(0, 30, 60, 0.4)',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              backdropFilter: 'blur(4px)'
            }}
            onClick={() => document.getElementById('file-upload-input')?.click()}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(0, 200, 255, 1)';
              e.currentTarget.style.backgroundColor = 'rgba(0, 50, 100, 0.5)';
              e.currentTarget.style.boxShadow = '0 0 40px rgba(0, 200, 255, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(0, 200, 255, 0.6)';
              e.currentTarget.style.backgroundColor = 'rgba(0, 30, 60, 0.4)';
              e.currentTarget.style.boxShadow = 'none';
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
              fontSize: '22px',
              fontWeight: '500',
              textShadow: '0 0 20px rgba(0, 212, 255, 0.9)'
            }}>{uploading ? 'Uploading...' : 'Click to upload files'}</div>
          </div>
        </div>

        {/* My Vault Files */}
        <div style={{ marginBottom: '45px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '18px',
            marginBottom: '25px'
          }}>
            <div style={{ 
              fontSize: '28px',
              filter: 'drop-shadow(0 0 12px rgba(255, 200, 0, 0.7))'
            }}>📁</div>
            <h3 style={{
              color: '#ffffff',
              fontSize: '28px',
              fontWeight: '600',
              margin: 0,
              textShadow: '0 0 25px rgba(255, 255, 255, 0.6)'
            }}>My Vault Files</h3>
          </div>
          
          <div style={{ display: 'grid', gap: '18px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingBottom: '12px'
            }}>
              <span style={{
                color: '#ffffff',
                fontSize: '18px',
                fontWeight: '500',
                textShadow: '0 0 15px rgba(255, 255, 255, 0.4)'
              }}>report.pdf</span>
              <span style={{
                color: '#00d4ff',
                fontSize: '14px',
                textShadow: '0 0 12px rgba(0, 212, 255, 0.7)'
              }}>4/24/2024</span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingBottom: '12px'
            }}>
              <span style={{
                color: '#ffffff',
                fontSize: '18px',
                fontWeight: '500',
                textShadow: '0 0 15px rgba(255, 255, 255, 0.4)'
              }}>photo.png</span>
              <span style={{
                color: '#00d4ff',
                fontSize: '14px',
                textShadow: '0 0 12px rgba(0, 212, 255, 0.7)'
              }}>4/24/2024</span>
            </div>
          </div>
        </div>

        {/* Sentinel Progress */}
        <div style={{ marginBottom: '40px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '18px',
            marginBottom: '20px'
          }}>
            <div style={{ 
              fontSize: '28px',
              filter: 'drop-shadow(0 0 12px rgba(0, 200, 255, 0.7))'
            }}>▶️</div>
            <h3 style={{
              color: '#ffffff',
              fontSize: '28px',
              fontWeight: '600',
              margin: 0,
              textShadow: '0 0 25px rgba(255, 255, 255, 0.6)'
            }}>Sentinel</h3>
          </div>
          
          <div style={{
            backgroundColor: 'rgba(0, 20, 40, 0.8)',
            borderRadius: '20px',
            height: '16px',
            overflow: 'hidden',
            marginBottom: '15px',
            border: '1px solid rgba(0, 180, 230, 0.4)'
          }}>
            <div style={{
              background: 'linear-gradient(90deg, #00d4ff 0%, #0088cc 100%)',
              height: '100%',
              width: '96%',
              borderRadius: '20px',
              boxShadow: '0 0 25px rgba(0, 212, 255, 0.9)',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.4) 50%, transparent 100%)',
                borderRadius: '20px'
              }} />
            </div>
          </div>
          <div style={{
            color: '#ffffff',
            fontSize: '18px',
            fontWeight: '600',
            textShadow: '0 0 20px rgba(255, 255, 255, 0.5)'
          }}>960 / 1000 XP</div>
        </div>

        {/* Debug Panel */}
        <div style={{
          borderTop: '1px solid rgba(0, 180, 230, 0.5)',
          paddingTop: '25px',
          marginTop: 'auto'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{
              color: '#ffffff',
              fontSize: '24px',
              fontWeight: '600',
              textShadow: '0 0 25px rgba(255, 255, 255, 0.6)'
            }}>Debug Panel</span>
            <div style={{ display: 'flex', gap: '15px' }}>
              <button
                onClick={handleXPClick}
                style={{
                  backgroundColor: 'rgba(0, 200, 255, 0.25)',
                  border: '2px solid #00d4ff',
                  borderRadius: '8px',
                  color: '#00d4ff',
                  fontSize: '14px',
                  padding: '8px 16px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  transition: 'all 0.3s ease',
                  textShadow: '0 0 15px rgba(0, 212, 255, 0.9)',
                  backdropFilter: 'blur(4px)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(0, 200, 255, 0.4)';
                  e.currentTarget.style.boxShadow = '0 0 30px rgba(0, 200, 255, 0.7)';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(0, 200, 255, 0.25)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                +10 XP
              </button>
              <button
                onClick={handleSimUpload}
                style={{
                  backgroundColor: 'rgba(80, 120, 160, 0.35)',
                  border: '2px solid rgba(120, 160, 200, 0.7)',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '14px',
                  padding: '8px 16px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  transition: 'all 0.3s ease',
                  backdropFilter: 'blur(4px)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(120, 160, 200, 0.5)';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(80, 120, 160, 0.35)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                Sim Upload
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}