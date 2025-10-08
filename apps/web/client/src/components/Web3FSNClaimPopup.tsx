// Web3-enabled FSN claim popup using contracts
import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAccount } from 'wagmi';
import { useContractOperations } from '../hooks/useContractOperations';

interface Web3FSNClaimPopupProps {
  isOpen: boolean;
  onClose: () => void;
  prefilledName?: string;
}

export const Web3FSNClaimPopup: React.FC<Web3FSNClaimPopupProps> = ({ isOpen, onClose, prefilledName }) => {
  const [, setLocation] = useLocation();
  const { isConnected } = useAccount();
  const [fsnInput, setFsnInput] = useState(prefilledName || '');
  const [isChecking, setIsChecking] = useState(false);
  const [availabilityStatus, setAvailabilityStatus] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const { registry } = useContractOperations();

  // Check name availability using contract
  const checkNameAvailability = async (name: string) => {
    if (name.length < 3) {
      setAvailabilityStatus(null);
      return;
    }
    
    setIsChecking(true);
    setError(null);
    
    try {
      const result = await registry.checkNameAvailability(name);
      setAvailabilityStatus({
        available: result.available,
        reason: result.available ? 'Available for registration' : 'Name already taken'
      });
    } catch (err) {
      console.error('Failed to check name availability:', err);
      setError('Failed to check availability');
    } finally {
      setIsChecking(false);
    }
  };

  // Handle name registration
  const handleProceedToClaim = async () => {
    if (!isConnected) {
      setError('Please connect your wallet first');
      return;
    }

    if (!fsnInput || !availabilityStatus?.available) return;

    try {
      setError(null);
      await registry.registerName(fsnInput);
      
      // Mirror to database after successful contract registration
      await fetch('/api/fsn/mirror-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: fsnInput.toLowerCase() })
      });

      onClose();
      // Redirect to success page or dashboard
      setLocation('/dashboard');
    } catch (err: any) {
      console.error('Registration failed:', err);
      setError(err.message || 'Registration failed');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && fsnInput && availabilityStatus?.available && !isChecking && !registry.isRegistering) {
      handleProceedToClaim();
    }
  };

  const handleClose = () => {
    setFsnInput('');
    setAvailabilityStatus(null);
    setError(null);
    onClose();
  };

  // Pre-fill name and check availability when popup opens
  useEffect(() => {
    if (isOpen && prefilledName && prefilledName.length >= 3) {
      setFsnInput(prefilledName);
      checkNameAvailability(prefilledName);
    }
  }, [isOpen, prefilledName]);

  // Listen for successful registration
  useEffect(() => {
    const handleNameRegistered = () => {
      if (registry.isSuccess) {
        handleClose();
      }
    };

    window.addEventListener('fsn:nameRegistered', handleNameRegistered);
    return () => window.removeEventListener('fsn:nameRegistered', handleNameRegistered);
  }, [registry.isSuccess]);

  if (!isOpen) return null;

  return (
    <div className="fsn-claim-popup-overlay" onClick={handleClose}>
      <div className="fsn-claim-popup" onClick={(e) => e.stopPropagation()}>
        <div className="fsn-claim-popup-header">
          <h2>Claim your .fsn name</h2>
          <button className="close-button" onClick={handleClose}>×</button>
        </div>
        
        <div className="fsn-claim-popup-content">
          {!isConnected && (
            <div className="wallet-warning">
              ⚠️ Connect your wallet to claim names on-chain
            </div>
          )}

          {/* FSN Input */}
          <div className="fsn-input-container">
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
              onKeyPress={handleKeyPress}
              placeholder="Enter your desired name"
              className="fsn-input"
              maxLength={20}
              autoFocus
            />
            <div className="fsn-suffix">.fsn</div>
          </div>

          {/* Validation Messages */}
          {fsnInput && fsnInput.length > 0 && fsnInput.length < 3 && (
            <div className="validation-message error">
              Name must be 3-20 characters long
            </div>
          )}
          
          {fsnInput && fsnInput.length > 20 && (
            <div className="validation-message error">
              Name must be 3-20 characters long
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="validation-message error">
              {error}
            </div>
          )}

          {/* Availability Status */}
          {fsnInput && fsnInput.length >= 3 && fsnInput.length <= 20 && !error && (
            <div className={`availability-status ${availabilityStatus?.available ? 'available' : 'unavailable'}`}>
              {isChecking ? 'Checking on blockchain...' : (
                availabilityStatus?.available ? '✓ Available' : '✗ Not Available'
              )}
              {availabilityStatus?.reason && (
                <div className="availability-reason">
                  {availabilityStatus.reason}
                </div>
              )}
            </div>
          )}

          {/* Continue Button */}
          <div className="fsn-buttons">
            <button
              onClick={handleProceedToClaim}
              disabled={!isConnected || !fsnInput || fsnInput.length < 3 || fsnInput.length > 20 || !availabilityStatus?.available || isChecking || registry.isRegistering}
              className="continue-button"
            >
              {registry.isRegistering ? 'Registering on blockchain...' : 'Continue to claim →'}
            </button>
            
            <button
              onClick={handleClose}
              className="cancel-button"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
      
      <style>{`
        .wallet-warning {
          background: rgba(255, 193, 7, 0.2);
          border: 1px solid #ffc107;
          color: #ffc107;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 20px;
          text-align: center;
          font-size: 14px;
        }

        .fsn-claim-popup-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(5px);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          animation: fadeIn 0.3s ease;
        }

        .fsn-claim-popup {
          background: linear-gradient(135deg, #0a0f1a 0%, #1a2332 100%);
          border: 2px solid #00f0ff;
          border-radius: 20px;
          box-shadow: 0 0 50px rgba(0, 240, 255, 0.6);
          width: 95%;
          max-width: 650px;
          max-height: 90vh;
          overflow-y: auto;
          animation: slideUp 0.3s ease, pulseGlow 2s infinite;
          position: relative;
          min-height: 500px;
        }

        .fsn-claim-popup::before {
          content: '';
          position: absolute;
          top: -4px;
          left: -4px;
          right: -4px;
          bottom: -4px;
          background: linear-gradient(45deg, #00f0ff, #66fcf1, #00f0ff, #66fcf1);
          border-radius: 24px;
          z-index: -1;
          animation: pulseGlow 2s infinite;
        }

        .fsn-claim-popup-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 32px 40px 24px;
          border-bottom: 1px solid rgba(0, 240, 255, 0.2);
        }

        .fsn-claim-popup-header h2 {
          color: #00f0ff;
          font-size: 24px;
          font-weight: bold;
          margin: 0;
          text-shadow: 0 0 10px rgba(0, 240, 255, 0.5);
        }

        .close-button {
          background: none;
          border: none;
          color: #00f0ff;
          font-size: 28px;
          cursor: pointer;
          padding: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: all 0.3s ease;
        }

        .close-button:hover {
          background: rgba(0, 240, 255, 0.1);
          transform: rotate(90deg);
        }

        .fsn-claim-popup-content {
          padding: 40px 48px 48px;
          display: flex;
          flex-direction: column;
          gap: 0;
          min-height: 350px;
        }

        .fsn-input-container {
          position: relative;
          margin-bottom: 32px;
        }

        .fsn-input {
          width: 100%;
          padding: 0;
          padding-left: 32px;
          padding-right: 100px;
          background: transparent;
          border: 2px solid #00f0ff;
          border-radius: 16px;
          color: white;
          font-size: 20px;
          font-weight: bold;
          outline: none;
          box-shadow: 0 0 20px rgba(0, 240, 255, 0.4);
          text-align: left;
          transition: all 0.3s ease;
          box-sizing: border-box;
          height: 64px;
          line-height: 60px;
          vertical-align: middle;
        }

        .fsn-input:focus {
          box-shadow: 0 0 25px rgba(0, 240, 255, 0.6);
          border-color: #00f0ff;
        }

        .fsn-input::placeholder {
          color: rgba(255, 255, 255, 0.5);
        }

        .fsn-suffix {
          position: absolute;
          right: 32px;
          top: 2px;
          bottom: 2px;
          display: flex;
          align-items: center;
          color: #00f0ff;
          font-size: 20px;
          font-weight: bold;
          text-shadow: 0 0 15px rgba(0, 240, 255, 0.8);
          pointer-events: none;
          z-index: 2;
        }

        .validation-message {
          padding: 16px 20px;
          border-radius: 12px;
          font-size: 15px;
          font-weight: bold;
          margin-bottom: 24px;
          margin-top: 8px;
          text-align: center;
          flex-shrink: 0;
        }

        .validation-message.error {
          border: 2px solid #ef4444;
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }

        .availability-status {
          padding: 16px 20px;
          border-radius: 12px;
          font-size: 15px;
          font-weight: bold;
          margin-bottom: 32px;
          margin-top: 8px;
          text-align: center;
          flex-shrink: 0;
        }

        .availability-status.available {
          border: 2px solid #22c55e;
          background: rgba(34, 197, 94, 0.2);
          color: #22c55e;
        }

        .availability-status.unavailable {
          border: 2px solid #ef4444;
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }

        .availability-reason {
          font-size: 12px;
          margin-top: 8px;
          color: rgba(255, 255, 255, 0.7);
        }

        .fsn-buttons {
          display: flex;
          gap: 24px;
          justify-content: center;
          flex-wrap: wrap;
          margin-top: auto;
          padding-top: 24px;
          flex-shrink: 0;
        }

        .continue-button {
          padding: 20px 40px;
          background: #00f0ff;
          color: #000;
          border: none;
          border-radius: 16px;
          font-size: 18px;
          font-weight: bold;
          cursor: pointer;
          box-shadow: 0 0 25px rgba(0, 240, 255, 0.6);
          transition: all 0.3s ease;
          min-width: 220px;
          min-height: 60px;
        }

        .continue-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 0 30px rgba(0, 240, 255, 0.8);
        }

        .continue-button:disabled {
          background: #333;
          color: #666;
          cursor: not-allowed;
          box-shadow: none;
        }

        .cancel-button {
          padding: 20px 32px;
          background: transparent;
          color: #00f0ff;
          border: 2px solid #00f0ff;
          border-radius: 16px;
          font-size: 18px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s ease;
          min-width: 160px;
          min-height: 60px;
        }

        .cancel-button:hover {
          background: rgba(0, 240, 255, 0.1);
          transform: translateY(-2px);
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(50px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulseGlow {
          0% { 
            box-shadow: 0 0 30px rgba(0, 240, 255, 0.4), 0 0 60px rgba(0, 240, 255, 0.2);
          }
          50% { 
            box-shadow: 0 0 50px rgba(0, 240, 255, 0.8), 0 0 100px rgba(0, 240, 255, 0.4);
          }
          100% { 
            box-shadow: 0 0 30px rgba(0, 240, 255, 0.4), 0 0 60px rgba(0, 240, 255, 0.2);
          }
        }

        @media (max-width: 700px) {
          .fsn-claim-popup {
            width: 96%;
            max-width: 500px;
            margin: 15px;
            min-height: 450px;
          }
          
          .fsn-claim-popup-content {
            padding: 32px 24px 40px;
            min-height: 300px;
          }
          
          .fsn-claim-popup-header {
            padding: 28px 24px 20px;
          }
          
          .fsn-input {
            font-size: 18px;
            padding-left: 28px;
            padding-right: 90px;
            height: 56px;
            line-height: 52px;
          }
          
          .fsn-suffix {
            font-size: 18px;
            right: 28px;
          }
          
          .fsn-buttons {
            flex-direction: column;
            gap: 16px;
            margin-top: auto;
          }
          
          .continue-button,
          .cancel-button {
            min-width: auto;
            width: 100%;
            font-size: 16px;
            padding: 18px 32px;
            min-height: 56px;
          }
        }
      `}</style>
    </div>
  );
}

export default Web3FSNClaimPopup;