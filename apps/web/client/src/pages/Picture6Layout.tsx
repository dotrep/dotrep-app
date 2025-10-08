import React, { useState, useEffect } from 'react';
import { Shield, Upload, FileText } from 'lucide-react';

const Picture6Layout: React.FC = () => {
  const [xp, setXp] = useState(960);
  const [maxXp] = useState(1000);
  const [files, setFiles] = useState([
    { name: 'report.pdf', date: '4/24/2024' },
    { name: 'photo.png', date: '4/24/2024' }
  ]);
  const [isPulsing, setIsPulsing] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsPulsing(true);
      setTimeout(() => setIsPulsing(false), 1500);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleAddXP = () => {
    setXp(prev => Math.min(prev + 10, maxXp));
    setIsPulsing(true);
    setTimeout(() => setIsPulsing(false), 1500);
  };

  const handleSimUpload = () => {
    const newFile = {
      name: `file${files.length + 1}.txt`,
      date: new Date().toLocaleDateString('en-US', { 
        month: 'numeric', 
        day: 'numeric', 
        year: 'numeric' 
      })
    };
    setFiles(prev => [...prev, newFile]);
    setXp(prev => Math.min(prev + 10, maxXp));
  };

  const progressPercentage = (xp / maxXp) * 100;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a202c 0%, #2a4365 50%, #1a202c 100%)',
      padding: '32px',
      color: 'white'
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '64px',
        alignItems: 'start'
      }}>
        
        {/* Left Side - FSN Circle and Sentinel */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '48px'
        }}>
          
          {/* FSN Circle */}
          <div style={{
            position: 'relative',
            width: '320px',
            height: '320px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {/* Pulsing outer rings */}
            <div style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              border: '3px solid #00bcd4',
              opacity: isPulsing ? 0 : 0.8,
              transform: isPulsing ? 'scale(1.3)' : 'scale(1)',
              transition: 'all 1s ease-out'
            }} />
            <div style={{
              position: 'absolute',
              width: '110%',
              height: '110%',
              borderRadius: '50%',
              border: '2px solid #4dd0e1',
              opacity: isPulsing ? 0 : 0.6,
              transform: isPulsing ? 'scale(1.5)' : 'scale(1)',
              transition: 'all 1.2s ease-out',
              transitionDelay: '0.2s'
            }} />
            
            {/* Main circle */}
            <div style={{
              position: 'relative',
              width: '280px',
              height: '280px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #374151 0%, #1f2937 100%)',
              border: '2px solid #00bcd4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 40px rgba(0, 188, 212, 0.4), inset 0 0 20px rgba(0, 0, 0, 0.3)'
            }}>
              {/* XP Badge */}
              <div style={{
                position: 'absolute',
                top: '-50px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '50px',
                fontSize: '16px',
                fontWeight: 'bold',
                boxShadow: '0 4px 16px rgba(59, 130, 246, 0.4)'
              }}>
                +50 XP
              </div>
              
              {/* FSN Text */}
              <div style={{
                color: 'white',
                fontSize: '64px',
                fontWeight: 'bold',
                letterSpacing: '3px',
                textShadow: '0 0 20px rgba(255, 255, 255, 0.3)'
              }}>
                .fsn
              </div>
            </div>
          </div>

          {/* Sentinel Section */}
          <div style={{
            background: 'rgba(55, 65, 81, 0.6)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid rgba(0, 188, 212, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            textAlign: 'center'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              marginBottom: '12px'
            }}>
              <Shield style={{ color: '#00bcd4', width: '24px', height: '24px' }} />
              <span style={{ fontSize: '20px', fontWeight: '600' }}>Sentinel</span>
            </div>
            <div style={{ color: '#9ca3af', fontSize: '14px' }}>Initial Pulse</div>
          </div>
        </div>

        {/* Right Side - Upload, Files, Progress, Debug */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '32px'
        }}>
          
          {/* Upload Section */}
          <div style={{
            background: 'rgba(55, 65, 81, 0.6)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            padding: '32px',
            border: '1px solid rgba(0, 188, 212, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
          }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>Upload</h2>
            <div style={{
              border: '2px dashed #00bcd4',
              borderRadius: '12px',
              padding: '48px',
              textAlign: 'center',
              background: 'rgba(0, 188, 212, 0.05)',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}>
              <Upload style={{ color: '#00bcd4', width: '48px', height: '48px', margin: '0 auto 16px' }} />
              <p style={{ color: '#d1d5db', fontSize: '18px' }}>Click to upload files</p>
            </div>
          </div>

          {/* My Vault Files */}
          <div style={{
            background: 'rgba(55, 65, 81, 0.6)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid rgba(0, 188, 212, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '24px'
            }}>
              <FileText style={{ color: '#00bcd4', width: '20px', height: '20px' }} />
              <h3 style={{ fontSize: '20px', fontWeight: '600' }}>My Vault Files</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {files.map((file, index) => (
                <div key={index} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  background: 'rgba(17, 24, 39, 0.4)',
                  borderRadius: '8px',
                  border: '1px solid rgba(75, 85, 99, 0.3)'
                }}>
                  <span style={{ color: '#d1d5db' }}>{file.name}</span>
                  <span style={{ color: '#9ca3af', fontSize: '14px' }}>{file.date}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Sentinel Progress */}
          <div style={{
            background: 'rgba(55, 65, 81, 0.6)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid rgba(0, 188, 212, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '16px'
            }}>
              <div style={{
                width: '12px',
                height: '12px',
                background: '#00bcd4',
                borderRadius: '50%'
              }} />
              <span style={{ fontSize: '20px', fontWeight: '600' }}>Sentinel</span>
            </div>
            
            {/* Progress Bar */}
            <div style={{
              width: '100%',
              height: '12px',
              background: '#374151',
              borderRadius: '6px',
              overflow: 'hidden',
              marginBottom: '16px'
            }}>
              <div style={{
                width: `${progressPercentage}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #00bcd4 0%, #4dd0e1 100%)',
                transition: 'width 0.5s ease-out'
              }} />
            </div>
            
            <div style={{ color: '#d1d5db', fontSize: '14px' }}>
              {xp} / {maxXp} XP
            </div>
          </div>

          {/* Debug Panel */}
          <div style={{
            background: 'rgba(55, 65, 81, 0.6)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid rgba(0, 188, 212, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
          }}>
            <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>Debug Panel</h3>
            <div style={{ display: 'flex', gap: '16px' }}>
              <button
                onClick={handleAddXP}
                style={{
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background 0.3s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#2563eb'}
                onMouseOut={(e) => e.currentTarget.style.background = '#3b82f6'}
              >
                +10 XP
              </button>
              <button
                onClick={handleSimUpload}
                style={{
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background 0.3s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#059669'}
                onMouseOut={(e) => e.currentTarget.style.background = '#10b981'}
              >
                Sim Upload
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Picture6Layout;