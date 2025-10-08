import React, { useState } from "react";
import { useLocation } from "wouter";
import Logo from "@/components/Logo";
import HexagonV2 from "@/components/HexagonV2";
import Modal from "@/components/ui/modal";
import Navigation from "@/components/Navigation";

const Home: React.FC = () => {
  const [, setLocation] = useLocation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [fsnInput, setFsnInput] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [availabilityStatus, setAvailabilityStatus] = useState<any>(null);
  const [showClaimInput, setShowClaimInput] = useState(false);
  
  const checkNameAvailability = async (name: string) => {
    if (name.length < 3) {
      setAvailabilityStatus(null);
      return;
    }
    
    setIsChecking(true);
    try {
      const response = await fetch(`/api/check-name/${name}`);
      const result = await response.json();
      setAvailabilityStatus(result);
    } catch (err) {
      console.error('Failed to check name availability:', err);
    } finally {
      setIsChecking(false);
    }
  };
  
  const handleOpenModal = () => {
    setShowClaimInput(true);
  };
  
  const handleProceedToClaim = () => {
    if (fsnInput && availabilityStatus?.available) {
      setLocation(`/claim-fsn?name=${fsnInput}`);
    }
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };
  
  const handleSubmit = (name: string) => {
    setIsModalOpen(false);
    setShowSuccess(true);
  };

  return (
    <div className="fsn-page">
      <Navigation showFullNav={false} />
      <div className="fsn-content">
        {/* Logo Section */}
        <div className="fsn-logo">
          <Logo />
        </div>
        
        {/* Main Headline */}
        <h1 className="fsn-headline">
          Crypto starts with<br/>
          your <span className="highlight">.fsn</span> name
        </h1>
        
        {/* Subtext and Hexagon */}
        <div className="fsn-row">
          {/* Subtext */}
          <div className="fsn-subtext">
            <p>Claim your Web3 ident'ty.</p>
            <p>Earn XP.</p>
            <p>Emit your Signal.</p>
          </div>
          
          {/* Hexagon */}
          <HexagonV2 />
        </div>
        
        {/* Claim Button or Input */}
        <div className="fsn-button-container">
          {!showClaimInput ? (
            <button 
              className="fsn-button"
              onClick={handleOpenModal}
              aria-label="Claim your FSN name"
            >
              Claim your .fsn name
            </button>
          ) : (
            <div style={{ textAlign: 'center', maxWidth: '400px', margin: '0 auto' }}>
              {/* FSN Input */}
              <div style={{ position: 'relative', marginBottom: '20px' }}>
                <input
                  type="text"
                  value={fsnInput}
                  onChange={(e) => {
                    const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                    setFsnInput(value);
                    if (value.length >= 3) {
                      checkNameAvailability(value);
                    } else {
                      setAvailabilityStatus(null);
                    }
                  }}
                  placeholder="Enter your desired name"
                  style={{
                    width: '100%',
                    padding: '15px 20px',
                    paddingRight: '60px',
                    backgroundColor: 'transparent',
                    border: '2px solid #00f0ff',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    outline: 'none',
                    boxShadow: '0 0 10px rgba(0, 240, 255, 0.3)',
                    textAlign: 'center'
                  }}
                  maxLength={32}
                />
                <div style={{
                  position: 'absolute',
                  right: '20px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#00f0ff',
                  fontSize: '18px',
                  fontWeight: 'bold'
                }}>
                  .fsn
                </div>
              </div>

              {/* Availability Status */}
              {fsnInput && fsnInput.length >= 3 && (
                <div style={{
                  padding: '12px',
                  borderRadius: '8px',
                  border: `2px solid ${availabilityStatus?.available ? '#22c55e' : '#ef4444'}`,
                  backgroundColor: availabilityStatus?.available 
                    ? 'rgba(34, 197, 94, 0.2)' 
                    : 'rgba(239, 68, 68, 0.2)',
                  color: availabilityStatus?.available ? '#22c55e' : '#ef4444',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  marginBottom: '20px'
                }}>
                  {isChecking ? 'Checking...' : (
                    availabilityStatus?.available ? '✓ Available' : '✗ Not Available'
                  )}
                  {availabilityStatus?.reason && (
                    <div style={{ fontSize: '12px', marginTop: '5px', color: '#ccc' }}>
                      {availabilityStatus.reason}
                    </div>
                  )}
                </div>
              )}

              {/* Continue Button */}
              <div style={{ textAlign: 'center' }}>
                <button
                  onClick={handleProceedToClaim}
                  disabled={!fsnInput || fsnInput.length < 3 || !availabilityStatus?.available || isChecking}
                  style={{
                    padding: '15px 40px',
                    backgroundColor: (!fsnInput || fsnInput.length < 3 || !availabilityStatus?.available || isChecking)
                      ? '#333' : '#00f0ff',
                    color: (!fsnInput || fsnInput.length < 3 || !availabilityStatus?.available || isChecking)
                      ? '#666' : '#000',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    cursor: (!fsnInput || fsnInput.length < 3 || !availabilityStatus?.available || isChecking)
                      ? 'not-allowed' : 'pointer',
                    boxShadow: (!fsnInput || fsnInput.length < 3 || !availabilityStatus?.available || isChecking)
                      ? 'none' : '0 0 20px rgba(0, 240, 255, 0.5)',
                    transition: 'all 0.3s ease',
                    marginRight: '10px'
                  }}
                >
                  Press Enter to continue →
                </button>
                
                <button
                  onClick={() => {
                    setShowClaimInput(false);
                    setFsnInput('');
                    setAvailabilityStatus(null);
                  }}
                  style={{
                    padding: '15px 40px',
                    backgroundColor: 'transparent',
                    color: '#00f0ff',
                    border: '2px solid #00f0ff',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          
          {/* Success Message */}
          <div className={`fsn-success ${showSuccess ? 'visible' : ''}`}>
            Success! Your .fsn name has been claimed.
          </div>
        </div>
      </div>
      
      {/* Logout Button - Same as Vault */}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 20
      }}>
        <div style={{ 
          cursor: 'pointer',
          padding: '8px',
          transition: 'all 0.4s cubic-bezier(0.25, 0.1, 0.25, 1)',
          borderRadius: '6px'
        }}
        onClick={async () => {
          try {
            await fetch('/api/logout', { method: 'POST' });
            localStorage.clear();
            window.location.href = '/';
          } catch (error) {
            console.error('Logout error:', error);
            localStorage.clear();
            window.location.href = '/';
          }
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(0,188,212,0.04)';
          e.currentTarget.style.transform = 'translateY(-1px) scale(1.02)';
          const svg = e.currentTarget.querySelector('svg');
          if (svg) {
            svg.style.filter = 'drop-shadow(0 0 8px rgba(0,188,212,0.3)) drop-shadow(0 0 12px rgba(0,188,212,0.2))';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.transform = 'translateY(0) scale(1)';
          const svg = e.currentTarget.querySelector('svg');
          if (svg) {
            svg.style.filter = 'drop-shadow(0 0 4px rgba(0,188,212,0.3))';
          }
        }}>
            <svg 
              width="32" 
              height="32" 
              viewBox="0 0 24 24" 
              style={{
                filter: 'drop-shadow(0 0 4px rgba(0,188,212,0.3))'
              }}
            >
              <defs>
                <filter id="logout-glow-home" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                  <feMerge> 
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              <g filter="url(#logout-glow-home)">
                {/* Outer bracket - left side */}
                <path 
                  d="M3 6 Q3 4 5 4 L12 4" 
                  stroke="#00bcd4" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  fill="none"
                />
                <path 
                  d="M3 18 Q3 20 5 20 L12 20" 
                  stroke="#00bcd4" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  fill="none"
                />
                <line 
                  x1="3" y1="6" x2="3" y2="18" 
                  stroke="#00bcd4" 
                  strokeWidth="2" 
                  strokeLinecap="round"
                />
                
                {/* Exit arrow */}
                <line 
                  x1="9" y1="12" x2="19" y2="12" 
                  stroke="#00bcd4" 
                  strokeWidth="2.5" 
                  strokeLinecap="round"
                />
                <polyline 
                  points="15,8 19,12 15,16" 
                  stroke="#00bcd4" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  fill="none"
                />
              </g>
            </svg>
        </div>
      </div>

      {/* Modal */}
      <Modal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default Home;
