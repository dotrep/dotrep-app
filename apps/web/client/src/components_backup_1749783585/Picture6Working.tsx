import React, { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';

interface Picture6WorkingProps {
  userId?: number;
  fsnName?: string;
}

const Picture6Working: React.FC<Picture6WorkingProps> = ({ 
  userId = 13, 
  fsnName = 'rachel' 
}) => {
  const [uploading, setUploading] = useState(false);
  const [showXpGain, setShowXpGain] = useState(false);
  const queryClient = useQueryClient();

  // Fetch user stats
  const { data: userStats } = useQuery({
    queryKey: [`/api/user/stats/${userId}`],
    enabled: !!userId,
  });

  // Fetch vault items
  const { data: vaultItems = [] } = useQuery<any[]>({
    queryKey: [`/api/vault/users/${userId}/items`],
    enabled: !!userId,
  });

  const totalXP = (userStats as any)?.xpPoints || 170;
  const maxXP = 1000;
  const progressPercent = Math.min((totalXP / maxXP) * 100, 100);

  // XP mutation
  const addXPMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/user/stats/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ xpPoints: totalXP + 10 })
      });
      if (!response.ok) throw new Error('Failed to add XP');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/user/stats/${userId}`] });
      setShowXpGain(true);
      setTimeout(() => setShowXpGain(false), 2000);
    }
  });

  // File upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const reader = new FileReader();
      return new Promise((resolve, reject) => {
        reader.onload = async (e) => {
          try {
            const fileContent = e.target?.result as string;
            const uploadData = {
              userId,
              fsnName,
              itemType: 'file',
              data: fileContent,
              password: 'fsn-vault-access',
              fileName: file.name
            };

            const response = await fetch('/api/vault/items', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(uploadData)
            });

            if (!response.ok) throw new Error('Upload failed');
            const result = await response.json();
            resolve(result);
          } catch (error) {
            reject(error);
          }
        };
        reader.readAsDataURL(file);
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vault/users/${userId}/items`] });
      queryClient.invalidateQueries({ queryKey: [`/api/user/stats/${userId}`] });
      setUploading(false);
      setShowXpGain(true);
      setTimeout(() => setShowXpGain(false), 2000);
    },
    onError: () => {
      setUploading(false);
    }
  });

  const handleXPClick = () => {
    addXPMutation.mutate();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    uploadMutation.mutate(file);
  };

  const handleSimUpload = () => {
    setShowXpGain(true);
    setTimeout(() => setShowXpGain(false), 2000);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0f1c 0%, #0d1420 14%, #1a2332 28%, #162028 42%, #0f1419 56%, #121a23 70%, #0b1118 84%, #0a0f1c 100%)',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      padding: 0,
      paddingTop: '8vh',
      overflow: 'hidden',
      fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{
        display: 'flex',
        width: '100%',
        height: '92vh',
        alignItems: 'flex-start',
        maxWidth: '1800px',
        position: 'relative'
      }}>
        
        {/* Left Side - TRON-style FSN Circle */}
        <div style={{
          width: '38.2%',
          height: '100%',
          position: 'relative',
          background: 'linear-gradient(45deg, rgba(10, 15, 28, 0.3) 0%, rgba(26, 35, 50, 0.2) 100%)'
        }}>
          {/* TRON-Style Circle Container */}
          <div style={{
            position: 'absolute',
            width: '24vw',
            height: '24vw',
            left: '15%',
            top: '25vh',
            transform: 'translate(-8%, -12%)',
            transformOrigin: 'center center'
          }}>
            {/* Outermost Ring - Glowing */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              border: '0.25vw solid #00d4ff',
              borderRadius: '50%',
              animation: 'pulse 3s cubic-bezier(0.23, 1, 0.32, 1) infinite',
              boxShadow: '0 0 2.5vw rgba(0, 212, 255, 0.8), 0 0 5vw rgba(0, 212, 255, 0.4), inset 0 0 2.5vw rgba(0, 212, 255, 0.25)',
              willChange: 'transform, opacity'
            }}></div>
            
            {/* Second Ring */}
            <div style={{
              position: 'absolute',
              top: '7.5%',
              left: '7.5%',
              width: '85%',
              height: '85%',
              border: '0.2vw solid #00a8cc',
              borderRadius: '50%',
              boxShadow: '0 0 1.5vw rgba(0, 168, 204, 0.6), inset 0 0 1vw rgba(0, 168, 204, 0.2)'
            }}></div>
            
            {/* Third Ring */}
            <div style={{
              position: 'absolute',
              top: '12.5%',
              left: '12.5%',
              width: '75%',
              height: '75%',
              border: '0.15vw solid #007a99',
              borderRadius: '50%',
              boxShadow: '0 0 1vw rgba(0, 122, 153, 0.5), inset 0 0 0.5vw rgba(0, 122, 153, 0.15)'
            }}></div>
            
            {/* Inner Core Circle */}
            <div style={{
              position: 'absolute',
              top: '20%',
              left: '20%',
              width: '60%',
              height: '60%',
              backgroundColor: 'rgba(0, 8, 18, 0.98)',
              border: '0.2vw solid #00d4ff',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'inset 0 0 3vw rgba(0, 212, 255, 0.4), 0 0 2vw rgba(0, 212, 255, 0.7), 0 0 4vw rgba(0, 212, 255, 0.3)',
              backdropFilter: 'blur(2px)',
              contain: 'layout style paint'
            }}>
              {/* XP Badge */}
              <div style={{
                position: 'absolute',
                top: '-25px',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: 'rgba(0, 20, 40, 0.9)',
                border: '2px solid #00d4ff',
                borderRadius: '12px',
                padding: '10px 20px',
                zIndex: 10,
                boxShadow: '0 0 20px rgba(0, 212, 255, 0.5)'
              }}>
                <span style={{
                  color: '#00d4ff',
                  fontSize: '20px',
                  fontWeight: 'bold',
                  textShadow: '0 0 10px rgba(0, 212, 255, 0.8)'
                }}>{showXpGain ? '+10 XP' : `+50 XP`}</span>
              </div>
              
              {/* Floating XP Animation */}
              {showXpGain && (
                <div style={{
                  position: 'absolute',
                  top: '-80px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  color: '#00d4ff',
                  fontSize: '28px',
                  fontWeight: 'bold',
                  animation: 'floatUp 2s ease-out forwards',
                  zIndex: 20,
                  pointerEvents: 'none',
                  textShadow: '0 0 15px rgba(0, 212, 255, 1)'
                }}>
                  +10 XP
                </div>
              )}
              
              {/* Central .fsn Text */}
              <span style={{
                color: '#ffffff',
                fontSize: 'clamp(32px, 4.2vw, 76px)',
                fontWeight: '650',
                letterSpacing: '-0.02em',
                lineHeight: '1.168',
                fontFamily: 'Inter, sans-serif',
                textShadow: '0 0 1.5vw rgba(0, 212, 255, 0.9), 0 0 3vw rgba(0, 212, 255, 0.5), 0 0 0.3vw rgba(255, 255, 255, 0.3)',
                transform: 'translateZ(0)',
                willChange: 'transform'
              }}>.fsn</span>
            </div>
          </div>
          
          {/* Sentinel Status Below Circle */}
          <div style={{
            position: 'absolute',
            left: '15%',
            top: '70vh',
            transform: 'translate(-8%, 0)',
            display: 'flex',
            alignItems: 'center',
            gap: '1.2vw',
            backgroundColor: 'rgba(0, 12, 25, 0.92)',
            border: '0.15vw solid rgba(0, 212, 255, 0.6)',
            borderRadius: '0.8vw',
            padding: '1.3vw 2.2vw',
            boxShadow: '0 0 2vw rgba(0, 212, 255, 0.4), 0 0 4vw rgba(0, 212, 255, 0.2), inset 0 0 1vw rgba(0, 212, 255, 0.1)',
            width: 'fit-content',
            backdropFilter: 'blur(3px)',
            contain: 'layout style paint'
          }}>
            {/* Shield Icon */}
            <div style={{
              fontSize: 'clamp(24px, 2.3vw, 42px)'
            }}>🛡️</div>
            <div>
              <h3 style={{
                color: '#ffffff',
                fontSize: 'clamp(20px, 2.1vw, 38px)',
                fontWeight: '650',
                letterSpacing: '-0.015em',
                margin: 0,
                marginBottom: '0.3vw',
                textShadow: '0 0 0.8vw rgba(255, 255, 255, 0.3)'
              }}>Sentinel</h3>
              <p style={{
                color: '#00d4ff',
                fontSize: 'clamp(12px, 1.2vw, 22px)',
                fontWeight: '550',
                letterSpacing: '0.01em',
                margin: 0,
                textShadow: '0 0 0.5vw rgba(0, 212, 255, 0.6)'
              }}>Initial Pulse</p>
            </div>
          </div>
        </div>

        {/* Right Side - Vault Panel */}
        <div style={{
          width: '61.8%',
          height: '100%',
          position: 'relative',
          background: 'linear-gradient(225deg, rgba(0, 8, 18, 0.4) 0%, rgba(0, 15, 30, 0.6) 100%)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          paddingTop: '5vh'
        }}>
          <div style={{
            backgroundColor: 'rgba(0, 5, 12, 0.95)',
            border: '0.1vw solid rgba(0, 212, 255, 0.25)',
            borderRadius: '0.4vw',
            padding: '3.5vh 2.8vw',
            boxShadow: '0 0 2.5vw rgba(0, 212, 255, 0.15), inset 0 0 1.5vw rgba(0, 212, 255, 0.05)',
            width: '95%',
            maxWidth: '38vw',
            height: '85vh',
            overflow: 'auto',
            backdropFilter: 'blur(4px)',
            contain: 'layout style paint',
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(0, 212, 255, 0.3) transparent',
            transform: 'translateX(2.3%)'
          }}>
            
            {/* Upload Section */}
            <div style={{
              marginBottom: '3.5vh',
              display: 'grid',
              gap: '2.1vh'
            }}>
              <h2 style={{
                color: '#ffffff',
                fontSize: 'clamp(28px, 3.2vw, 58px)',
                fontWeight: '650',
                letterSpacing: '-0.02em',
                lineHeight: '1.168',
                margin: 0,
                textAlign: 'left',
                textShadow: '0 0 1vw rgba(255, 255, 255, 0.4), 0 0 2vw rgba(0, 212, 255, 0.3)',
                transform: 'translateZ(0)'
              }}>Upload</h2>
              <div 
                style={{
                  border: '0.15vw dashed rgba(0, 212, 255, 0.6)',
                  borderRadius: '0.8vw',
                  padding: '3.5vh 2.8vw',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.23, 1, 0.32, 1)',
                  textAlign: 'center',
                  backgroundColor: 'rgba(0, 30, 60, 0.2)',
                  backdropFilter: 'blur(2px)',
                  willChange: 'transform, border-color'
                }}
                onClick={() => document.getElementById('file-upload-input')?.click()}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(0, 212, 255, 0.9)';
                  e.currentTarget.style.backgroundColor = 'rgba(0, 50, 100, 0.35)';
                  e.currentTarget.style.transform = 'scale(1.02)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(0, 212, 255, 0.6)';
                  e.currentTarget.style.backgroundColor = 'rgba(0, 30, 60, 0.2)';
                  e.currentTarget.style.transform = 'scale(1)';
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
                  fontSize: 'clamp(16px, 1.8vw, 32px)',
                  fontWeight: '550',
                  letterSpacing: '0.01em',
                  textShadow: '0 0 0.8vw rgba(0, 212, 255, 0.5)'
                }}>{uploading ? 'Uploading...' : 'Click to upload files'}</div>
              </div>
            </div>

            {/* My Vault Files */}
            <div style={{
              marginBottom: '3.5vh',
              display: 'grid',
              gap: '2.1vh'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1.1vw'
              }}>
                <div style={{
                  fontSize: 'clamp(20px, 2.1vw, 38px)'
                }}>📁</div>
                <h3 style={{
                  color: '#ffffff',
                  fontSize: 'clamp(24px, 2.8vw, 50px)',
                  fontWeight: '650',
                  letterSpacing: '-0.02em',
                  lineHeight: '1.168',
                  margin: 0,
                  textShadow: '0 0 1vw rgba(255, 255, 255, 0.4), 0 0 2vw rgba(0, 212, 255, 0.3)'
                }}>My Vault Files</h3>
              </div>
              
              <div style={{
                display: 'grid',
                gap: '1.3vh'
              }}>
                {/* Static files matching reference */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  alignItems: 'center',
                  padding: '1.3vh 0',
                  borderBottom: '0.1vw solid rgba(0, 212, 255, 0.25)'
                }}>
                  <span style={{
                    color: '#ffffff',
                    fontSize: 'clamp(18px, 1.9vw, 34px)',
                    fontWeight: '550',
                    letterSpacing: '-0.01em',
                    textShadow: '0 0 0.5vw rgba(255, 255, 255, 0.3)'
                  }}>report.pdf</span>
                  <span style={{
                    color: '#00d4ff',
                    fontSize: 'clamp(14px, 1.5vw, 28px)',
                    fontWeight: '550',
                    letterSpacing: '0.005em',
                    textShadow: '0 0 0.4vw rgba(0, 212, 255, 0.6)'
                  }}>4/24/2024</span>
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  alignItems: 'center',
                  padding: '1.3vh 0',
                  borderBottom: '0.1vw solid rgba(0, 212, 255, 0.25)'
                }}>
                  <span style={{
                    color: '#ffffff',
                    fontSize: 'clamp(18px, 1.9vw, 34px)',
                    fontWeight: '550',
                    letterSpacing: '-0.01em',
                    textShadow: '0 0 0.5vw rgba(255, 255, 255, 0.3)'
                  }}>photo.png</span>
                  <span style={{
                    color: '#00d4ff',
                    fontSize: 'clamp(14px, 1.5vw, 28px)',
                    fontWeight: '550',
                    letterSpacing: '0.005em',
                    textShadow: '0 0 0.4vw rgba(0, 212, 255, 0.6)'
                  }}>4/24/2024</span>
                </div>
              </div>
            </div>

            {/* Sentinel Progress */}
            <div style={{
              marginBottom: '3.5vh',
              display: 'grid',
              gap: '1.6vh'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1.1vw'
              }}>
                <div style={{
                  fontSize: 'clamp(20px, 2.1vw, 38px)'
                }}>▶️</div>
                <h3 style={{
                  color: '#ffffff',
                  fontSize: 'clamp(24px, 2.8vw, 50px)',
                  fontWeight: '650',
                  letterSpacing: '-0.02em',
                  lineHeight: '1.168',
                  margin: 0,
                  textShadow: '0 0 1vw rgba(255, 255, 255, 0.4), 0 0 2vw rgba(0, 212, 255, 0.3)'
                }}>Sentinel</h3>
              </div>
              
              {/* Progress Bar */}
              <div style={{
                display: 'grid',
                gap: '1.3vh'
              }}>
                <div style={{
                  backgroundColor: 'rgba(0, 30, 60, 0.7)',
                  borderRadius: '0.8vw',
                  height: '1.6vh',
                  overflow: 'hidden',
                  border: '0.1vw solid rgba(0, 212, 255, 0.5)',
                  boxShadow: 'inset 0 0 0.5vw rgba(0, 0, 0, 0.3)'
                }}>
                  <div style={{
                    background: 'linear-gradient(90deg, #00d4ff 0%, #0099cc 50%, #00a8cc 100%)',
                    height: '100%',
                    width: '96%',
                    borderRadius: '0.8vw',
                    transition: 'width 0.5s cubic-bezier(0.23, 1, 0.32, 1)',
                    boxShadow: '0 0 1vw rgba(0, 212, 255, 0.8), inset 0 0 0.3vw rgba(255, 255, 255, 0.3)'
                  }}></div>
                </div>
                <div>
                  <span style={{
                    color: '#ffffff',
                    fontSize: 'clamp(20px, 2.1vw, 38px)',
                    fontWeight: '650',
                    letterSpacing: '-0.015em',
                    textShadow: '0 0 0.8vw rgba(255, 255, 255, 0.4)'
                  }}>960 / 1000 XP</span>
                </div>
              </div>
            </div>

            {/* Debug Panel */}
            <div style={{
              borderTop: '0.15vw solid rgba(0, 212, 255, 0.35)',
              paddingTop: '2.1vh',
              display: 'grid',
              gap: '1.3vh'
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                alignItems: 'center',
                gap: '1.3vw'
              }}>
                <span style={{
                  color: '#ffffff',
                  fontSize: 'clamp(22px, 2.5vw, 44px)',
                  fontWeight: '650',
                  letterSpacing: '-0.02em',
                  textShadow: '0 0 1vw rgba(255, 255, 255, 0.4)'
                }}>Debug Panel</span>
                <div style={{
                  display: 'flex',
                  gap: '1.3vw'
                }}>
                  <button
                    onClick={handleXPClick}
                    style={{
                      backgroundColor: 'rgba(0, 212, 255, 0.25)',
                      border: '0.1vw solid #00d4ff',
                      borderRadius: '0.5vw',
                      color: '#00d4ff',
                      fontSize: 'clamp(14px, 1.3vw, 24px)',
                      padding: '0.8vh 1.6vw',
                      cursor: 'pointer',
                      fontWeight: '650',
                      letterSpacing: '-0.01em',
                      transition: 'all 0.3s cubic-bezier(0.23, 1, 0.32, 1)',
                      backdropFilter: 'blur(2px)',
                      willChange: 'transform, background-color'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(0, 212, 255, 0.45)';
                      e.currentTarget.style.boxShadow = '0 0 1.3vw rgba(0, 212, 255, 0.7)';
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(0, 212, 255, 0.25)';
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
                      border: '0.1vw solid rgba(120, 160, 200, 0.6)',
                      borderRadius: '0.5vw',
                      color: '#ffffff',
                      fontSize: 'clamp(14px, 1.3vw, 24px)',
                      padding: '0.8vh 1.6vw',
                      cursor: 'pointer',
                      fontWeight: '650',
                      letterSpacing: '-0.01em',
                      transition: 'all 0.3s cubic-bezier(0.23, 1, 0.32, 1)',
                      backdropFilter: 'blur(2px)',
                      willChange: 'transform, background-color'
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
      </div>
      
      {/* CSS Animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        @keyframes floatUp {
          0% {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
          100% {
            opacity: 0;
            transform: translateX(-50%) translateY(-40px);
          }
        }
      `}</style>
    </div>
  );
};

export default Picture6Working;