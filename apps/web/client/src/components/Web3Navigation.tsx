// Enhanced navigation with Web3 wallet integration
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useAccount } from 'wagmi';
import { useSessionAuth } from '../hooks/useSessionAuth';
import { WalletConnect } from './WalletConnect';

interface Web3NavigationProps {
  className?: string;
  showAdmin?: boolean;
  isLoggedIn?: boolean;
  showFullNav?: boolean;
}

export const Web3Navigation: React.FC<Web3NavigationProps> = ({ 
  className = '', 
  showAdmin = false,
  isLoggedIn: propIsLoggedIn,
  showFullNav = true
}) => {
  const [location, setLocation] = useLocation();
  const [showWalletMenu, setShowWalletMenu] = useState(false);
  
  // Use session-based authentication
  const { session, isLoading, logout: sessionLogout } = useSessionAuth();
  // Temporarily disabled to prevent fetch errors
  const isConnected = false;
  const address = undefined;
  
  // Use session data or prop for login status
  const isLoggedIn = propIsLoggedIn !== undefined ? propIsLoggedIn : session.isLoggedIn;
  const userProfile = session.isLoggedIn ? {
    id: session.userId || 0,
    username: session.username || '',
    fsnName: session.fsnName || ''
  } : null;
  
  // Log session status for debugging
  useEffect(() => {
    console.log("Web3 Navigation session status:", { 
      isLoggedIn, 
      userProfile, 
      isLoading, 
      walletConnected: isConnected,
      walletAddress: address 
    });
  }, [isLoggedIn, userProfile, isLoading, isConnected, address]);
  
  // Handle logout with session-based approach
  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    console.log("Logging out...");
    await sessionLogout();
  };
  
  return (
    <nav className={`fsn-navigation ${className}`}>
      <div className="nav-links">
        {isLoggedIn ? (
          <>
            {showFullNav ? (
              <>
                <Link href="/vault" className="nav-link">Vault</Link>
                <Link href="/social" className="nav-link">Social</Link>
                <Link href="/games" className="nav-link">Game Center</Link>
                
                {/* Wallet Connection Status */}
                <div className="wallet-section">
                  {isConnected ? (
                    <div className="wallet-connected-indicator">
                      <span className="wallet-icon">🔗</span>
                      <span className="wallet-status">Web3 Connected</span>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setShowWalletMenu(!showWalletMenu)}
                      className="connect-wallet-btn"
                    >
                      Connect Wallet
                    </button>
                  )}
                </div>
                
                <a href="#" onClick={handleLogout} className="nav-link logout-button">
                  {userProfile?.fsnName ? `Logout (${userProfile.fsnName})` : 'Logout'}
                </a>
              </>
            ) : (
              <>
                <Link href="/dashboard" className="nav-link home-link">Home</Link>
                <span className="nav-separator">|</span>
                <span className="nav-fsn-name">{userProfile?.fsnName || 'user'}.fsn</span>
                <span className="nav-separator">|</span>
                {isConnected && (
                  <>
                    <span className="wallet-indicator">🔗</span>
                    <span className="nav-separator">|</span>
                  </>
                )}
                <a href="#" onClick={handleLogout} className="nav-link logout-button">
                  Logout
                </a>
              </>
            )}
          </>
        ) : (
          <Link href="/login">
            <span className="nav-link login-button">Login</span>
          </Link>
        )}
      </div>
      
      {/* Wallet Connection Dropdown */}
      {showWalletMenu && !isConnected && (
        <div className="wallet-dropdown">
          <WalletConnect />
          <button 
            onClick={() => setShowWalletMenu(false)}
            className="close-wallet-menu"
          >
            Close
          </button>
        </div>
      )}
      
      <style>{`
        .nav-link {
          transition: all 0.3s ease;
          color: #66fcf1;
          text-decoration: none;
          font-weight: 500;
        }
        
        .nav-link:hover {
          color: #00f0ff;
          text-shadow: 0 0 5px rgba(0, 240, 255, 0.5);
        }
        
        .nav-fsn-name {
          color: #00f0ff;
          font-weight: bold;
          text-shadow: 0 0 8px rgba(0, 240, 255, 0.6);
          font-size: 14px;
        }
        
        .nav-separator {
          color: #66fcf1;
          margin: 0 8px;
          font-weight: 300;
          opacity: 0.7;
        }
        
        .home-link {
          font-weight: 600;
        }
        
        .logout-button {
          font-weight: 500;
        }
        
        .wallet-section {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .wallet-connected-indicator {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #22c55e;
          font-size: 12px;
          font-weight: 500;
        }
        
        .wallet-icon {
          font-size: 16px;
        }
        
        .wallet-indicator {
          color: #22c55e;
          font-size: 16px;
        }
        
        .connect-wallet-btn {
          background: linear-gradient(135deg, #00f0ff 0%, #66fcf1 100%);
          border: none;
          color: #000;
          padding: 6px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: bold;
          font-size: 12px;
          transition: all 0.3s ease;
        }
        
        .connect-wallet-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 3px 8px rgba(0, 240, 255, 0.4);
        }
        
        .wallet-dropdown {
          position: absolute;
          top: 100%;
          right: 0;
          margin-top: 10px;
          background: rgba(10, 25, 41, 0.95);
          border: 1px solid rgba(0, 240, 255, 0.3);
          border-radius: 12px;
          padding: 20px;
          backdrop-filter: blur(10px);
          z-index: 1000;
        }
        
        .close-wallet-menu {
          margin-top: 12px;
          background: transparent;
          border: 1px solid #666;
          color: #666;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          width: 100%;
          font-size: 12px;
        }
        
        .close-wallet-menu:hover {
          border-color: #00f0ff;
          color: #00f0ff;
        }
      `}</style>
    </nav>
  );
};

export default Web3Navigation;