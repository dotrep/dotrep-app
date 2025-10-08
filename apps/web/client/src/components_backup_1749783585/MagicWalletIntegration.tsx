import React, { useState, useEffect } from 'react';
import { Magic } from 'magic-sdk';
import { BrowserProvider } from 'ethers';

// Magic instance - your actual publishable key from magic.link
const MAGIC_KEY = 'pk_live_BE9A23285656738D';
const magic = typeof window !== 'undefined' ? new Magic(MAGIC_KEY) : null;

interface MagicWalletProps {
  onWalletCreated: (walletAddress: string, email: string) => void;
  email: string;
  onEmailChange: (email: string) => void;
}

export function MagicWalletIntegration({ onWalletCreated, email, onEmailChange }: MagicWalletProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    checkIfLoggedIn();
  }, []);

  const checkIfLoggedIn = async () => {
    if (!magic) return;
    
    try {
      const isAuthenticated = await magic.user.isLoggedIn();
      if (isAuthenticated) {
        const provider = new BrowserProvider(magic.rpcProvider);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        setWalletAddress(address);
        setIsLoggedIn(true);
        
        // Get user metadata to retrieve email
        const userInfo = await magic.user.getInfo();
        if (userInfo.email) {
          onEmailChange(userInfo.email);
          onWalletCreated(address, userInfo.email);
        }
      }
    } catch (error) {
      console.error('Error checking login status:', error);
    }
  };

  const handleCreateWallet = async () => {
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    if (!magic) {
      setError('Magic SDK not initialized. Please provide your Magic publishable key.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Login with Magic Link
      await magic.auth.loginWithMagicLink({ email });

      // Get wallet address using Ethers
      const provider = new BrowserProvider(magic.rpcProvider);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      setWalletAddress(address);
      setIsLoggedIn(true);
      
      // Notify parent component
      onWalletCreated(address, email);

    } catch (error: any) {
      console.error('Error creating wallet:', error);
      setError(error.message || 'Failed to create wallet. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    if (!magic) return;
    
    try {
      await magic.user.logout();
      setIsLoggedIn(false);
      setWalletAddress('');
      onEmailChange('');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  if (isLoggedIn && walletAddress) {
    return (
      <div style={{
        padding: '20px',
        backgroundColor: 'rgba(56, 189, 248, 0.1)',
        borderRadius: '8px',
        border: '1px solid rgba(56, 189, 248, 0.3)',
        marginBottom: '20px'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginBottom: '15px'
        }}>
          <h3 style={{ 
            color: '#38bdf8', 
            margin: 0,
            fontSize: '18px',
            fontWeight: '600'
          }}>
            🔐 Crypto Wallet Created!
          </h3>
          <button
            onClick={handleLogout}
            style={{
              backgroundColor: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              color: 'rgba(255, 255, 255, 0.8)',
              padding: '6px 12px',
              borderRadius: '4px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>
        
        <div style={{ marginBottom: '10px' }}>
          <div style={{ 
            color: 'rgba(255, 255, 255, 0.9)', 
            fontSize: '14px',
            marginBottom: '5px'
          }}>
            Email: {email}
          </div>
          <div style={{ 
            color: 'rgba(255, 255, 255, 0.9)', 
            fontSize: '14px',
            wordBreak: 'break-all'
          }}>
            Wallet: {walletAddress}
          </div>
        </div>
        
        <div style={{
          color: 'rgba(255, 255, 255, 0.7)',
          fontSize: '13px',
          fontStyle: 'italic'
        }}>
          ✅ Your crypto wallet is ready! You can now send/receive tokens and access your FSN vault.
        </div>
      </div>
    );
  }

  return (
    <div style={{
      padding: '20px',
      backgroundColor: 'rgba(100, 255, 255, 0.1)',
      borderRadius: '8px',
      border: '1px solid rgba(100, 255, 255, 0.2)',
      marginBottom: '20px'
    }}>
      <h3 style={{ 
        color: '#64ffff', 
        marginTop: 0,
        marginBottom: '15px',
        fontSize: '18px',
        fontWeight: '600'
      }}>
        🌟 Create Your Crypto Wallet
      </h3>
      
      <div style={{ marginBottom: '15px' }}>
        <input
          type="email"
          placeholder="Enter your email address"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(100, 255, 255, 0.3)',
            borderRadius: '4px',
            color: 'white',
            fontSize: '16px'
          }}
          disabled={isLoading}
        />
      </div>

      {error && (
        <div style={{
          color: '#f87171',
          fontSize: '14px',
          marginBottom: '15px',
          padding: '8px',
          backgroundColor: 'rgba(248, 113, 113, 0.1)',
          borderRadius: '4px'
        }}>
          {error}
        </div>
      )}

      <button
        onClick={handleCreateWallet}
        disabled={isLoading || !email}
        style={{
          width: '100%',
          padding: '12px',
          backgroundColor: isLoading ? 'rgba(100, 255, 255, 0.3)' : 'rgba(100, 255, 255, 0.8)',
          border: 'none',
          borderRadius: '4px',
          color: isLoading ? 'rgba(255, 255, 255, 0.6)' : '#000',
          fontSize: '16px',
          fontWeight: '600',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease'
        }}
      >
        {isLoading ? 'Creating Wallet...' : '🚀 Create Crypto Wallet'}
      </button>
      
      <div style={{
        marginTop: '15px',
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: '13px',
        lineHeight: '1.4'
      }}>
        💡 <strong>How it works:</strong> We'll send a magic link to your email. Click it to instantly create your crypto wallet - no passwords needed!
      </div>
    </div>
  );
}