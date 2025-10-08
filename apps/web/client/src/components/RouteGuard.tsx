import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useSessionAuth } from '../hooks/useSessionAuth';

interface RouteGuardProps {
  children: React.ReactNode;
}

/**
 * Route guard that ensures proper authentication flow:
 * - If user has claimed FSN but not logged in, redirect to login
 * - If user is not authenticated, redirect to home for FSN claiming
 */
export const RouteGuard: React.FC<RouteGuardProps> = ({ children }) => {
  const [location, setLocation] = useLocation();
  const { isLoggedIn, isLoading } = useSessionAuth();
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

  useEffect(() => {
    // Don't check auth until session loading is complete
    if (isLoading) return;

    // Check if user has claimed FSN name (stored in localStorage as fallback)
    const hasClaimedFsn = localStorage.getItem('fsn_name') || localStorage.getItem('fsn_user');
    
    // Public routes that don't require authentication
    const publicRoutes = ['/', '/login', '/register'];
    const isPublicRoute = publicRoutes.includes(location);

    console.log('RouteGuard check:', { 
      location, 
      isLoggedIn, 
      hasClaimedFsn, 
      isPublicRoute,
      isLoading 
    });

    // If user has claimed FSN but not logged in, and trying to access protected route
    if (hasClaimedFsn && !isLoggedIn && !isPublicRoute) {
      console.log('User has FSN but not logged in, redirecting to login');
      setLocation('/login');
      return;
    }

    // If user is logged in and on login page, redirect to dashboard
    if (isLoggedIn && location === '/login') {
      console.log('User already logged in, redirecting to dashboard');
      setLocation('/dashboard');
      return;
    }

    setHasCheckedAuth(true);
  }, [location, isLoggedIn, isLoading, setLocation]);

  // Show loading while checking authentication
  if (isLoading || !hasCheckedAuth) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: '#0a0a0a',
        color: '#00f0ff'
      }}>
        <div style={{
          textAlign: 'center',
          fontFamily: 'Orbitron, sans-serif'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid rgba(0, 240, 255, 0.3)',
            borderTop: '3px solid #00f0ff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <div>Authenticating...</div>
          <style jsx>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default RouteGuard;