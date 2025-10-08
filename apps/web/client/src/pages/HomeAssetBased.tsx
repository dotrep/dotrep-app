import React, { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import fsnLogoImage from "@assets/FreeSpace_Logo.jpg";
import SharedNetworkAnimation from "@/components/SharedNetworkAnimation";
import FsnHexagon from "@/components/FsnHexagon";
import ClaimButton from "@/components/ClaimButton";
import CrossBrowserInput from "@/components/CrossBrowserInput";
import Navigation from "@/components/Navigation";
import { MagicWalletIntegration } from "@/components/MagicWalletIntegration";
import "../styles/terminal-ui.css";

/**
 * FreeSpace Network Homepage
 * Matches the provided specification
 */
const HomeAssetBased: React.FC = () => {
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
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // Reference and routing
  const inputRef = useRef<HTMLInputElement>(null);
  const [, setLocation] = useLocation();
  
  // Check if user is logged in (run this on mount and whenever location changes)
  useEffect(() => {
    const userId = localStorage.getItem('fsn_user_id');
    setIsLoggedIn(!!userId);
    console.log("Homepage login check - userId:", userId);
  }, [location]);
  
  // Constants
  const initialText = "Emit your signal.";
  const typewriterSpeed = 100; // milliseconds per character

  // Handle redirection with FSN name parameter
  useEffect(() => {
    if (shouldRedirect) {
      // Pass the name parameter to the dashboard
      setLocation(`/dashboard?name=${encodeURIComponent(name)}`);
    }
  }, [shouldRedirect, setLocation, name]);

  // Auto-focus the input when it appears
  useEffect(() => {
    if (showInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showInput]);
  
  // Typewriter effect
  useEffect(() => {
    let currentIndex = 0;
    setTypewriterText('');
    setTypewriterComplete(false);
    
    const typeNextCharacter = () => {
      if (currentIndex < initialText.length) {
        setTypewriterText(initialText.substring(0, currentIndex + 1));
        currentIndex++;
        setTimeout(typeNextCharacter, typewriterSpeed);
      } else {
        setTypewriterComplete(true);
      }
    };
    
    setTimeout(typeNextCharacter, 800);
  }, [initialText]);

  // Handle the claim button click
  const handleClaimButtonClick = async () => {
    if (!showInput) {
      setShowInput(true);
    } else if (name.length >= 3) {
      // First check name availability with the server
      try {
        setIsChecking(true);
        setValidationMessage('Checking availability...');
        
        // Format FSN name
        const fsnName = name.endsWith('.fsn') ? name : `${name}.fsn`;
        
        // Call API to check availability
        const response = await fetch(`/api/fsn/check/${name}`);
        
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        
        const data = await response.json();
        
        if (data.available) {
          // Name is available, proceed with signal animation
          setIsValid(true);
          setValidationMessage('Name is available');
          setShowSignalOverlay(true);
          
          // After 2 seconds, show terminal form
          setTimeout(() => {
            setShowSignalOverlay(false);
            setShowTerminalForm(true);
          }, 2000);
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

  // Handle input validation
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);
    
    // Validate name
    const valid = isValidName(newName);
    setIsValid(valid);
    
    if (newName.length === 0) {
      setValidationMessage('');
    } else if (newName.length < 3) {
      setIsValid(false);
      setValidationMessage('Name must be at least 3 characters');
    } else if (!valid) {
      setValidationMessage('Only letters, numbers, - and _ are allowed');
    } else {
      // Don't set "Name is available" on input change - leave it blank until verified
      setValidationMessage('');
    }
  };
  
  // Handle enter key press
  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && isValid && name.length >= 3) {
      e.preventDefault();
      
      // Same as claim button, check name availability first
      try {
        setIsChecking(true);
        setValidationMessage('Checking availability...');
        
        // Format FSN name
        const fsnName = name.endsWith('.fsn') ? name : `${name}.fsn`;
        
        // Call API to check availability
        const response = await fetch(`/api/fsn/check/${name}`);
        const data = await response.json();
        
        if (data.available) {
          // Name is available, proceed with signal animation
          setIsValid(true);
          setValidationMessage('Name is available');
          setShowSignalOverlay(true);
          
          // After 2 seconds, show terminal form
          setTimeout(() => {
            setShowSignalOverlay(false);
            setShowTerminalForm(true);
          }, 2000);
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

  // Name validation
  const isValidName = (name: string): boolean => {
    return /^[a-zA-Z0-9_-]{3,20}$/.test(name);
  };

  // State for terminal form errors
  const [formError, setFormError] = useState<string>("");

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
    
    // Format FSN name (ensure it has .fsn suffix)
    const fsnName = name.endsWith('.fsn') ? name : `${name}.fsn`;
    
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
    <section className="hero mobile-friendly-hero">
      <Navigation isLoggedIn={isLoggedIn} />
      <SharedNetworkAnimation className="network-background" />
      
      {/* Main content */}
      {!showSignalOverlay && !showTerminalForm && (
        <>
          <div className="hero-left mobile-friendly-content">
            <div className="logo-bar">
              <img src={fsnLogoImage} alt="FreeSpace Network" className="logo-icon logo-only" />
            </div>
            <h1 className="mobile-compatible-heading">Crypto starts with your <span className="highlight">.fsn</span> name</h1>
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
                      <span>Press Enter to claim</span>
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
      
      {/* TRON Light Cycle Animation */}
      {showLightCycle && (
        <>
          <div className="light-cycle"></div>
          <div className="light-trail"></div>
        </>
      )}
      
      {/* Signal animation overlay */}
      <div id="signal-overlay" className={showSignalOverlay ? 'active' : ''}>
        <div className="pulse-ring"></div>
        <p className="signal-text">Emitting your signal...</p>
      </div>
      
      {/* Terminal UI form */}
      <div id="terminal-ui" className={showTerminalForm ? 'active' : ''}>
        <div className="terminal-glow-frame">
          <h2 className="terminal-header">Identity Console</h2>
          
          <form id="terminal-form" onSubmit={handleFormSubmit}>
            <label>.fsn Name</label>
            <input type="text" id="fsn-name" value={`${name}.fsn`} readOnly />
            
            <label>Email Address</label>
            <input type="email" placeholder="Enter your email" required />
            
            <label>Create Password</label>
            <div className="password-input-container">
              <input 
                type="password" 
                placeholder="8+ characters" 
                pattern=".{8,}" 
                title="Password must be at least 8 characters" 
                required 
                id="password-field"
              />
              <button 
                type="button" 
                className="password-toggle-btn"
                title="Show/Hide Password"
                onClick={() => {
                  const passwordField = document.getElementById('password-field') as HTMLInputElement;
                  const confirmField = document.getElementById('confirm-field') as HTMLInputElement;
                  const toggleIcon = document.getElementById('pwd-toggle-icon');
                  
                  if (passwordField.type === 'password') {
                    passwordField.type = 'text';
                    confirmField.type = 'text';
                    toggleIcon?.classList.add('show');
                    toggleIcon?.classList.remove('hide');
                  } else {
                    passwordField.type = 'password';
                    confirmField.type = 'password';
                    toggleIcon?.classList.remove('show');
                    toggleIcon?.classList.add('hide');
                  }
                }}
              >
                <span id="pwd-toggle-icon" className="pwd-toggle-icon hide">
                  <span className="show-text">HIDE</span>
                  <span className="hide-text">SHOW</span>
                </span>
              </button>
            </div>
            <div className="password-requirements">
              Must be at least 8 characters
            </div>
            
            <label>Confirm Password</label>
            <div className="password-input-container">
              <input 
                type="password" 
                placeholder="Re-enter password" 
                required 
                id="confirm-field"
                pattern=".{8,}"
                title="Password must be at least 8 characters"
              />
            </div>
            
            {formError && (
              <div className="terminal-error-message">
                {formError}
              </div>
            )}
            
            <button type="submit">Enter the Network</button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default HomeAssetBased;