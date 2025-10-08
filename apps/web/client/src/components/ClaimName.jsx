import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, CheckCircle, Loader2, X } from 'lucide-react';
import emailConfig from '@/config/email';

const ClaimName = ({ 
  currentUser, 
  fsnInput, 
  setFsnInput, 
  isLoading, 
  availabilityStatus, 
  checkNameAvailability, 
  validationError,
  isInitialLoading,
  onClaimSuccess,
  refetchVerificationStatus,
  parentVerificationStatus
}) => {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showVerificationRequired, setShowVerificationRequired] = useState(false);
  const [userVerificationStatus, setUserVerificationStatus] = useState(null);
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [verificationStep, setVerificationStep] = useState('send');
  const [verificationCode, setVerificationCode] = useState('');
  const [userEmail, setUserEmail] = useState(''); // Add email input state
  const [isVerifying, setIsVerifying] = useState(false);
  const [hasCheckedVerification, setHasCheckedVerification] = useState(false);
  const [showPasswordSetup, setShowPasswordSetup] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSettingPassword, setIsSettingPassword] = useState(false);

  // Check user verification status with real-time updates
  const checkUserVerificationStatus = async () => {
    // Try to get user ID from currentUser or localStorage for test sessions
    const userId = currentUser?.id || parseInt(localStorage.getItem('fsn_user_id'));
    if (!userId) return;
    
    try {
      // Use specific user ID endpoint to get correct verification status
      const response = await fetch(`/api/user/${userId}/verification-status`);
      if (response.ok) {
        const status = await response.json();
        setUserVerificationStatus(status);
        setShowVerificationRequired(!status.emailVerified && emailConfig.isRequired());
        console.log('Verification status updated for user', userId, ':', status);
        console.log('Setting showVerificationRequired to:', !status.emailVerified);
      }
    } catch (err) {
      console.error('Failed to check verification status:', err);
    }
  };

  // Use parent verification status if available
  useEffect(() => {
    if (parentVerificationStatus) {
      setUserVerificationStatus(parentVerificationStatus);
      setShowVerificationRequired(!parentVerificationStatus.emailVerified && emailConfig.isRequired());
      console.log('Using parent verification status:', parentVerificationStatus);
      console.log('Setting showVerificationRequired from parent to:', !parentVerificationStatus.emailVerified && emailConfig.isRequired());
    }
  }, [parentVerificationStatus]);

  useEffect(() => {
    // Check verification status if we have currentUser OR a stored user ID
    const userId = currentUser?.id || parseInt(localStorage.getItem('fsn_user_id'));
    if (userId) {
      checkUserVerificationStatus();
    }
  }, [currentUser]);

  // Re-check verification status after successful verification
  useEffect(() => {
    if (success && success.includes('Email verified successfully')) {
      setTimeout(() => {
        checkUserVerificationStatus();
      }, 1000);
    }
  }, [success]);

  const handleClaim = async () => {
    // CRITICAL: Block claiming if no FSN name
    if (!fsnInput || fsnInput.length < 3) {
      setError('Please enter a valid FSN name (minimum 3 characters)');
      return;
    }
    
    // Step 1: Check if we have a current user (logged in) OR test user session
    const userId = currentUser?.id || parseInt(localStorage.getItem('fsn_user_id'));
    if (!userId) {
      // No user - check if email required or wallet-first mode
      console.log('No current user found, starting registration flow');
      setError(''); // Clear any previous errors
      
      // In wallet-first mode, skip email verification
      if (!emailConfig.isRequired()) {
        // Proceed with wallet-based registration
        console.log('Wallet-first mode: Proceeding without email verification');
        // You would trigger wallet connection here
        setError('Please connect your wallet to claim FSN names');
        return;
      }
      
      setShowEmailVerification(true);
      return;
    }
    
    // Step 2: Enforce EMAIL VERIFICATION REQUIREMENT for existing users
    if (showVerificationRequired || !userVerificationStatus?.emailVerified) {
      setError('Email verification is required before claiming FSN names');
      setShowEmailVerification(true);
      return;
    }
    
    // Step 3: All requirements met - proceed with claiming
    setError('');
    
    try {
      console.log('Claiming name:', fsnInput, 'for user:', userId);
      const response = await fetch('/api/fsn/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: fsnInput,
          userId: userId,
          ownerEmail: userEmail || localStorage.getItem('fsn_email'),
          verificationMethod: 'email'
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        setSuccess(`Successfully claimed ${fsnInput}.fsn! You earned ${result.xpEarned} XP!`);
        if (onClaimSuccess) onClaimSuccess(result);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to claim FSN name');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    }
  };

  // Show password setup form for new users after email verification
  if (showPasswordSetup) {
    return (
      <div style={{ color: 'white', textAlign: 'center' }}>
        <h3 style={{ color: '#00f0ff', fontSize: '24px', marginBottom: '20px' }}>
          Set Your Password
        </h3>
        
        <p style={{ color: 'white', marginBottom: '30px' }}>
          Please create a secure password for your FSN account:
        </p>
        
        <div style={{ marginBottom: '20px' }}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password (min 8 characters)"
            style={{
              padding: '15px 20px',
              fontSize: '18px',
              backgroundColor: '#333',
              color: '#00f0ff',
              border: '2px solid #00f0ff',
              borderRadius: '8px',
              width: '100%',
              maxWidth: '400px',
              textAlign: 'center',
              outline: 'none',
              marginBottom: '15px'
            }}
          />
        </div>
        
        <div style={{ marginBottom: '30px' }}>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm password"
            style={{
              padding: '15px 20px',
              fontSize: '18px',
              backgroundColor: '#333',
              color: '#00f0ff',
              border: '2px solid #00f0ff',
              borderRadius: '8px',
              width: '100%',
              maxWidth: '400px',
              textAlign: 'center',
              outline: 'none'
            }}
          />
        </div>
        
        <button
          onClick={async () => {
            if (password.length < 8) {
              setError('Password must be at least 8 characters long');
              return;
            }
            
            if (password !== confirmPassword) {
              setError('Passwords do not match');
              return;
            }
            
            setIsSettingPassword(true);
            try {
              const userId = currentUser?.id || parseInt(localStorage.getItem('fsn_user_id'));
              const response = await fetch('/api/user/set-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  userId,
                  password
                })
              });
              
              if (response.ok) {
                setSuccess('Password set successfully! You can now claim your FSN name.');
                setShowPasswordSetup(false);
                // Refresh to reload user state with updated password
                window.location.reload();
              } else {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to set password');
              }
            } catch (err) {
              setError('Network error: ' + err.message);
            } finally {
              setIsSettingPassword(false);
            }
          }}
          disabled={isSettingPassword || password.length < 8 || password !== confirmPassword}
          style={{
            padding: '15px 40px',
            backgroundColor: (isSettingPassword || password.length < 8 || password !== confirmPassword) ? '#333' : '#00f0ff',
            color: (isSettingPassword || password.length < 8 || password !== confirmPassword) ? '#666' : '#000',
            border: 'none',
            borderRadius: '8px',
            fontSize: '18px',
            fontWeight: 'bold',
            cursor: (isSettingPassword || password.length < 8 || password !== confirmPassword) ? 'not-allowed' : 'pointer',
            boxShadow: '0 0 20px rgba(0, 240, 255, 0.5)',
            transition: 'all 0.3s ease'
          }}
        >
          {isSettingPassword ? 'Setting Password...' : 'Set Password & Continue'}
        </button>
        
        {error && (
          <div style={{
            marginTop: '20px',
            padding: '15px',
            backgroundColor: 'rgba(239, 68, 68, 0.2)',
            color: '#ef4444',
            border: '2px solid #ef4444',
            borderRadius: '8px',
            fontSize: '16px'
          }}>
            {error}
          </div>
        )}
        
        {success && (
          <div style={{
            marginTop: '20px',
            padding: '15px',
            backgroundColor: 'rgba(34, 197, 94, 0.2)',
            color: '#22c55e',
            border: '2px solid #22c55e',
            borderRadius: '8px',
            fontSize: '16px'
          }}>
            {success}
          </div>
        )}
      </div>
    );
  }

  // Show email verification form if needed
  // Add debug logging for email config
  console.log('EmailConfig debug:', {
    enabled: emailConfig.enabled,
    requiredForClaim: emailConfig.requiredForClaim, 
    showEmailUI: emailConfig.showEmailUI(),
    isRequired: emailConfig.isRequired(),
    showEmailVerification: showEmailVerification
  });

  // Only show email verification if email is enabled
  if (emailConfig.showEmailUI() && showEmailVerification) {
    return (
      <div style={{ color: 'white', textAlign: 'center' }}>
        <h3 style={{ color: '#00f0ff', fontSize: '24px', marginBottom: '20px' }}>
          Email Verification Required
        </h3>
        
        {verificationStep === 'send' && (
          <div>
            <p style={{ color: 'white', marginBottom: '20px' }}>
              To claim your FSN name, please enter your email address for verification:
            </p>
            
            <div style={{ marginBottom: '30px' }}>
              <input
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder="Enter your email address"
                style={{
                  padding: '15px 20px',
                  fontSize: '18px',
                  backgroundColor: '#333',
                  color: '#00f0ff',
                  border: '2px solid #00f0ff',
                  borderRadius: '8px',
                  width: '100%',
                  maxWidth: '400px',
                  textAlign: 'center',
                  outline: 'none'
                }}
                onFocus={(e) => {
                  e.target.style.boxShadow = '0 0 15px rgba(0, 240, 255, 0.5)';
                }}
                onBlur={(e) => {
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
            
            <button
              onClick={async () => {
                if (!userEmail || !userEmail.includes('@')) {
                  setError('Please enter a valid email address');
                  return;
                }
                
                setIsVerifying(true);
                try {
                  // For new users without currentUser, create account and verify
                  const endpoint = currentUser?.id ? '/api/user/verify/email' : '/api/register-and-verify';
                  const body = currentUser?.id 
                    ? { userId: currentUser.id, email: userEmail }
                    : { email: userEmail, fsnName: fsnInput };
                    
                  const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                  });
                  
                  if (response.ok) {
                    const data = await response.json();
                    if (data.userId) {
                      // Store new user info in localStorage
                      localStorage.setItem('fsn_user_id', data.userId.toString());
                      localStorage.setItem('fsn_email', userEmail);
                    }
                    setVerificationStep('verify');
                    setSuccess('Verification code sent! Check your email.');
                  } else {
                    const errorData = await response.json();
                    setError(errorData.error || 'Failed to send verification code');
                  }
                } catch (err) {
                  setError('Network error: ' + err.message);
                } finally {
                  setIsVerifying(false);
                }
              }}
              disabled={isVerifying || !userEmail || !userEmail.includes('@')}
              style={{
                padding: '15px 40px',
                backgroundColor: (isVerifying || !userEmail || !userEmail.includes('@')) ? '#333' : '#00f0ff',
                color: (isVerifying || !userEmail || !userEmail.includes('@')) ? '#666' : '#000',
                border: 'none',
                borderRadius: '8px',
                fontSize: '18px',
                fontWeight: 'bold',
                cursor: (isVerifying || !userEmail || !userEmail.includes('@')) ? 'not-allowed' : 'pointer',
                boxShadow: '0 0 20px rgba(0, 240, 255, 0.5)',
                transition: 'all 0.3s ease'
              }}
            >
              {isVerifying ? 'Sending...' : 'Send Verification Code'}
            </button>
          </div>
        )}
        
        {verificationStep === 'verify' && (
          <div>
            <p style={{ color: 'white', marginBottom: '20px' }}>
              Enter the 6-digit code sent to your email:
            </p>
            
            <div style={{ marginBottom: '20px' }}>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                style={{
                  padding: '15px 20px',
                  fontSize: '24px',
                  textAlign: 'center',
                  backgroundColor: '#333',
                  color: '#00f0ff',
                  border: '2px solid #00f0ff',
                  borderRadius: '8px',
                  letterSpacing: '8px',
                  fontWeight: 'bold',
                  maxWidth: '200px'
                }}
                maxLength={6}
              />
            </div>
            
            <button
              onClick={async () => {
                if (verificationCode.length !== 6) {
                  setError('Please enter a 6-digit code');
                  return;
                }
                
                setIsVerifying(true);
                try {
                  const response = await fetch('/api/user/verify/email/confirm', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      userId: currentUser?.id || parseInt(localStorage.getItem('fsn_user_id')),
                      email: userEmail,
                      code: verificationCode
                    })
                  });
                  
                  if (response.ok) {
                    setSuccess('Email verified successfully! You can now claim your FSN name.');
                    setShowEmailVerification(false);
                    checkUserVerificationStatus();
                    // Refetch verification status in parent component
                    if (refetchVerificationStatus) {
                      refetchVerificationStatus();
                    }
                    // Update current user if it wasn't set (for new registrations)
                    if (!currentUser?.id) {
                      const userId = localStorage.getItem('fsn_user_id');
                      if (userId) {
                        // For new users, require password setup after email verification
                        setShowPasswordSetup(true);
                      }
                    }
                  } else {
                    const errorData = await response.json();
                    setError(errorData.error || 'Invalid verification code');
                  }
                } catch (err) {
                  setError('Network error: ' + err.message);
                } finally {
                  setIsVerifying(false);
                }
              }}
              disabled={isVerifying || verificationCode.length !== 6}
              style={{
                padding: '15px 40px',
                backgroundColor: (isVerifying || verificationCode.length !== 6) ? '#333' : '#00f0ff',
                color: (isVerifying || verificationCode.length !== 6) ? '#666' : '#000',
                border: 'none',
                borderRadius: '8px',
                fontSize: '18px',
                fontWeight: 'bold',
                cursor: (isVerifying || verificationCode.length !== 6) ? 'not-allowed' : 'pointer',
                boxShadow: '0 0 20px rgba(0, 240, 255, 0.5)',
                transition: 'all 0.3s ease',
                marginRight: '10px'
              }}
            >
              {isVerifying ? 'Verifying...' : 'Verify Code'}
            </button>
            
            <button
              onClick={() => {
                setVerificationStep('send');
                setVerificationCode('');
                setError('');
              }}
              style={{
                padding: '15px 40px',
                backgroundColor: 'transparent',
                color: '#00f0ff',
                border: '2px solid #00f0ff',
                borderRadius: '8px',
                fontSize: '18px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              Resend Code
            </button>
          </div>
        )}
        
        {error && (
          <div style={{
            marginTop: '20px',
            padding: '15px',
            backgroundColor: 'rgba(239, 68, 68, 0.2)',
            color: '#ef4444',
            border: '2px solid #ef4444',
            borderRadius: '8px',
            fontSize: '16px'
          }}>
            {error}
          </div>
        )}
        
        {success && (
          <div style={{
            marginTop: '20px',
            padding: '15px',
            backgroundColor: 'rgba(34, 197, 94, 0.2)',
            color: '#22c55e',
            border: '2px solid #22c55e',
            borderRadius: '8px',
            fontSize: '16px'
          }}>
            {success}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ color: 'white' }}>
      {/* FSN Input Field */}
      <div style={{ marginBottom: '30px' }}>
        <label style={{ 
          display: 'block', 
          fontSize: '18px', 
          fontWeight: 'bold', 
          color: '#00f0ff', 
          marginBottom: '10px' 
        }}>
          Choose Your FSN Name
        </label>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            value={fsnInput}
            onChange={(e) => {
              const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
              setFsnInput(value);
              if (value.length >= 3) {
                checkNameAvailability(value);
              }
            }}
            placeholder="Enter your desired name"
            style={{
              width: '100%',
              padding: '15px 20px',
              backgroundColor: '#333',
              border: '2px solid #00f0ff',
              borderRadius: '8px',
              color: 'white',
              fontSize: '18px',
              fontWeight: 'bold',
              outline: 'none',
              boxShadow: '0 0 10px rgba(0, 240, 255, 0.3)'
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
      </div>

      {/* Availability Status */}
      {fsnInput && fsnInput.length >= 3 && (
        <div style={{
          padding: '15px',
          borderRadius: '8px',
          border: `2px solid ${availabilityStatus?.available ? '#22c55e' : '#ef4444'}`,
          backgroundColor: availabilityStatus?.available 
            ? 'rgba(34, 197, 94, 0.2)' 
            : 'rgba(239, 68, 68, 0.2)',
          color: availabilityStatus?.available ? '#22c55e' : '#ef4444',
          fontSize: '16px',
          fontWeight: 'bold',
          marginBottom: '30px'
        }}>
          {availabilityStatus?.available ? '✓ Available' : '✗ Not Available'}
          {availabilityStatus?.reason && (
            <div style={{ fontSize: '14px', marginTop: '5px', color: '#ccc' }}>
              {availabilityStatus.reason}
            </div>
          )}
        </div>
      )}

      {/* Email Verification Warning */}
      {showVerificationRequired && (
        <div style={{
          padding: '20px',
          borderRadius: '8px',
          border: '2px solid #fbbf24',
          backgroundColor: 'rgba(251, 191, 36, 0.2)',
          color: '#fbbf24',
          fontSize: '16px',
          fontWeight: 'bold',
          marginBottom: '30px',
          textAlign: 'center'
        }}>
          <div style={{ marginBottom: '15px' }}>
            ⚠️ Email verification required to claim FSN names
          </div>
          <button
            onClick={() => setShowEmailVerification(true)}
            style={{
              padding: '12px 30px',
              backgroundColor: '#fbbf24',
              color: '#000',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 0 15px rgba(251, 191, 36, 0.5)',
              transition: 'all 0.3s ease'
            }}
          >
            Verify Email Now
          </button>
        </div>
      )}

      {/* Claim Button */}
      <div style={{ textAlign: 'center', marginTop: '30px' }}>
        <button
          onClick={handleClaim}
          disabled={!fsnInput || fsnInput.length < 3 || !availabilityStatus?.available || showVerificationRequired || isLoading}
          style={{
            padding: '20px 50px',
            backgroundColor: (!fsnInput || fsnInput.length < 3 || !availabilityStatus?.available || showVerificationRequired || isLoading) 
              ? '#333' : '#00f0ff',
            color: (!fsnInput || fsnInput.length < 3 || !availabilityStatus?.available || showVerificationRequired || isLoading) 
              ? '#666' : '#000',
            border: 'none',
            borderRadius: '8px',
            fontSize: '20px',
            fontWeight: 'bold',
            cursor: (!fsnInput || fsnInput.length < 3 || !availabilityStatus?.available || showVerificationRequired || isLoading) 
              ? 'not-allowed' : 'pointer',
            boxShadow: (!fsnInput || fsnInput.length < 3 || !availabilityStatus?.available || showVerificationRequired || isLoading) 
              ? 'none' : '0 0 30px rgba(0, 240, 255, 0.6)',
            transition: 'all 0.3s ease',
            transform: (!fsnInput || fsnInput.length < 3 || !availabilityStatus?.available || showVerificationRequired || isLoading) 
              ? 'none' : 'translateY(-2px)',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}
        >
          {isLoading ? (
            <>
              <span style={{ marginRight: '10px' }}>🔄</span>
              Claiming...
            </>
          ) : (
            <>
              <span style={{ marginRight: '10px' }}>🚀</span>
              Claim {fsnInput}.fsn
            </>
          )}
        </button>
        
        {/* Debug Information */}
        <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
          Debug: fsnInput="{fsnInput}", available={availabilityStatus?.available ? 'true' : 'false'}, verificationRequired={showVerificationRequired ? 'true' : 'false'}, userVerified={userVerificationStatus?.emailVerified ? 'true' : 'false'}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div style={{
          marginTop: '20px',
          padding: '15px',
          backgroundColor: 'rgba(239, 68, 68, 0.2)',
          color: '#ef4444',
          border: '2px solid #ef4444',
          borderRadius: '8px',
          fontSize: '16px',
          textAlign: 'center'
        }}>
          {error}
        </div>
      )}

      {/* Success Display */}
      {success && (
        <div style={{
          marginTop: '20px',
          padding: '15px',
          backgroundColor: 'rgba(34, 197, 94, 0.2)',
          color: '#22c55e',
          border: '2px solid #22c55e',
          borderRadius: '8px',
          fontSize: '16px',
          textAlign: 'center'
        }}>
          {success}
        </div>
      )}
    </div>
  );
};

export default ClaimName;