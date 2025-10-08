import React from 'react';
import { Link } from 'wouter';
import SharedNetworkAnimation from '@/components/SharedNetworkAnimation';
import SevenDayChallenge from '@/components/SevenDayChallenge';

const Dashboard: React.FC = () => {
  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
      localStorage.clear();
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      localStorage.clear();
      window.location.href = '/';
    }
  };

  return (
    <>
      {/* Floating particle background */}
      <div className="hero mobile-friendly-hero" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}>
        <SharedNetworkAnimation className="network-background" />
      </div>

      {/* Main Dashboard Content */}
      <section style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        position: 'relative',
        color: '#fff',
        fontFamily: 'Inter, sans-serif',
        padding: '20px',
        zIndex: 10,
        backgroundColor: 'transparent'
      }}>

        {/* FSN Dashboard Header */}
        <div style={{
          padding: '40px 20px',
          textAlign: 'center',
          maxWidth: '800px',
          margin: '0 auto',
          zIndex: 20,
          position: 'relative'
        }}>
          
          {/* Beacon Status */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px',
            padding: '15px 25px',
            border: '2px solid rgba(0, 240, 255, 0.6)',
            borderRadius: '30px',
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{
              color: '#00f0ff',
              fontFamily: 'Orbitron, sans-serif',
              fontSize: '14px',
              fontWeight: '600',
              marginRight: '15px',
              textShadow: '0 0 10px rgba(0, 240, 255, 0.8)'
            }}>
              BEACON STATUS: ACTIVE
            </div>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#00f0ff',
              boxShadow: '0 0 15px rgba(0, 240, 255, 1)',
              animation: 'beacon-pulse 1s ease-in-out infinite alternate'
            }} />
          </div>

          {/* FSN Progression Badges */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '30px',
            gap: '20px',
            flexWrap: 'wrap'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              padding: '10px 20px',
              border: '2px solid rgba(0, 255, 127, 0.6)',
              borderRadius: '25px',
              backgroundColor: 'rgba(0, 255, 127, 0.1)',
              fontSize: '14px',
              color: '#00ff7f',
              fontFamily: 'Orbitron, sans-serif',
              fontWeight: '600',
              textShadow: '0 0 10px rgba(0, 255, 127, 0.8)',
              boxShadow: '0 0 20px rgba(0, 255, 127, 0.2)'
            }}>
              ✓ PULSE
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              padding: '10px 20px',
              border: '2px solid rgba(255, 165, 0, 0.6)',
              borderRadius: '25px',
              backgroundColor: 'rgba(255, 165, 0, 0.1)',
              fontSize: '14px',
              color: '#ffa500',
              fontFamily: 'Orbitron, sans-serif',
              fontWeight: '600',
              textShadow: '0 0 10px rgba(255, 165, 0, 0.8)',
              boxShadow: '0 0 20px rgba(255, 165, 0, 0.2)'
            }}>
              ✓ SIGNAL
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              padding: '10px 20px',
              border: '2px solid rgba(0, 240, 255, 0.8)',
              borderRadius: '25px',
              backgroundColor: 'rgba(0, 240, 255, 0.1)',
              fontSize: '14px',
              color: '#00f0ff',
              fontFamily: 'Orbitron, sans-serif',
              fontWeight: '600',
              textShadow: '0 0 10px rgba(0, 240, 255, 0.8)',
              boxShadow: '0 0 20px rgba(0, 240, 255, 0.3)'
            }}>
              🔦 BEACON
            </div>
          </div>

          <h1 style={{
            color: '#00f0ff',
            fontSize: '48px',
            marginBottom: '20px',
            fontFamily: 'Orbitron, sans-serif',
            textShadow: '0 0 20px rgba(0, 240, 255, 0.6)',
            animation: 'beacon-pulse 2s ease-in-out infinite alternate'
          }}>
            FSN COMMAND CENTER
          </h1>
          
          <div style={{
            color: 'rgba(255,255,255,0.8)',
            fontSize: '18px',
            marginBottom: '40px',
            textShadow: '0 0 10px rgba(255, 255, 255, 0.3)'
          }}>
            Broadcasting your digital identity across the FreeSpace Network
          </div>

          {/* Navigation with Cyberpunk Styling */}
          <nav style={{
            display: 'flex',
            gap: '30px',
            justifyContent: 'center',
            marginBottom: '10px',
            fontSize: '14px',
            fontWeight: '500',
            letterSpacing: '0.5px',
            fontFamily: 'Orbitron, sans-serif',
            flexWrap: 'wrap'
          }}>
            <div style={{ 
              color: '#00bcd4', 
              borderBottom: '2px solid #00bcd4',
              paddingBottom: '4px',
              textShadow: '0 0 10px rgba(0, 188, 212, 0.8)',
              filter: 'drop-shadow(0 0 5px rgba(0, 188, 212, 0.6))'
            }}>HOME</div>
            <Link href="/vault" style={{ textDecoration: 'none' }}>
              <div className="navigation-item" style={{ 
                color: 'rgba(255,255,255,0.6)', 
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                padding: '4px 8px',
                borderRadius: '4px'
              }}>VAULT</div>
            </Link>
            <Link href="/social" style={{ textDecoration: 'none' }}>
              <div className="navigation-item" style={{ 
                color: 'rgba(255,255,255,0.6)', 
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                padding: '4px 8px',
                borderRadius: '4px'
              }}>SOCIAL</div>
            </Link>
            <Link href="/game-center" style={{ textDecoration: 'none' }}>
              <div className="navigation-item" style={{ 
                color: 'rgba(255,255,255,0.6)', 
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                padding: '4px 8px',
                borderRadius: '4px'
              }}>GAME CENTER</div>
            </Link>
          </nav>

          {/* Cyberpunk Feature Cards with Neon Glow */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '15px',
            marginBottom: '10px'
          }}>
            <Link href="/vault" style={{ textDecoration: 'none' }}>
              <div className="fsn-card" style={{
                border: '2px solid #00bcd4',
                borderRadius: '12px',
                padding: '15px 12px',
                backgroundColor: 'rgba(0, 188, 212, 0.05)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 0 20px rgba(0, 188, 212, 0.2), inset 0 0 20px rgba(0, 188, 212, 0.05)',
                backdropFilter: 'blur(10px)'
              }}>
                <div style={{ fontSize: '32px', marginBottom: '15px', filter: 'drop-shadow(0 0 10px rgba(255, 255, 255, 0.8))' }}>🏛️</div>
                <div style={{ 
                  color: '#fff', 
                  fontSize: '18px', 
                  fontWeight: '500', 
                  marginBottom: '10px',
                  textShadow: '0 0 10px rgba(255, 255, 255, 0.3)',
                  fontFamily: 'Orbitron, sans-serif'
                }}>
                  SECURE VAULT
                </div>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>
                  Encrypted file storage & digital assets
                </div>
              </div>
            </Link>

            <Link href="/social" style={{ textDecoration: 'none' }}>
              <div className="fsn-card" style={{
                border: '2px solid #00bcd4',
                borderRadius: '12px',
                padding: '15px 12px',
                backgroundColor: 'rgba(0, 188, 212, 0.05)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 0 20px rgba(0, 188, 212, 0.2), inset 0 0 20px rgba(0, 188, 212, 0.05)',
                backdropFilter: 'blur(10px)'
              }}>
                <div style={{ fontSize: '32px', marginBottom: '15px', filter: 'drop-shadow(0 0 10px rgba(255, 255, 255, 0.8))' }}>🌐</div>
                <div style={{ 
                  color: '#fff', 
                  fontSize: '18px', 
                  fontWeight: '500', 
                  marginBottom: '10px',
                  textShadow: '0 0 10px rgba(255, 255, 255, 0.3)',
                  fontFamily: 'Orbitron, sans-serif'
                }}>
                  FSN NETWORK
                </div>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>
                  Connect with other FSN identities
                </div>
              </div>
            </Link>

            <Link href="/game-center" style={{ textDecoration: 'none' }}>
              <div className="fsn-card" style={{
                border: '2px solid #00bcd4',
                borderRadius: '12px',
                padding: '15px 12px',
                backgroundColor: 'rgba(0, 188, 212, 0.05)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 0 20px rgba(0, 188, 212, 0.2), inset 0 0 20px rgba(0, 188, 212, 0.05)',
                backdropFilter: 'blur(10px)'
              }}>
                <div style={{ fontSize: '32px', marginBottom: '15px', filter: 'drop-shadow(0 0 10px rgba(255, 255, 255, 0.8))' }}>⚡</div>
                <div style={{ 
                  color: '#fff', 
                  fontSize: '18px', 
                  fontWeight: '500', 
                  marginBottom: '10px',
                  textShadow: '0 0 10px rgba(255, 255, 255, 0.3)',
                  fontFamily: 'Orbitron, sans-serif'
                }}>
                  NEURAL LINK
                </div>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>
                  Interactive challenges & XP rewards
                </div>
              </div>
            </Link>
          </div>

          {/* Seven Day Constellation Quest */}
          <SevenDayChallenge />
        </div>

        {/* Cyberpunk Logout Button */}
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 20
        }}>
          <div onClick={handleLogout} style={{ 
            cursor: 'pointer',
            padding: '12px 16px',
            transition: 'all 0.4s cubic-bezier(0.25, 0.1, 0.25, 1)',
            borderRadius: '8px',
            border: '2px solid rgba(0, 240, 255, 0.6)',
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(12px)',
            color: '#00f0ff',
            fontSize: '14px',
            fontWeight: '500',
            textShadow: '0 0 10px rgba(0, 240, 255, 0.8)',
            boxShadow: '0 0 20px rgba(0, 240, 255, 0.3), inset 0 0 20px rgba(0, 240, 255, 0.1)'
          }}>
            ⏏️ LOGOUT
          </div>
        </div>

      </section>

      {/* Add FSN animations and effects */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes beacon-pulse {
            0% { 
              text-shadow: 0 0 20px rgba(0, 240, 255, 0.6);
              transform: scale(1);
            }
            100% { 
              text-shadow: 0 0 30px rgba(0, 240, 255, 1), 0 0 40px rgba(0, 240, 255, 0.8);
              transform: scale(1.02);
            }
          }
          
          @keyframes signal-sweep {
            0% { 
              box-shadow: 0 0 20px rgba(0, 188, 212, 0.2), inset 0 0 20px rgba(0, 188, 212, 0.05);
            }
            50% { 
              box-shadow: 0 0 30px rgba(0, 188, 212, 0.4), inset 0 0 30px rgba(0, 188, 212, 0.1), 0 0 50px rgba(0, 240, 255, 0.2);
            }
            100% { 
              box-shadow: 0 0 20px rgba(0, 188, 212, 0.2), inset 0 0 20px rgba(0, 188, 212, 0.05);
            }
          }
          
          @keyframes pulse-glow {
            0%, 100% { 
              background-color: rgba(0, 188, 212, 0.05);
              border-color: rgba(0, 188, 212, 0.6);
            }
            50% { 
              background-color: rgba(0, 188, 212, 0.1);
              border-color: rgba(0, 240, 255, 0.8);
            }
          }
          
          .fsn-card {
            animation: signal-sweep 3s ease-in-out infinite;
          }
          
          .fsn-card:hover {
            animation: pulse-glow 1s ease-in-out infinite;
            transform: translateY(-2px);
          }
          
          .navigation-item:hover {
            color: rgba(0, 240, 255, 1) !important;
            text-shadow: 0 0 15px rgba(0, 240, 255, 0.8);
            background-color: rgba(0, 240, 255, 0.1);
            border-radius: 4px;
          }
        `
      }} />
    </>
  );
};

export default Dashboard;