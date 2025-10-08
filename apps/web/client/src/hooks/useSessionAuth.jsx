import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

export const useSessionAuth = () => {
  const [session, setSession] = useState({
    isLoggedIn: false,
    userId: null,
    username: null,
    fsnName: null,
    user: null
  });

  // Query for session status
  const { data: sessionData, isLoading, refetch } = useQuery({
    queryKey: ['/api/session/check'],
    refetchInterval: 30000, // Check every 30 seconds
    staleTime: 5000,
  });

  // Query for user profile data when logged in
  const { data: userData } = useQuery({
    queryKey: ['/api/user/profile', session.userId],
    enabled: !!session.userId,
    retry: false
  });

  // Update session state when data changes
  useEffect(() => {
    if (sessionData) {
      console.log("Session data received:", sessionData);
      setSession({
        isLoggedIn: sessionData.isLoggedIn || false,
        userId: sessionData.userId || null,
        username: sessionData.username || null,
        fsnName: sessionData.fsnName || null,
        user: userData || null
      });
    }
  }, [sessionData, userData]);

  const logout = async () => {
    try {
      await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      setSession({
        isLoggedIn: false,
        userId: null,
        username: null,
        fsnName: null,
        user: null
      });
      
      refetch();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return {
    session,
    isLoading,
    logout,
    refetchSession: refetch
  };
};

export default useSessionAuth;