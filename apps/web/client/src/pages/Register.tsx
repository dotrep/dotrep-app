import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import SharedNetworkAnimation from "@/components/SharedNetworkAnimation";
import fsnLogoImage from "@assets/FreeSpace_Logo.jpg";
import FsnHexagon from "@/components/FsnHexagon";

/**
 * FreeSpace Network Registration Page
 * This page appears after a user has claimed their .fsn name
 */
const Register: React.FC = () => {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNextStep, setShowNextStep] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [claimedName, setClaimedName] = useState("");
  
  // Get the claimed name from URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const name = params.get("name");
    if (name) {
      setClaimedName(name);
    } else {
      // If no name parameter, redirect back to home
      setLocation("/");
    }
  }, [setLocation]);
  
  // Validate email format
  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };
  
  // Handle email input changes
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (e.target.value && !validateEmail(e.target.value)) {
      setEmailError("Please enter a valid email address");
    } else {
      setEmailError("");
    }
  };
  
  // Handle password changes
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (e.target.value && e.target.value.length < 8) {
      setPasswordError("Password must be at least 8 characters");
    } else if (confirmPassword && e.target.value !== confirmPassword) {
      setPasswordError("Passwords do not match");
    } else {
      setPasswordError("");
    }
  };
  
  // Handle confirm password changes
  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
    if (password && e.target.value !== password) {
      setPasswordError("Passwords do not match");
    } else {
      setPasswordError("");
    }
  };
  
  // Handle Enter key press for form submission
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const form = e.currentTarget.closest('form');
      if (form) {
        const formEvent = new Event('submit', { bubbles: true, cancelable: true });
        form.dispatchEvent(formEvent);
      }
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    if (!email || !validateEmail(email)) {
      setEmailError("Please enter a valid email address");
      // Focus on email field
      const emailField = document.getElementById('email');
      emailField?.focus();
      return;
    }
    
    if (!password || password.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      // Focus on password field
      const passwordField = document.getElementById('password');
      passwordField?.focus();
      return;
    }
    
    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match");
      // Focus on confirm password field
      const confirmField = document.getElementById('confirm-password');
      confirmField?.focus();
      return;
    }
    
    // Show next step or navigate to dashboard
    setShowNextStep(true);
    
    // In a real app, we would submit to the server here
    // For now, just show success message and have option to continue
  };
  
  // Navigate to the dashboard
  const handleContinue = () => {
    // In a real app, we would navigate to the dashboard
    setLocation("/dashboard");
  };
  
  return (
    <div className="register-page">
      <SharedNetworkAnimation className="network-background" />
      
      <div className="register-container">
        <div className="logo-bar center-logo">
          <img src={fsnLogoImage} alt="FSN Logo" className="logo-icon" />
          <span className="logo-text">FreeSpace Network</span>
        </div>
        
        <div className="register-content" style={{ 
          display: 'flex', 
          gap: '50px', 
          alignItems: 'flex-start',
          justifyContent: 'center',
          width: '100%',
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '20px'
        }}>
          <div className="register-left" style={{
            flex: '1',
            minWidth: '400px',
            maxWidth: '500px'
          }}>
            <h1>Complete <span className="highlight">your profile</span></h1>
            
            <div className="claimed-name-display">
              <span className="label">Your claimed name:</span>
              <div className="claimed-name-badge">
                {claimedName}<span className="highlight">.fsn</span>
              </div>
            </div>
            
            {!showNextStep ? (
              <form 
                className="register-form" 
                onSubmit={handleSubmit}
                style={{
                  width: '100%',
                  maxWidth: '400px',
                  padding: '20px',
                  boxSizing: 'border-box'
                }}
              >
                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label htmlFor="email" style={{ 
                    display: 'block', 
                    color: '#00f0ff', 
                    fontFamily: 'Orbitron, sans-serif', 
                    fontSize: '14px', 
                    marginBottom: '8px',
                    fontWeight: '500'
                  }}>Email Address:</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={handleEmailChange}
                    onKeyDown={handleKeyDown}
                    autoCapitalize="none"
                    autoCorrect="off"
                    autoComplete="email"
                    tabIndex={1}
                    autoFocus
                    required
                    style={{
                      background: 'rgba(10, 20, 30, 0.95)',
                      border: '2px solid rgba(0, 240, 255, 0.4)',
                      borderRadius: '6px',
                      padding: '14px 18px',
                      color: '#ffffff',
                      fontFamily: 'Orbitron, sans-serif',
                      fontSize: '16px',
                      width: '100%',
                      outline: 'none',
                      transition: 'all 0.2s ease',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => {
                      e.target.style.border = '2px solid #00f0ff';
                      e.target.style.boxShadow = '0 0 15px rgba(0, 240, 255, 0.5)';
                      e.target.style.background = 'rgba(5, 15, 25, 0.98)';
                    }}
                    onBlur={(e) => {
                      e.target.style.border = '2px solid rgba(0, 240, 255, 0.4)';
                      e.target.style.boxShadow = 'none';
                      e.target.style.background = 'rgba(10, 20, 30, 0.95)';
                    }}
                  />
                  {emailError && <div className="error-message" style={{ color: '#ff4444', fontSize: '12px', marginTop: '5px' }}>{emailError}</div>}
                </div>
                
                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label htmlFor="password" style={{ 
                    display: 'block', 
                    color: '#00f0ff', 
                    fontFamily: 'Orbitron, sans-serif', 
                    fontSize: '14px', 
                    marginBottom: '8px',
                    fontWeight: '500'
                  }}>Password:</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={handlePasswordChange}
                    onKeyDown={handleKeyDown}
                    autoCapitalize="none"
                    autoCorrect="off"
                    autoComplete="new-password"
                    tabIndex={2}
                    required
                    minLength={8}
                    style={{
                      background: 'rgba(10, 20, 30, 0.95)',
                      border: '2px solid rgba(0, 240, 255, 0.4)',
                      borderRadius: '6px',
                      padding: '14px 18px',
                      color: '#ffffff',
                      fontFamily: 'Orbitron, sans-serif',
                      fontSize: '16px',
                      width: '100%',
                      outline: 'none',
                      transition: 'all 0.2s ease',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => {
                      e.target.style.border = '2px solid #00f0ff';
                      e.target.style.boxShadow = '0 0 15px rgba(0, 240, 255, 0.5)';
                      e.target.style.background = 'rgba(5, 15, 25, 0.98)';
                    }}
                    onBlur={(e) => {
                      e.target.style.border = '2px solid rgba(0, 240, 255, 0.4)';
                      e.target.style.boxShadow = 'none';
                      e.target.style.background = 'rgba(10, 20, 30, 0.95)';
                    }}
                  />
                </div>
                
                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label htmlFor="confirm-password" style={{ 
                    display: 'block', 
                    color: '#00f0ff', 
                    fontFamily: 'Orbitron, sans-serif', 
                    fontSize: '14px', 
                    marginBottom: '8px',
                    fontWeight: '500'
                  }}>Confirm Password:</label>
                  <input
                    type="password"
                    id="confirm-password"
                    name="confirmPassword"
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={handleConfirmPasswordChange}
                    onKeyDown={handleKeyDown}
                    autoCapitalize="none"
                    autoCorrect="off"
                    autoComplete="new-password"
                    tabIndex={3}
                    required
                    minLength={8}
                    style={{
                      background: 'rgba(10, 20, 30, 0.95)',
                      border: '2px solid rgba(0, 240, 255, 0.4)',
                      borderRadius: '6px',
                      padding: '14px 18px',
                      color: '#ffffff',
                      fontFamily: 'Orbitron, sans-serif',
                      fontSize: '16px',
                      width: '100%',
                      outline: 'none',
                      transition: 'all 0.2s ease',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => {
                      e.target.style.border = '2px solid #00f0ff';
                      e.target.style.boxShadow = '0 0 15px rgba(0, 240, 255, 0.5)';
                      e.target.style.background = 'rgba(5, 15, 25, 0.98)';
                    }}
                    onBlur={(e) => {
                      e.target.style.border = '2px solid rgba(0, 240, 255, 0.4)';
                      e.target.style.boxShadow = 'none';
                      e.target.style.background = 'rgba(10, 20, 30, 0.95)';
                    }}
                  />
                  {passwordError && <div className="error-message" style={{ color: '#ff4444', fontSize: '12px', marginTop: '5px' }}>{passwordError}</div>}
                </div>
                
                <div style={{ 
                  marginTop: '35px', 
                  marginBottom: '25px',
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '20px',
                  width: '100%',
                  alignItems: 'center'
                }}>
                  <button 
                    type="submit" 
                    tabIndex={4}
                    style={{
                      background: 'linear-gradient(135deg, #00f0ff 0%, #0080ff 100%)',
                      border: '3px solid #00f0ff',
                      borderRadius: '8px',
                      padding: '16px 32px',
                      color: '#ffffff',
                      fontFamily: 'Orbitron, sans-serif',
                      fontSize: '18px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      outline: 'none',
                      transition: 'all 0.3s ease',
                      textTransform: 'uppercase',
                      letterSpacing: '2px',
                      boxShadow: '0 0 25px rgba(0, 240, 255, 0.5)',
                      width: '100%',
                      maxWidth: '300px',
                      minHeight: '55px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      zIndex: 10
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.05)';
                      e.currentTarget.style.boxShadow = '0 0 35px rgba(0, 240, 255, 0.8)';
                      e.currentTarget.style.background = 'linear-gradient(135deg, #00f0ff 0%, #00a0ff 100%)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = '0 0 25px rgba(0, 240, 255, 0.5)';
                      e.currentTarget.style.background = 'linear-gradient(135deg, #00f0ff 0%, #0080ff 100%)';
                    }}
                  >
                    🚀 SUBMIT
                  </button>
                  
                  <div style={{
                    fontSize: '13px',
                    color: 'rgba(0, 240, 255, 0.8)',
                    textAlign: 'center',
                    fontFamily: 'Orbitron, sans-serif',
                    marginTop: '10px',
                    padding: '8px',
                    background: 'rgba(0, 240, 255, 0.05)',
                    borderRadius: '4px',
                    border: '1px solid rgba(0, 240, 255, 0.2)'
                  }}>
                    ⌨️ Press ENTER to submit • TAB to navigate • All fields required
                  </div>
                </div>
              </form>
            ) : (
              <div className="success-step">
                <div className="success-icon-large">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="#00f0ff" strokeWidth="2"/>
                    <path d="M8 12L11 15L16 9" stroke="#00f0ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h2>Registration Complete!</h2>
                <p>Your account has been created successfully.</p>
                <p>Welcome to the FreeSpace Network!</p>
                <button className="cta" onClick={handleContinue}>
                  Continue to Dashboard
                </button>
              </div>
            )}
          </div>
          
          <div className="register-right" style={{
            flex: '1',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <FsnHexagon size={300} className="hex-image" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;