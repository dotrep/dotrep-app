import React from 'react';
import SharedNetworkAnimation from '@/components/SharedNetworkAnimation';
import { Link } from 'wouter';

const Vault: React.FC = () => {
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

      {/* Main Vault Content */}
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

        {/* Vault Header */}
        <div style={{
          padding: '40px 20px',
          textAlign: 'center',
          maxWidth: '800px',
          margin: '0 auto',
          zIndex: 20,
          position: 'relative'
        }}>
          
          {/* FSN Vault Status */}
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
              VAULT STATUS: SECURE
            </div>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#00ff7f',
              boxShadow: '0 0 15px rgba(0, 255, 127, 1)',
              animation: 'vault-pulse 1.5s ease-in-out infinite alternate'
            }} />
          </div>

          <h1 style={{
            color: '#00f0ff',
            fontSize: '48px',
            marginBottom: '20px',
            fontFamily: 'Orbitron, sans-serif',
            textShadow: '0 0 20px rgba(0, 240, 255, 0.6)',
            animation: 'vault-glow 3s ease-in-out infinite alternate'
          }}>
            🏛️ SECURE VAULT
          </h1>
          
          <div style={{
            color: 'rgba(255,255,255,0.8)',
            fontSize: '18px',
            marginBottom: '40px',
            textShadow: '0 0 10px rgba(255, 255, 255, 0.3)'
          }}>
            Your encrypted digital asset storage
          </div>

          {/* Navigation with Cyberpunk Styling */}
          <nav style={{
            display: 'flex',
            gap: '30px',
            justifyContent: 'center',
            marginBottom: '40px',
            fontSize: '16px',
            fontWeight: '500',
            letterSpacing: '0.5px',
            fontFamily: 'Orbitron, sans-serif',
            flexWrap: 'wrap'
          }}>
            <Link href="/dashboard" style={{ textDecoration: 'none' }}>
              <div className="navigation-item" style={{ 
                color: 'rgba(255,255,255,0.6)', 
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                padding: '4px 8px',
                borderRadius: '4px'
              }}>HOME</div>
            </Link>
            <div style={{ 
              color: '#00bcd4', 
              borderBottom: '2px solid #00bcd4',
              paddingBottom: '4px',
              textShadow: '0 0 10px rgba(0, 188, 212, 0.8)',
              filter: 'drop-shadow(0 0 5px rgba(0, 188, 212, 0.6))'
            }}>VAULT</div>
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

          {/* Vault Features */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px',
            marginBottom: '40px'
          }}>
            <div className="vault-card" style={{
              border: '2px solid #00bcd4',
              borderRadius: '12px',
              padding: '30px 20px',
              backgroundColor: 'rgba(0, 188, 212, 0.05)',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 0 20px rgba(0, 188, 212, 0.2), inset 0 0 20px rgba(0, 188, 212, 0.05)',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{ fontSize: '32px', marginBottom: '15px', filter: 'drop-shadow(0 0 10px rgba(255, 255, 255, 0.8))' }}>📁</div>
              <div style={{ 
                color: '#fff', 
                fontSize: '18px', 
                fontWeight: '500', 
                marginBottom: '10px',
                textShadow: '0 0 10px rgba(255, 255, 255, 0.3)',
                fontFamily: 'Orbitron, sans-serif'
              }}>
                FILE STORAGE
              </div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>
                Upload and manage your documents
              </div>
            </div>

            <div className="vault-card" style={{
              border: '2px solid #00bcd4',
              borderRadius: '12px',
              padding: '30px 20px',
              backgroundColor: 'rgba(0, 188, 212, 0.05)',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 0 20px rgba(0, 188, 212, 0.2), inset 0 0 20px rgba(0, 188, 212, 0.05)',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{ fontSize: '32px', marginBottom: '15px', filter: 'drop-shadow(0 0 10px rgba(255, 255, 255, 0.8))' }}>🔐</div>
              <div style={{ 
                color: '#fff', 
                fontSize: '18px', 
                fontWeight: '500', 
                marginBottom: '10px',
                textShadow: '0 0 10px rgba(255, 255, 255, 0.3)',
                fontFamily: 'Orbitron, sans-serif'
              }}>
                ENCRYPTION
              </div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>
                End-to-end encrypted storage
              </div>
            </div>

            <div className="vault-card" style={{
              border: '2px solid #00bcd4',
              borderRadius: '12px',
              padding: '30px 20px',
              backgroundColor: 'rgba(0, 188, 212, 0.05)',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 0 20px rgba(0, 188, 212, 0.2), inset 0 0 20px rgba(0, 188, 212, 0.05)',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{ fontSize: '32px', marginBottom: '15px', filter: 'drop-shadow(0 0 10px rgba(255, 255, 255, 0.8))' }}>💎</div>
              <div style={{ 
                color: '#fff', 
                fontSize: '18px', 
                fontWeight: '500', 
                marginBottom: '10px',
                textShadow: '0 0 10px rgba(255, 255, 255, 0.3)',
                fontFamily: 'Orbitron, sans-serif'
              }}>
                NFT GALLERY
              </div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>
                Showcase your digital assets
              </div>
            </div>
          </div>

          {/* Coming Soon Message */}
          <div style={{
            padding: '40px 30px',
            border: '2px dashed rgba(0, 240, 255, 0.4)',
            borderRadius: '12px',
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>🚧</div>
            <div style={{ 
              color: '#00f0ff', 
              fontSize: '20px', 
              marginBottom: '10px',
              fontWeight: '600',
              fontFamily: 'Orbitron, sans-serif'
            }}>
              VAULT COMING SOON
            </div>
            <div style={{ 
              color: 'rgba(255,255,255,0.7)', 
              fontSize: '16px' 
            }}>
              Advanced file storage and digital asset management features are being developed
            </div>
          </div>
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

      {/* Vault animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes vault-pulse {
            0% { 
              box-shadow: 0 0 15px rgba(0, 255, 127, 1);
            }
            100% { 
              box-shadow: 0 0 25px rgba(0, 255, 127, 1), 0 0 35px rgba(0, 255, 127, 0.5);
            }
          }
          
          @keyframes vault-glow {
            0% { 
              text-shadow: 0 0 20px rgba(0, 240, 255, 0.6);
            }
            100% { 
              text-shadow: 0 0 30px rgba(0, 240, 255, 1), 0 0 40px rgba(0, 240, 255, 0.8);
            }
          }
          
          .vault-card {
            animation: vault-sweep 4s ease-in-out infinite;
          }
          
          @keyframes vault-sweep {
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
          
          .vault-card:hover {
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

export default Vault;