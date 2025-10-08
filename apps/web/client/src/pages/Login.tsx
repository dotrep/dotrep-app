import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import fsnLogoImage from "@assets/FreeSpace_Logo.jpg";
import SharedNetworkAnimation from "@/components/SharedNetworkAnimation";
import Navigation from "@/components/Navigation";
import FSNClaimPopup from "@/components/FSNClaimPopup";
import "../styles/login-page.css";

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [location, setLocation] = useLocation();
  const [showClaimPopup, setShowClaimPopup] = useState(false);
  
  // Check if user is already logged in
  useEffect(() => {
    const userId = localStorage.getItem('fsn_user_id');
    if (userId) {
      // User is already logged in, redirect to dashboard
      setLocation('/dashboard');
    }
  }, [setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!username || !password) {
      setError('Please enter both username and password');
      setIsLoading(false);
      return;
    }

    try {
      // Remove .fsn suffix if user entered it
      const cleanUsername = username.replace(/\.fsn$/, '');
      
      console.log(`Attempting login with username: ${cleanUsername}`);
      
      const response = await fetch('/api/user/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for session
        body: JSON.stringify({ 
          username: cleanUsername,
          password 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('Login successful:', data);
        
        // With session-based auth, we still store some data for compatibility
        // but session is the source of truth
        if (data.sessionBased) {
          // For session-based auth, just store minimal data
          localStorage.setItem('fsn_user_id', data.id.toString());
          if (data.fsnName) {
            localStorage.setItem('fsn_name', data.fsnName);
          }
          if (data.username) {
            localStorage.setItem('fsn_user', data.username);
          }
        } else {
          // Fallback for older auth system
          localStorage.setItem('fsn_user_id', data.id.toString());
          if (data.fsnName) {
            localStorage.setItem('fsn_name', data.fsnName);
          }
          if (data.isAdmin) {
            localStorage.setItem('fsn_admin_logged_in', 'true');
          }
        }

        // Redirect to dashboard
        setLocation('/dashboard');
      } else {
        console.log('Login failed:', data);
        setError(data.error || 'Login failed. Please try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="login-page">
      <Navigation isLoggedIn={false} showFullNav={false} />
      <SharedNetworkAnimation className="network-background" />

      <div className="login-container">
        <div className="login-logo">
          <img src={fsnLogoImage} alt="FreeSpace Network" className="logo-icon" />
        </div>

        <div className="login-form-container">
          <h1>Log In to FreeSpace Network</h1>
          
          {error && <div className="login-error">{error}</div>}
          
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="username">Your .fsn name</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your .fsn name"
                disabled={isLoading}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                disabled={isLoading}
              />
            </div>
            
            <button 
              type="submit" 
              className="login-submit-button"
              disabled={isLoading}
            >
              {isLoading ? 'Logging in...' : 'Log In'}
            </button>
          </form>
          
          <div className="login-links">
            <p>
              Don't have an account?{' '}
              <button 
                onClick={() => setShowClaimPopup(true)}
                className="register-link"
                type="button"
              >
                Register now
              </button>
            </p>
            <p>
              <a href="/forgot-password" className="forgot-password-link">
                Forgot your password?
              </a>
            </p>
          </div>
        </div>
      </div>
      
      <FSNClaimPopup 
        isOpen={showClaimPopup}
        onClose={() => setShowClaimPopup(false)}
      />
    </section>
  );
};

export default Login;