import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const PasswordSetupModal = ({ userId, onSuccess, onClose }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validatePassword = (pwd) => {
    const hasUpperCase = /[A-Z]/.test(pwd);
    const hasLowerCase = /[a-z]/.test(pwd);
    const hasNumber = /\d/.test(pwd);
    const hasMinLength = pwd.length >= 8;
    
    return hasUpperCase && hasLowerCase && hasNumber && hasMinLength;
  };

  const getPasswordStrength = (pwd) => {
    if (pwd.length === 0) return { strength: 0, text: 'Enter password' };
    if (pwd.length < 8) return { strength: 1, text: 'Too short (min 8 chars)' };
    
    let score = 0;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/\d/.test(pwd)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) score++;
    
    if (score === 4) return { strength: 4, text: 'Very Strong' };
    if (score === 3) return { strength: 3, text: 'Strong' };
    if (score === 2) return { strength: 2, text: 'Fair' };
    return { strength: 1, text: 'Weak' };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validatePassword(password)) {
      setError('Password must contain at least 8 characters, one uppercase letter, one lowercase letter, and one number');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/user/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, password })
      });

      if (response.ok) {
        onSuccess();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to set password');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const strength = getPasswordStrength(password);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: '#1a1a1a',
        padding: '40px',
        borderRadius: '16px',
        border: '2px solid #00f0ff',
        boxShadow: '0 0 30px rgba(0, 240, 255, 0.3)',
        maxWidth: '500px',
        width: '90%',
        position: 'relative'
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '15px',
            right: '15px',
            background: 'transparent',
            border: 'none',
            color: '#888',
            fontSize: '24px',
            cursor: 'pointer'
          }}
        >
          ×
        </button>

        <h2 style={{
          color: '#00f0ff',
          fontSize: '28px',
          marginBottom: '20px',
          textAlign: 'center',
          textShadow: '0 0 10px #00f0ff'
        }}>
          🔐 Secure Your FSN Identity
        </h2>

        <p style={{
          color: 'white',
          marginBottom: '30px',
          textAlign: 'center',
          fontSize: '16px'
        }}>
          Create a strong password to protect your FSN account and complete your identity setup.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '25px' }}>
            <label style={{
              color: '#00f0ff',
              fontSize: '16px',
              fontWeight: 'bold',
              display: 'block',
              marginBottom: '8px'
            }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '15px 50px 15px 15px',
                  fontSize: '16px',
                  backgroundColor: '#333',
                  color: 'white',
                  border: `2px solid ${strength.strength >= 3 ? '#00f0ff' : '#666'}`,
                  borderRadius: '8px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '15px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: '#888',
                  cursor: 'pointer'
                }}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            
            {password && (
              <div style={{ marginTop: '8px' }}>
                <div style={{
                  height: '4px',
                  backgroundColor: '#333',
                  borderRadius: '2px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${(strength.strength / 4) * 100}%`,
                    height: '100%',
                    backgroundColor: 
                      strength.strength === 4 ? '#22c55e' :
                      strength.strength === 3 ? '#00f0ff' :
                      strength.strength === 2 ? '#f59e0b' : '#ef4444',
                    transition: 'all 0.3s ease'
                  }} />
                </div>
                <span style={{
                  fontSize: '12px',
                  color: 
                    strength.strength === 4 ? '#22c55e' :
                    strength.strength === 3 ? '#00f0ff' :
                    strength.strength === 2 ? '#f59e0b' : '#ef4444',
                  marginTop: '4px',
                  display: 'block'
                }}>
                  {strength.text}
                </span>
              </div>
            )}
          </div>

          <div style={{ marginBottom: '25px' }}>
            <label style={{
              color: '#00f0ff',
              fontSize: '16px',
              fontWeight: 'bold',
              display: 'block',
              marginBottom: '8px'
            }}>
              Confirm Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '15px 50px 15px 15px',
                  fontSize: '16px',
                  backgroundColor: '#333',
                  color: 'white',
                  border: `2px solid ${confirmPassword && password === confirmPassword ? '#00f0ff' : '#666'}`,
                  borderRadius: '8px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                placeholder="Confirm your password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  position: 'absolute',
                  right: '15px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: '#888',
                  cursor: 'pointer'
                }}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            
            {confirmPassword && confirmPassword !== password && (
              <span style={{
                fontSize: '12px',
                color: '#ef4444',
                marginTop: '4px',
                display: 'block'
              }}>
                Passwords do not match
              </span>
            )}
          </div>

          {error && (
            <div style={{
              marginBottom: '20px',
              padding: '12px',
              backgroundColor: 'rgba(239, 68, 68, 0.2)',
              color: '#ef4444',
              border: '2px solid #ef4444',
              borderRadius: '8px',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !validatePassword(password) || password !== confirmPassword}
            style={{
              width: '100%',
              padding: '15px',
              fontSize: '18px',
              fontWeight: 'bold',
              backgroundColor: (isLoading || !validatePassword(password) || password !== confirmPassword) 
                ? '#333' : '#00f0ff',
              color: (isLoading || !validatePassword(password) || password !== confirmPassword) 
                ? '#666' : '#000',
              border: 'none',
              borderRadius: '8px',
              cursor: (isLoading || !validatePassword(password) || password !== confirmPassword) 
                ? 'not-allowed' : 'pointer',
              boxShadow: '0 0 20px rgba(0, 240, 255, 0.5)',
              transition: 'all 0.3s ease'
            }}
          >
            {isLoading ? 'Setting Password...' : 'Set Password & Complete Setup'}
          </button>
        </form>

        <div style={{
          marginTop: '20px',
          fontSize: '12px',
          color: '#888',
          textAlign: 'center'
        }}>
          Password requirements: 8+ characters, uppercase, lowercase, and number
        </div>
      </div>
    </div>
  );
};

export default PasswordSetupModal;