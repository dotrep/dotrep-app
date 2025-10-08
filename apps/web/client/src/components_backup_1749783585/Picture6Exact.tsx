import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface Picture6ExactProps {
  xpPoints?: number;
  onXPUpdate?: () => void;
}

export default function Picture6Exact({ xpPoints = 50, onXPUpdate }: Picture6ExactProps) {
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
      backgroundColor: '#0a0a0a',
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
      overflow: 'hidden'
    }}>
      
      {/* Left Panel - FSN Circle & Sentinel */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '5vh 3vw'
      }}>
        
        {/* FSN Circle */}
        <div style={{
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: `
            radial-gradient(circle at center, 
              rgba(10, 30, 50, 1) 0%, 
              rgba(0, 50, 100, 0.9) 30%, 
              rgba(0, 80, 140, 0.7) 60%, 
              rgba(0, 120, 180, 0.5) 80%,
              rgba(0, 212, 255, 0.3) 100%
            )
          `,
          border: '3px solid rgba(0, 212, 255, 0.8)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
          boxShadow: `
            0 0 50px rgba(0, 212, 255, 0.4),
            inset 0 0 50px rgba(0, 100, 150, 0.2)
          `,
          marginBottom: '80px'
        }}>
          
          {/* Multiple concentric circles */}
          <div style={{
            position: 'absolute',
            width: '250px',
            height: '250px',
            borderRadius: '50%',
            border: '2px solid rgba(0, 212, 255, 0.3)',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)'
          }} />
          
          <div style={{
            position: 'absolute',
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            border: '1px solid rgba(0, 212, 255, 0.2)',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)'
          }} />
          
          {/* +50 XP */}
          <div style={{
            color: '#00d4ff',
            fontSize: '24px',
            fontWeight: '600',
            letterSpacing: '0.1em',
            marginBottom: '10px',
            textShadow: '0 0 20px rgba(0, 212, 255, 1)',
            zIndex: 2
          }}>+{xpPoints} XP</div>
          
          {/* .fsn */}
          <div style={{
            color: '#ffffff',
            fontSize: '80px',
            fontWeight: '700',
            letterSpacing: '-0.02em',
            textShadow: '0 0 30px rgba(255, 255, 255, 0.8)',
            zIndex: 2
          }}>.fsn</div>
        </div>
        
        {/* Sentinel Section */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '20px'
        }}>
          <div style={{ 
            fontSize: '40px',
            filter: 'drop-shadow(0 0 10px rgba(0, 212, 255, 0.6))'
          }}>🛡️</div>
          <div>
            <div style={{
              color: '#ffffff',
              fontSize: '36px',
              fontWeight: '600',
              marginBottom: '8px',
              textShadow: '0 0 20px rgba(255, 255, 255, 0.6)'
            }}>Sentinel</div>
            <div style={{
              color: '#00d4ff',
              fontSize: '20px',
              fontWeight: '500',
              textShadow: '0 0 15px rgba(0, 212, 255, 0.8)'
            }}>Initial Pulse</div>
          </div>
        </div>
      </div>
      
      {/* Right Panel - Content */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        padding: '60px 50px',
        gap: '50px',
        backgroundColor: 'rgba(5, 15, 25, 0.6)',
        borderLeft: '1px solid rgba(0, 212, 255, 0.3)',
        backdropFilter: 'blur(10px)'
      }}>
        
        {/* Upload */}
        <div>
          <h2 style={{
            color: '#ffffff',
            fontSize: '42px',
            fontWeight: '600',
            margin: '0 0 30px 0',
            textShadow: '0 0 25px rgba(255, 255, 255, 0.5)'
          }}>Upload</h2>
          <div 
            style={{
              border: '2px dashed rgba(0, 212, 255, 0.6)',
              borderRadius: '15px',
              padding: '50px 30px',
              textAlign: 'center',
              backgroundColor: 'rgba(0, 30, 60, 0.3)',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              backdropFilter: 'blur(5px)'
            }}
            onClick={() => document.getElementById('file-upload-input')?.click()}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(0, 212, 255, 1)';
              e.currentTarget.style.backgroundColor = 'rgba(0, 50, 100, 0.4)';
              e.currentTarget.style.boxShadow = '0 0 30px rgba(0, 212, 255, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(0, 212, 255, 0.6)';
              e.currentTarget.style.backgroundColor = 'rgba(0, 30, 60, 0.3)';
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
              fontSize: '24px',
              fontWeight: '500',
              textShadow: '0 0 15px rgba(0, 212, 255, 0.8)'
            }}>{uploading ? 'Uploading...' : 'Click to upload files'}</div>
          </div>
        </div>

        {/* My Vault Files */}
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            marginBottom: '30px'
          }}>
            <div style={{ 
              fontSize: '32px',
              filter: 'drop-shadow(0 0 10px rgba(255, 200, 0, 0.6))'
            }}>📁</div>
            <h3 style={{
              color: '#ffffff',
              fontSize: '32px',
              fontWeight: '600',
              margin: 0,
              textShadow: '0 0 20px rgba(255, 255, 255, 0.5)'
            }}>My Vault Files</h3>
          </div>
          
          <div style={{ display: 'grid', gap: '20px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingBottom: '15px',
              borderBottom: '1px solid rgba(0, 212, 255, 0.4)'
            }}>
              <span style={{
                color: '#ffffff',
                fontSize: '20px',
                fontWeight: '500',
                textShadow: '0 0 10px rgba(255, 255, 255, 0.3)'
              }}>report.pdf</span>
              <span style={{
                color: '#00d4ff',
                fontSize: '16px',
                textShadow: '0 0 10px rgba(0, 212, 255, 0.6)'
              }}>4/24/2024</span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingBottom: '15px',
              borderBottom: '1px solid rgba(0, 212, 255, 0.4)'
            }}>
              <span style={{
                color: '#ffffff',
                fontSize: '20px',
                fontWeight: '500',
                textShadow: '0 0 10px rgba(255, 255, 255, 0.3)'
              }}>photo.png</span>
              <span style={{
                color: '#00d4ff',
                fontSize: '16px',
                textShadow: '0 0 10px rgba(0, 212, 255, 0.6)'
              }}>4/24/2024</span>
            </div>
          </div>
        </div>

        {/* Sentinel Progress */}
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            marginBottom: '25px'
          }}>
            <div style={{ 
              fontSize: '32px',
              filter: 'drop-shadow(0 0 10px rgba(0, 212, 255, 0.6))'
            }}>▶️</div>
            <h3 style={{
              color: '#ffffff',
              fontSize: '32px',
              fontWeight: '600',
              margin: 0,
              textShadow: '0 0 20px rgba(255, 255, 255, 0.5)'
            }}>Sentinel</h3>
          </div>
          
          <div style={{
            backgroundColor: 'rgba(0, 30, 60, 0.6)',
            borderRadius: '25px',
            height: '20px',
            overflow: 'hidden',
            marginBottom: '20px',
            border: '1px solid rgba(0, 212, 255, 0.3)'
          }}>
            <div style={{
              background: 'linear-gradient(90deg, #00d4ff 0%, #0099cc 100%)',
              height: '100%',
              width: '96%',
              borderRadius: '25px',
              boxShadow: '0 0 20px rgba(0, 212, 255, 0.8)',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.3) 50%, transparent 100%)',
                borderRadius: '25px'
              }} />
            </div>
          </div>
          <div style={{
            color: '#ffffff',
            fontSize: '20px',
            fontWeight: '600',
            textShadow: '0 0 15px rgba(255, 255, 255, 0.4)'
          }}>960 / 1000 XP</div>
        </div>

        {/* Debug Panel */}
        <div style={{
          borderTop: '1px solid rgba(0, 212, 255, 0.4)',
          paddingTop: '30px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{
              color: '#ffffff',
              fontSize: '28px',
              fontWeight: '600',
              textShadow: '0 0 20px rgba(255, 255, 255, 0.5)'
            }}>Debug Panel</span>
            <div style={{ display: 'flex', gap: '20px' }}>
              <button
                onClick={handleXPClick}
                style={{
                  backgroundColor: 'rgba(0, 212, 255, 0.2)',
                  border: '2px solid #00d4ff',
                  borderRadius: '10px',
                  color: '#00d4ff',
                  fontSize: '16px',
                  padding: '10px 20px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  transition: 'all 0.3s ease',
                  textShadow: '0 0 10px rgba(0, 212, 255, 0.8)',
                  backdropFilter: 'blur(5px)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(0, 212, 255, 0.4)';
                  e.currentTarget.style.boxShadow = '0 0 25px rgba(0, 212, 255, 0.6)';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(0, 212, 255, 0.2)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                +10 XP
              </button>
              <button
                onClick={handleSimUpload}
                style={{
                  backgroundColor: 'rgba(100, 150, 200, 0.3)',
                  border: '2px solid rgba(150, 200, 255, 0.6)',
                  borderRadius: '10px',
                  color: '#ffffff',
                  fontSize: '16px',
                  padding: '10px 20px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  transition: 'all 0.3s ease',
                  backdropFilter: 'blur(5px)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(150, 200, 255, 0.4)';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(100, 150, 200, 0.3)';
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