import React, { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import fsnLogoImage from "@assets/FreeSpace_Logo.jpg";
import SharedNetworkAnimation from "@/components/SharedNetworkAnimation";
import FsnHexagon from "@/components/FsnHexagon";
import ClaimButton from "@/components/ClaimButton";
import CrossBrowserInput from "@/components/CrossBrowserInput";
import Navigation from "@/components/Navigation";
import { SEOHead } from "@/components/SEOHead";
import "../styles/terminal-ui.css";

/**
 * FreeSpace Network Homepage - Picture 1 Design
 * Always shows the "Crypto starts with your .fsn name" layout
 */
const LockInHomepage: React.FC = () => {
  // State management
  const [showInput, setShowInput] = useState(false);
  const [name, setName] = useState("");
  const [isValid, setIsValid] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");
  const [typewriterText, setTypewriterText] = useState("");
  const [typewriterComplete, setTypewriterComplete] = useState(false);
  const [showSignalOverlay, setShowSignalOverlay] = useState(false);
  const [showTerminalForm, setShowTerminalForm] = useState(false);
  const [showLightCycle, setShowLightCycle] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [formError, setFormError] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // Reference and routing
  const inputRef = useRef<HTMLInputElement>(null);
  const [, setLocation] = useLocation();
  
  // Check if user is logged in for navigation purposes only
  useEffect(() => {
    const userId = localStorage.getItem('fsn_user_id');
    setIsLoggedIn(!!userId);
    console.log("Navigation login check - userId:", userId, "isLoggedIn:", !!userId);
  }, []);
  
  // Constants
  const initialText = "Emit your signal.";
  const typewriterSpeed = 100; // milliseconds per character

  // Handle redirection with FSN name parameter
  useEffect(() => {
    if (shouldRedirect) {
      // Pass the name parameter to the dashboard
      setLocation(`/dashboard?name=${encodeURIComponent(name)}`);
    }
  }, [shouldRedirect, name, setLocation]);

  // Typewriter effect
  useEffect(() => {
    let index = 0;
    const timer = setInterval(() => {
      if (index < initialText.length) {
        setTypewriterText(initialText.slice(0, index + 1));
        index++;
      } else {
        setTypewriterComplete(true);
        clearInterval(timer);
      }
    }, typewriterSpeed);

    return () => clearInterval(timer);
  }, []);

  // Reserved FSN names that cannot be claimed
  const RESERVED_NAMES = [
    'admin', 'support', 'nazi', 'fsn', 'coinbase', 'binance', 'ethereum', 'bitcoin',
    'root', 'system', 'api', 'www', 'mail', 'ftp', 'test', 'dev', 'staging',
    'production', 'app', 'web', 'mobile', 'desktop', 'server', 'database', 'db',
    'cache', 'cdn', 'static', 'assets', 'media', 'images', 'js', 'css', 'html',
    'xml', 'json', 'csv', 'pdf', 'doc', 'txt', 'log', 'backup', 'archive',
    'security', 'privacy', 'legal', 'terms', 'help', 'about', 'contact', 'blog',
    'news', 'info', 'service', 'services', 'product', 'products', 'buy', 'sell',
    'shop', 'store', 'cart', 'checkout', 'payment', 'billing', 'invoice',
    'account', 'profile', 'user', 'users', 'member', 'members', 'guest', 'public',
    'private', 'internal', 'external', 'local', 'global', 'config', 'settings'
  ];

  // Proper FSN validation function with all format rules
  const isValidFsnName = (name: string): { valid: boolean; error?: string } => {
    // Check length
    if (name.length < 3 || name.length > 20) {
      return { valid: false, error: 'Name must be 3-20 characters long' };
    }
    
    // Check format: lowercase letters, numbers, hyphens only
    if (!/^[a-z0-9-]+$/.test(name)) {
      return { valid: false, error: 'Name can only contain lowercase letters, numbers, and hyphens' };
    }
    
    // Check reserved names
    if (RESERVED_NAMES.includes(name.toLowerCase())) {
      return { valid: false, error: 'This name is reserved and cannot be claimed' };
    }
    
    // Check for consecutive hyphens or leading/trailing hyphens
    if (name.includes('--') || name.startsWith('-') || name.endsWith('-')) {
      return { valid: false, error: 'Invalid hyphen placement' };
    }
    
    return { valid: true };
  };

  // Handle claim button click - navigate to claim page
  const handleClaimButtonClick = () => {
    setLocation('/claim');
  };

  // Check name availability with proper validation
  const checkNameAvailability = async () => {
    if (name && name.length >= 3) {
      setIsChecking(true);
      setValidationMessage('Checking availability...');
      
      try {
        // First check format validation
        const formatCheck = isValidFsnName(name);
        if (!formatCheck.valid) {
          setIsValid(false);
          setValidationMessage(formatCheck.error || 'Invalid name format');
          setIsChecking(false);
          return;
        }
        
        // Then check actual availability with the server
        const response = await fetch(`/api/check-name/${encodeURIComponent(name)}`);
        const data = await response.json();
        
        if (data.available) {
          // Name is available, navigate to claim page with pre-filled name
          setIsValid(true);
          setValidationMessage('Name is available! Redirecting...');
          
          // Navigate to claim page with name parameter
          setTimeout(() => {
            setLocation(`/claim-fsn?name=${encodeURIComponent(name)}`);
          }, 1000);
        } else {
          // Name is not available
          setIsValid(false);
          setValidationMessage(data.reason || 'This name is already taken');
        }
      } catch (error) {
        console.error('Error checking name availability:', error);
        setValidationMessage('Error checking availability');
        setIsValid(false);
      } finally {
        setIsChecking(false);
      }
    }
  };

  // Handle input validation with proper FSN format checking
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Clean the input to ensure only valid characters (lowercase letters, numbers, hyphens)
    const rawValue = e.target.value;
    const newName = rawValue.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setName(newName);
    
    // Validate name with proper FSN rules
    const validation = isValidFsnName(newName);
    setIsValid(validation.valid);
    
    if (newName.length === 0) {
      setValidationMessage('');
    } else if (!validation.valid) {
      setValidationMessage(validation.error || 'Invalid name format');
    } else {
      // Don't set "Name is available" on input change - leave it blank until verified
      setValidationMessage('');
    }
  };
  
  // Handle enter key press
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && name && isValid && !isChecking) {
      checkNameAvailability();
    }
  };

  // Handle form submission - registers user and FSN name
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(""); // Clear previous errors
    
    // Get form data
    const formEl = e.target as HTMLFormElement;
    const emailInput = formEl.querySelector('input[type="email"]') as HTMLInputElement;
    const passwordInput = document.getElementById('password-field') as HTMLInputElement;
    const confirmInput = document.getElementById('confirm-field') as HTMLInputElement;
    
    // Form validation
    if (!emailInput.value) {
      setFormError("Please enter your email address");
      return;
    }
    
    if (passwordInput.value !== confirmInput.value) {
      setFormError("Passwords do not match");
      return;
    }
    
    try {
      // Register user and FSN name
      const response = await fetch('/api/user/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Create a unique username (fsn name + random suffix)
          username: `${name}_${Math.floor(Math.random() * 10000)}`,
          email: emailInput.value,
          password: passwordInput.value,
          fsnName: name, // Backend will format properly
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Set the primary user ID key (this is what all components check for login status)
        localStorage.setItem('fsn_user_id', data.user.id.toString());
        
        // Store complete user info in localStorage for dashboard
        localStorage.setItem('fsn_user', JSON.stringify({
          id: data.user.id,
          username: data.user.username,
          fsnName: data.domain?.name || `${name}.fsn`,
          xp: 100, // Initial XP for claiming name
          level: 1
        }));
        
        // Store FSN name separately
        localStorage.setItem('fsn_name', data.domain?.name || `${name}.fsn`);
        
        console.log(`User registered successfully with ID: ${data.user.id}`);
        
        // Set logged in state (ensures navigation shows logout instead of login)
        setIsLoggedIn(true);
        
        // Show TRON light cycle animation
        setShowLightCycle(true);
        
        // Redirect after animation completes
        setTimeout(() => {
          setShouldRedirect(true);
        }, 1200);
      } else {
        const errorData = await response.json();
        setFormError(errorData.error || 'Registration failed. Please try again.');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setFormError('Connection error. Please try again.');
    }
  };

  return (
    <>
      <SEOHead />
      <section className="hero mobile-friendly-hero">
        <Navigation isLoggedIn={isLoggedIn} showFullNav={false} />
        <SharedNetworkAnimation className="network-background" />
      
      {/* Main content - Always show Picture 1 design */}
      {!showSignalOverlay && !showTerminalForm && (
        <>
          <div className="hero-left mobile-friendly-content">
            <div className="logo-bar">
              <img src={fsnLogoImage} alt="FreeSpace Network" className="logo-icon logo-only" />
            </div>
            <h1 className="mobile-compatible-heading">
              Crypto starts with your <span className="highlight">.fsn</span> name
            </h1>
            <p className="fsn-subtitle mobile-compatible-text">
              Unlock your wallet, encrypted storage vault, and Web3 identity — all with your <span className="fsn-highlight">.fsn</span> name.
            </p>
            <p className="subheadline mobile-compatible-text">
              Claim your Web3 identity.<br />
              Earn XP. <span className="typewriter always-glowing" style={{ display: 'inline-block' }}>{typewriterText}</span>
              {!typewriterComplete && <span className="typewriter-cursor"></span>}
            </p>
            
            {/* Button or Input Field */}
            {!showInput ? (
              <div className="safari-button-wrapper">
                <ClaimButton onClick={handleClaimButtonClick} />
              </div>
            ) : (
              <div className="input-container-wrapper">
                {/* Cross-browser compatible input implementation */}
                <CrossBrowserInput
                  value={name}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter your name"
                />
                
                <div className="message-container">
                  {name && isValid && !isChecking && (
                    <div className="enter-hint mobile-hint">
                      <span>Press Enter to continue</span>
                      <svg className="enter-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3 19V5C3 3.89543 3.89543 3 5 3H19C20.1046 3 21 3.89543 21 5V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19Z" stroke="#00f0ff" strokeWidth="1.5"/>
                        <path d="M7 12H17M17 12L13 8M17 12L13 16" stroke="#00f0ff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  )}
                  {isChecking && !validationMessage && (
                    <div className="checking-indicator mobile-indicator">Checking availability...</div>
                  )}
                  {validationMessage && (
                    <div className={`validation-message mobile-message ${isValid ? 'success' : 'error'}`}>
                      {validationMessage}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <div className="hero-right">
            <FsnHexagon size={300} className="hex-image" />
          </div>
        </>
      )}
      
      {/* Signal Overlay */}
      {showSignalOverlay && (
        <div className="signal-overlay fade-in">
          <div className="signal-content">
            <div className="signal-hexagon">
              <FsnHexagon size={400} />
            </div>
            <div className="signal-text">
              <h2>Signal detected...</h2>
              <p>Your FSN identity is initializing</p>
            </div>
          </div>
        </div>
      )}

      {/* Terminal Registration Form */}
      {showTerminalForm && (
        <div className="terminal-overlay fade-in">
          <div className="terminal-window">
            <div className="terminal-header">
              <div className="terminal-controls">
                <span className="terminal-dot red"></span>
                <span className="terminal-dot yellow"></span>
                <span className="terminal-dot green"></span>
              </div>
              <span className="terminal-title">FSN Identity Terminal</span>
            </div>
            <div className="terminal-body">
              <div className="terminal-content">
                <div className="terminal-line">
                  <span className="terminal-prompt">fsn@network:~$</span>
                  <span className="terminal-command">init --identity {name}.fsn</span>
                </div>
                <div className="terminal-line">
                  <span className="terminal-output">Initializing FSN identity: {name}.fsn</span>
                </div>
                <div className="terminal-line">
                  <span className="terminal-output">Please complete identity verification:</span>
                </div>
                
                <form onSubmit={handleFormSubmit} className="terminal-form">
                  <div className="form-group">
                    <label className="terminal-label">Email Address:</label>
                    <input 
                      type="email" 
                      className="terminal-input" 
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="terminal-label">Password:</label>
                    <input 
                      type="password" 
                      id="password-field"
                      className="terminal-input" 
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="terminal-label">Confirm Password:</label>
                    <input 
                      type="password" 
                      id="confirm-field"
                      className="terminal-input" 
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  
                  {formError && (
                    <div className="terminal-error">
                      ERROR: {formError}
                    </div>
                  )}
                  
                  <button type="submit" className="terminal-button">
                    CLAIM {name}.fsn IDENTITY
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TRON Light Cycle Animation */}
      {showLightCycle && (
        <>
          <div className="light-cycle-overlay">
            <div className="light-cycle-container">
              <div className="light-cycle-grid">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div key={i} className="grid-line horizontal" style={{ top: `${i * 5}%` }}></div>
                ))}
                {Array.from({ length: 20 }).map((_, i) => (
                  <div key={i} className="grid-line vertical" style={{ left: `${i * 5}%` }}></div>
                ))}
              </div>
              <div className="light-cycle">
                <div className="cycle-light"></div>
              </div>
              <div className="success-message">
                <h2>Identity Claimed!</h2>
                <p>Welcome to the FreeSpace Network, {name}.fsn</p>
              </div>
            </div>
          </div>
        </>
      )}
      </section>
    </>
  );
};

export default LockInHomepage;