import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';

interface NavigationProps {
  className?: string;
  showAdmin?: boolean;
  isLoggedIn?: boolean; // We'll determine login status inside the component if not provided
}

/**
 * Navigation component for the FSN application
 * Provides links to key pages
 * Automatically detects login status if not explicitly provided
 */
const Navigation: React.FC<NavigationProps> = ({ 
  className = '', 
  showAdmin = false,
  isLoggedIn: propIsLoggedIn  // Accept login status from parent if available
}) => {
  // Use wouter's location hook for proper client-side navigation
  const [, setLocation] = useLocation();
  // Internal state for login status
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // Check login status if not provided as prop
  useEffect(() => {
    const checkLoginStatus = () => {
      const userId = localStorage.getItem('fsn_user_id');
      if (propIsLoggedIn !== undefined) {
        // Use the prop value if provided
        setIsLoggedIn(propIsLoggedIn);
      } else {
        // Otherwise check localStorage
        setIsLoggedIn(!!userId);
      }
      console.log("Navigation login check - userId:", userId, "isLoggedIn:", !!userId);
    };
    
    // Check on mount
    checkLoginStatus();
    
    // Also set up listener for storage events (in case another tab logs in/out)
    window.addEventListener('storage', checkLoginStatus);
    
    // And check again when component receives focus
    window.addEventListener('focus', checkLoginStatus);
    
    return () => {
      window.removeEventListener('storage', checkLoginStatus);
      window.removeEventListener('focus', checkLoginStatus);
    };
  }, [propIsLoggedIn]);
  
  // Handle logout with proper redirect
  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    console.log("Logging out...");
    
    try {
      // Call the logout API
      const response = await fetch('/api/logout');
      
      // Clear ALL localStorage items related to user session
      localStorage.removeItem('fsn_user_id');
      localStorage.removeItem('fsn_admin_logged_in');
      localStorage.removeItem('fsn_user');
      localStorage.removeItem('fsn_name');
      
      console.log("All localStorage items cleared");
      
      // Update logged in state immediately (don't wait for effect to run)
      setIsLoggedIn(false);
      
      if (response.ok) {
        console.log("Logout API successful");
      } else {
        console.error('Logout API failed, but localStorage was still cleared');
      }
      
      // Redirect to homepage
      setTimeout(() => {
        window.location.href = '/';  // Use full page reload to ensure clean state
      }, 100);
    } catch (error) {
      console.error('Error during logout:', error);
      
      // Still clear localStorage and redirect even if there's an API error
      localStorage.removeItem('fsn_user_id');
      localStorage.removeItem('fsn_admin_logged_in');
      localStorage.removeItem('fsn_user');
      localStorage.removeItem('fsn_name');
      
      // Use full page reload
      window.location.href = '/';
    }
  };
  
  return (
    <nav className={`fsn-navigation ${className}`}>
      <div className="nav-links">
        <Link href="/">
          <span className="nav-link">Home</span>
        </Link>
        
        {/* Always show Admin link regardless of login status */}
        <Link href="/admin-login">
          <span className="nav-link">Admin Portal</span>
        </Link>
        
        {isLoggedIn && (
          <Link href="/dashboard">
            <span className="nav-link">Dashboard</span>
          </Link>
        )}
        
        {isLoggedIn ? (
          <a href="#" onClick={handleLogout} className="nav-link logout-button">
            Logout
          </a>
        ) : (
          <Link href="/login">
            <span className="nav-link login-button">Login</span>
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navigation;