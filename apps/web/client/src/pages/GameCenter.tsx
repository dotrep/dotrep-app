import React from 'react';
import SharedNetworkAnimation from '@/components/SharedNetworkAnimation';
import { Link } from 'wouter';

const GameCenter: React.FC = () => {
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

      {/* Main Game Center Content */}
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

        {/* Game Center Header */}
        <div style={{
          padding: '40px 20px',
          textAlign: 'center',
          maxWidth: '800px',
          margin: '0 auto',
          zIndex: 20,
          position: 'relative'
        }}>
          
          {/* Game Status */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px',
            padding: '15px 25px',
            border: '2px solid rgba(255, 165, 0, 0.6)',
            borderRadius: '30px',
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{
              color: '#ffa500',
              fontFamily: 'Orbitron, sans-serif',
              fontSize: '14px',
              fontWeight: '600',
              marginRight: '15px',
              textShadow: '0 0 10px rgba(255, 165, 0, 0.8)'
            }}>
              GAME CENTER ONLINE
            </div>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#ffa500',
              boxShadow: '0 0 15px rgba(255, 165, 0, 1)',
              animation: 'game-pulse 2s ease-in-out infinite alternate'
            }} />
          </div>

          <h1 style={{
            color: '#ffa500',
            fontSize: '48px',
            marginBottom: '20px',
            fontFamily: 'Orbitron, sans-serif',
            textShadow: '0 0 20px rgba(255, 165, 0, 0.6)',
            animation: 'game-glow 3s ease-in-out infinite alternate'
          }}>
            🎮 GAME CENTER
          </h1>
          
          <div style={{
            color: 'rgba(255,255,255,0.8)',
            fontSize: '18px',
            marginBottom: '40px',
            textShadow: '0 0 10px rgba(255, 255, 255, 0.3)'
          }}>
            Compete • Earn XP • Level Up
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
            <div style={{ 
              color: '#ffa500', 
              borderBottom: '2px solid #ffa500',
              paddingBottom: '4px',
              textShadow: '0 0 10px rgba(255, 165, 0, 0.8)',
              filter: 'drop-shadow(0 0 5px rgba(255, 165, 0, 0.6))'
            }}>GAME CENTER</div>
          </nav>

          {/* Game Features */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px',
            marginBottom: '40px'
          }}>
            <div className="game-card" style={{
              border: '2px solid #ffa500',
              borderRadius: '12px',
              padding: '30px 20px',
              backgroundColor: 'rgba(255, 165, 0, 0.05)',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 0 20px rgba(255, 165, 0, 0.2), inset 0 0 20px rgba(255, 165, 0, 0.05)',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{ fontSize: '32px', marginBottom: '15px', filter: 'drop-shadow(0 0 10px rgba(255, 165, 0, 0.8))' }}>🎯</div>
              <div style={{ 
                color: '#fff', 
                fontSize: '18px', 
                fontWeight: '500', 
                marginBottom: '10px',
                textShadow: '0 0 10px rgba(255, 255, 255, 0.3)',
                fontFamily: 'Orbitron, sans-serif'
              }}>
                CHALLENGES
              </div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>
                Complete tasks and earn XP rewards
              </div>
            </div>

            <div className="game-card" style={{
              border: '2px solid #ffa500',
              borderRadius: '12px',
              padding: '30px 20px',
              backgroundColor: 'rgba(255, 165, 0, 0.05)',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 0 20px rgba(255, 165, 0, 0.2), inset 0 0 20px rgba(255, 165, 0, 0.05)',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{ fontSize: '32px', marginBottom: '15px', filter: 'drop-shadow(0 0 10px rgba(255, 165, 0, 0.8))' }}>🏆</div>
              <div style={{ 
                color: '#fff', 
                fontSize: '18px', 
                fontWeight: '500', 
                marginBottom: '10px',
                textShadow: '0 0 10px rgba(255, 255, 255, 0.3)',
                fontFamily: 'Orbitron, sans-serif'
              }}>
                LEADERBOARDS
              </div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>
                Compete with other FSN members
              </div>
            </div>

            <div className="game-card" style={{
              border: '2px solid #ffa500',
              borderRadius: '12px',
              padding: '30px 20px',
              backgroundColor: 'rgba(255, 165, 0, 0.05)',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 0 20px rgba(255, 165, 0, 0.2), inset 0 0 20px rgba(255, 165, 0, 0.05)',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{ fontSize: '32px', marginBottom: '15px', filter: 'drop-shadow(0 0 10px rgba(255, 165, 0, 0.8))' }}>⚡</div>
              <div style={{ 
                color: '#fff', 
                fontSize: '18px', 
                fontWeight: '500', 
                marginBottom: '10px',
                textShadow: '0 0 10px rgba(255, 255, 255, 0.3)',
                fontFamily: 'Orbitron, sans-serif'
              }}>
                MINI GAMES
              </div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>
                Quick games for instant rewards
              </div>
            </div>
          </div>

          {/* Current Games */}
          <div style={{
            background: 'rgba(0, 20, 40, 0.6)',
            border: '1px solid rgba(255, 165, 0, 0.3)',
            borderRadius: '12px',
            padding: '30px',
            marginBottom: '40px',
            backdropFilter: 'blur(10px)'
          }}>
            <h2 style={{
              color: '#ffa500',
              fontSize: '20px',
              marginBottom: '20px',
              fontFamily: 'Orbitron, sans-serif',
              textShadow: '0 0 10px rgba(255, 165, 0, 0.5)'
            }}>
              🎮 AVAILABLE GAMES
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {[
                { name: 'Signal Hunter', type: 'Puzzle', xp: '50 XP', difficulty: 'Easy', icon: '🔍' },
                { name: 'Beacon Defense', type: 'Strategy', xp: '100 XP', difficulty: 'Medium', icon: '🛡️' },
                { name: 'Cipher Challenge', type: 'Logic', xp: '75 XP', difficulty: 'Hard', icon: '🔐' },
                { name: 'Network Race', type: 'Speed', xp: '25 XP', difficulty: 'Easy', icon: '🏃' },
                { name: 'FSN Trivia', type: 'Knowledge', xp: '40 XP', difficulty: 'Medium', icon: '🧠' }
              ].map((game, index) => (
                <div key={index} style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '15px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 165, 0, 0.2)',
                  borderRadius: '8px',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 165, 0, 0.1)';
                  e.currentTarget.style.transform = 'translateX(5px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 0, 0, 0.3)';
                  e.currentTarget.style.transform = 'translateX(0px)';
                }}
                >
                  <div style={{ fontSize: '24px', marginRight: '15px' }}>{game.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      color: '#ffa500', 
                      fontWeight: '500',
                      fontFamily: 'Orbitron, sans-serif',
                      fontSize: '16px'
                    }}>
                      {game.name}
                    </div>
                    <div style={{ 
                      color: 'rgba(255,255,255,0.7)', 
                      fontSize: '14px',
                      marginTop: '2px'
                    }}>
                      {game.type} • {game.difficulty} • Reward: {game.xp}
                    </div>
                  </div>
                  <div style={{
                    background: 'rgba(255, 165, 0, 0.2)',
                    border: '1px solid #ffa500',
                    color: '#ffa500',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 165, 0, 0.3)';
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 165, 0, 0.2)';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                  >
                    PLAY
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Coming Soon Message */}
          <div style={{
            padding: '40px 30px',
            border: '2px dashed rgba(255, 165, 0, 0.4)',
            borderRadius: '12px',
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>🕹️</div>
            <div style={{ 
              color: '#ffa500', 
              fontSize: '20px', 
              marginBottom: '10px',
              fontWeight: '600',
              fontFamily: 'Orbitron, sans-serif'
            }}>
              GAMES LOADING
            </div>
            <div style={{ 
              color: 'rgba(255,255,255,0.7)', 
              fontSize: '16px' 
            }}>
              Interactive games and challenges are being deployed to the FSN network
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
            border: '2px solid rgba(255, 165, 0, 0.6)',
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(12px)',
            color: '#ffa500',
            fontSize: '14px',
            fontWeight: '500',
            textShadow: '0 0 10px rgba(255, 165, 0, 0.8)',
            boxShadow: '0 0 20px rgba(255, 165, 0, 0.3), inset 0 0 20px rgba(255, 165, 0, 0.1)'
          }}>
            ⏏️ LOGOUT
          </div>
        </div>

      </section>

      {/* Game animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes game-pulse {
            0% { 
              box-shadow: 0 0 15px rgba(255, 165, 0, 1);
            }
            100% { 
              box-shadow: 0 0 25px rgba(255, 165, 0, 1), 0 0 35px rgba(255, 165, 0, 0.5);
            }
          }
          
          @keyframes game-glow {
            0% { 
              text-shadow: 0 0 20px rgba(255, 165, 0, 0.6);
            }
            100% { 
              text-shadow: 0 0 30px rgba(255, 165, 0, 1), 0 0 40px rgba(255, 165, 0, 0.8);
            }
          }
          
          .game-card {
            animation: game-sweep 5s ease-in-out infinite;
          }
          
          @keyframes game-sweep {
            0% { 
              box-shadow: 0 0 20px rgba(255, 165, 0, 0.2), inset 0 0 20px rgba(255, 165, 0, 0.05);
            }
            50% { 
              box-shadow: 0 0 30px rgba(255, 165, 0, 0.4), inset 0 0 30px rgba(255, 165, 0, 0.1), 0 0 50px rgba(255, 165, 0, 0.2);
            }
            100% { 
              box-shadow: 0 0 20px rgba(255, 165, 0, 0.2), inset 0 0 20px rgba(255, 165, 0, 0.05);
            }
          }
          
          .game-card:hover {
            transform: translateY(-2px);
          }
          
          .navigation-item:hover {
            color: rgba(255, 165, 0, 1) !important;
            text-shadow: 0 0 15px rgba(255, 165, 0, 0.8);
            background-color: rgba(255, 165, 0, 0.1);
            border-radius: 4px;
          }
        `
      }} />
    </>
  );
};

export default GameCenter;