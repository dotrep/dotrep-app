import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAccount } from 'wagmi';
import { useQuery } from '@tanstack/react-query';
import WalletTab from '../components/WalletTab';
import FsnMessageTab from '../components/FsnMessageTab';
import VaultUpload from '../components/VaultUpload';
import ChatDashboard from '../components/ChatSystem/ChatDashboard';
import PulseGauge from '../components/PulseGauge';
import { SEOHead } from '../components/SEOHead';

const generateParticles = (count: number) => Array.from({ length: count }, (_, i) => ({
  left: Math.random() * 100,
  top: Math.random() * 100,
  size: 3 + Math.random() * 6,
  delay: Math.random() * 5,
  duration: 8 + Math.random() * 12,
  color: i % 3 === 0 ? 'rgba(0, 212, 170, 0.4)' : i % 3 === 1 ? 'rgba(0, 82, 255, 0.35)' : 'rgba(255, 107, 53, 0.3)',
}));

export function RepDashboard() {
  const [, setLocation] = useLocation();
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<'wallet' | 'messages' | 'vault' | 'chat'>('wallet');
  const [repName, setRepName] = useState('');
  const [userId, setUserId] = useState<number>(1);
  const particles = generateParticles(30);

  // Check session
  const { data: sessionData, isLoading: sessionLoading } = useQuery({
    queryKey: ['/api/auth/me'],
    retry: false,
  });

  // Fetch user stats for pulse gauge
  const { data: userStats } = useQuery({
    queryKey: ['/api/user/stats'],
    enabled: !!sessionData?.ok,
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (!sessionLoading && !sessionData?.ok) {
      // No valid session, redirect to claim
      setLocation('/claim');
      return;
    }
    
    if (sessionData?.ok) {
      setRepName(sessionData.repName);
      // Generate userId from reservation ID
      const rid = sessionData.userId || sessionData.repName;
      const hash = rid.split('').reduce((acc: number, char: string, idx: number) => 
        acc + char.charCodeAt(0) * (idx + 1), 0
      );
      setUserId(Math.abs(hash));
    }
  }, [sessionData, sessionLoading, setLocation]);

  if (sessionLoading || !repName) {
    return null;
  }

  return (
    <>
      <SEOHead 
        title={`${repName}.rep - Dashboard`}
        description="Manage your .rep identity, wallet, messages, and vault"
      />
      <div style={styles.dashboardPage}>
        <div style={styles.particleBg}>
          {particles.map((p, i) => (
            <div
              key={i}
              style={{
                ...styles.particle,
                left: `${p.left}%`,
                top: `${p.top}%`,
                width: `${p.size}px`,
                height: `${p.size}px`,
                background: p.color,
                animationDelay: `${p.delay}s`,
                animationDuration: `${p.duration}s`,
              }}
            />
          ))}
        </div>

        <style>{`
          @keyframes float {
            0%, 100% {
              transform: translateY(0) scale(1);
              opacity: 0.3;
            }
            50% {
              transform: translateY(-100px) scale(1.1);
              opacity: 0.6;
            }
          }
        `}</style>

        <div style={styles.dashboardContainer}>
          <div style={styles.header}>
            <h1 style={styles.headerTitle}>
              {repName}<span style={styles.repSuffix}>.rep</span>
            </h1>
            {isConnected && address && (
              <div style={styles.walletPill}>
                {address.slice(0, 6)}...{address.slice(-4)}
              </div>
            )}
          </div>

          {/* Pulse Gauge Hero Section */}
          <div style={styles.pulseHero}>
            <div style={styles.pulseContainer}>
              <h2 style={styles.pulseTitle}>Your Pulse</h2>
              <PulseGauge pulseScore={userStats?.pulseScore || 55} isTabActive={true} />
              <div style={styles.statsRow}>
                <div style={styles.statItem}>
                  <span style={styles.statValue}>{userStats?.xpPoints || 0}</span>
                  <span style={styles.statLabel}>XP</span>
                </div>
                <div style={styles.statItem}>
                  <span style={styles.statValue}>{userStats?.signalsSent || 0}</span>
                  <span style={styles.statLabel}>Signals</span>
                </div>
                <div style={styles.statItem}>
                  <span style={styles.statValue}>{userStats?.currentLoginStreak || 0}</span>
                  <span style={styles.statLabel}>Streak</span>
                </div>
              </div>
            </div>
          </div>

          <div style={styles.tabNav}>
            <button
              onClick={() => setActiveTab('wallet')}
              style={activeTab === 'wallet' ? styles.tabButtonActive : styles.tabButton}
            >
              💰 Wallet
            </button>
            <button
              onClick={() => setActiveTab('messages')}
              style={activeTab === 'messages' ? styles.tabButtonActive : styles.tabButton}
            >
              💬 Messages
            </button>
            <button
              onClick={() => setActiveTab('vault')}
              style={activeTab === 'vault' ? styles.tabButtonActive : styles.tabButton}
            >
              🔐 Vault
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              style={activeTab === 'chat' ? styles.tabButtonActive : styles.tabButton}
            >
              🤖 Chat
            </button>
          </div>

          <div style={styles.tabContent}>
            {activeTab === 'wallet' && (
              <WalletTab userId={userId} fsnName={repName} />
            )}
            {activeTab === 'messages' && (
              <FsnMessageTab userId={userId} fsnName={repName} />
            )}
            {activeTab === 'vault' && (
              <div style={styles.vaultContainer}>
                <h2 style={styles.vaultTitle}>Secure File Storage</h2>
                <p style={styles.vaultDesc}>
                  Upload files with client-side encryption. Your files are encrypted before leaving your device.
                </p>
                <VaultUpload 
                  onUploadComplete={(result) => {
                    console.log('Upload complete:', result);
                  }}
                  onUploadError={(error) => {
                    console.error('Upload error:', error);
                  }}
                />
              </div>
            )}
            {activeTab === 'chat' && (
              <ChatDashboard userId={userId} userFsn={repName} />
            )}
          </div>
        </div>
      </div>
    </>
  );
}

const styles = {
  dashboardPage: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%)',
    position: 'relative' as const,
    overflow: 'hidden',
    padding: '20px',
  },
  particleBg: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none' as const,
  },
  particle: {
    position: 'absolute' as const,
    borderRadius: '50%',
    animation: 'float 20s infinite ease-in-out',
  },
  dashboardContainer: {
    maxWidth: '1200px',
    margin: '0 auto',
    position: 'relative' as const,
    zIndex: 1,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '32px',
    flexWrap: 'wrap' as const,
    gap: '16px',
  },
  headerTitle: {
    fontSize: '36px',
    fontWeight: 700,
    color: '#00d4aa',
    margin: 0,
  },
  repSuffix: {
    color: '#0052ff',
  },
  walletPill: {
    padding: '8px 16px',
    background: 'rgba(0, 82, 255, 0.2)',
    border: '1px solid rgba(0, 82, 255, 0.4)',
    borderRadius: '20px',
    color: '#0052ff',
    fontSize: '14px',
    fontWeight: 600,
  },
  tabNav: {
    display: 'flex',
    gap: '12px',
    marginBottom: '24px',
    flexWrap: 'wrap' as const,
  },
  tabButton: {
    padding: '12px 24px',
    background: 'rgba(30, 41, 59, 0.5)',
    border: '2px solid #334155',
    borderRadius: '12px',
    color: '#94a3b8',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  tabButtonActive: {
    padding: '12px 24px',
    background: 'linear-gradient(135deg, rgba(0, 212, 170, 0.2) 0%, rgba(0, 82, 255, 0.2) 100%)',
    border: '2px solid #00d4aa',
    borderRadius: '12px',
    color: '#00d4aa',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 0 20px rgba(0, 212, 170, 0.3)',
  },
  tabContent: {
    background: 'rgba(30, 41, 59, 0.3)',
    borderRadius: '16px',
    padding: '24px',
    minHeight: '500px',
  },
  vaultContainer: {
    maxWidth: '800px',
    margin: '0 auto',
  },
  vaultTitle: {
    fontSize: '28px',
    fontWeight: 700,
    background: 'linear-gradient(90deg, #00d4aa 0%, #0052ff 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    marginBottom: '12px',
  },
  vaultDesc: {
    fontSize: '16px',
    color: '#94a3b8',
    marginBottom: '32px',
  },
  pulseHero: {
    background: 'linear-gradient(135deg, rgba(0, 212, 170, 0.1) 0%, rgba(0, 82, 255, 0.1) 100%)',
    borderRadius: '20px',
    padding: '40px 20px',
    marginBottom: '32px',
    border: '2px solid rgba(0, 212, 170, 0.2)',
    boxShadow: '0 0 40px rgba(0, 212, 170, 0.1)',
  } as const,
  pulseContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '24px',
  },
  pulseTitle: {
    fontSize: '24px',
    fontWeight: 700,
    background: 'linear-gradient(90deg, #00d4aa 0%, #0052ff 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    margin: 0,
  } as const,
  statsRow: {
    display: 'flex',
    gap: '40px',
    justifyContent: 'center',
    flexWrap: 'wrap' as const,
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '8px',
  },
  statValue: {
    fontSize: '28px',
    fontWeight: 700,
    color: '#00d4aa',
  },
  statLabel: {
    fontSize: '14px',
    color: '#94a3b8',
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
  },
};
