import { useState, useEffect } from 'react';

interface SessionData {
  isLoggedIn: boolean;
  userId?: number;
  username?: string;
  fsnName?: string;
  loginTime?: number;
}

/**
 * Custom hook for session-based authentication
 * Automatically checks session status and handles logout on browser close
 */
export function useSessionAuth() {
  const [session, setSession] = useState<SessionData>({ isLoggedIn: false });
  const [isLoading, setIsLoading] = useState(true);

  const checkSession = async () => {
    try {
      const response = await fetch('/api/session/check', {
        credentials: 'include' // Include cookies
      });
      
      if (response.ok) {
        const sessionData = await response.json();
        setSession(sessionData);
        
        // Also store in localStorage for compatibility with existing code
        // but session is the source of truth
        if (sessionData.isLoggedIn && sessionData.userId) {
          localStorage.setItem('fsn_user_id', sessionData.userId.toString());
          localStorage.setItem('fsn_user', sessionData.username || '');
          localStorage.setItem('fsn_name', sessionData.fsnName || '');
        } else {
          // Clear localStorage if not logged in
          localStorage.removeItem('fsn_user_id');
          localStorage.removeItem('fsn_user');
          localStorage.removeItem('fsn_name');
        }
      } else {
        setSession({ isLoggedIn: false });
        // Clear localStorage on session check failure
        localStorage.removeItem('fsn_user_id');
        localStorage.removeItem('fsn_user');
        localStorage.removeItem('fsn_name');
      }
    } catch (error) {
      console.error('Session check failed:', error);
      setSession({ isLoggedIn: false });
      // Clear localStorage on error
      localStorage.removeItem('fsn_user_id');
      localStorage.removeItem('fsn_user');
      localStorage.removeItem('fsn_name');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setSession({ isLoggedIn: false });
      // Clear all localStorage
      localStorage.removeItem('fsn_user_id');
      localStorage.removeItem('fsn_user');
      localStorage.removeItem('fsn_name');
      localStorage.removeItem('fsn_admin_logged_in');
      
      // Redirect to home
      window.location.href = '/';
    }
  };

  useEffect(() => {
    // Check session on mount
    checkSession();

    // Set up periodic session checks (every 5 minutes)
    const interval = setInterval(checkSession, 5 * 60 * 1000);

    // Check session when window gains focus (user returns to tab)
    const handleFocus = () => {
      checkSession();
    };
    
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  return {
    session,
    isLoading,
    isLoggedIn: session.isLoggedIn,
    userId: session.userId,
    username: session.username,
    fsnName: session.fsnName,
    checkSession,
    logout
  };
}