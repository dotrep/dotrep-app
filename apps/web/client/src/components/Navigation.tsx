import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useSessionAuth } from '../hooks/useSessionAuth';

interface NavigationProps {
  className?: string;
  showAdmin?: boolean;
  isLoggedIn?: boolean; // We'll determine login status inside the component if not provided
  showFullNav?: boolean; // Whether to show full navigation menu or just login/logout
}

interface UserProfile {
  id: number;
  username: string;
  fsnName?: string;
  email?: string;
}

/**
 * Navigation component for the FSN application
 * Provides links to key pages
 * Automatically detects login status if not explicitly provided
 */
const Navigation: React.FC<NavigationProps> = ({ 
  className = '', 
  showAdmin = false,
  isLoggedIn: propIsLoggedIn,  // Accept login status from parent if available
  showFullNav = true  // By default, show full navigation
}) => {
  // Use wouter's location hook for proper client-side navigation
  const [location, setLocation] = useLocation();
  
  // Use session-based authentication
  const { session, isLoading, logout: sessionLogout } = useSessionAuth();
  
  // Use session data or prop for login status
  const isLoggedIn = propIsLoggedIn !== undefined ? propIsLoggedIn : session.isLoggedIn;
  const userProfile = session.isLoggedIn ? {
    id: session.userId || 0,
    username: session.username || '',
    fsnName: session.fsnName || ''
  } : null;
  
  // Log session status for debugging
  useEffect(() => {
    console.log("Navigation session status:", { isLoggedIn, userProfile, isLoading });
  }, [isLoggedIn, userProfile, isLoading]);
  
  // Handle logout with session-based approach
  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    console.log("Logging out...");
    await sessionLogout(); // Uses the session-based logout
  };
  
  return (
    <nav className={`fsn-navigation ${className}`}>
      <div className="nav-links">
        {isLoggedIn ? (
          <>
            {showFullNav ? (
              <>
                <Link href="/vault" className="nav-link">Vault</Link>
                <Link href="/vault-secure" className="nav-link">Secure Vault</Link>
                <Link href="/leaderboard" className="nav-link">Leaderboard</Link>
                <Link href="/social" className="nav-link">Social</Link>
                <Link href="/games" className="nav-link">Game Center</Link>
                <a href="#" onClick={handleLogout} className="nav-link logout-button">
                  {userProfile?.fsnName ? `Logout (${userProfile.fsnName}.fsn)` : 'Logout'}
                </a>
              </>
            ) : (
              <>
                <Link href="/dashboard" className="nav-link home-link">Home</Link>
                <span className="nav-separator">|</span>
                <span className="nav-fsn-name">{userProfile?.fsnName || 'user'}.fsn</span>
                <span className="nav-separator">|</span>
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
      
      <style>{`
        /* FSN display styles removed - now showing FSN name only in logout button */
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
      `}</style>
    </nav>
  );
};

export default Navigation;