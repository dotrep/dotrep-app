/**
 * FSN Name Claim Page - Enhanced with floating particle background
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { useNameRegistry } from '@/hooks/useNameRegistry';
import FSNClaimSuccess from '@/components/FSNClaimSuccess';
import WalletConnect from '@/components/WalletConnect';
import Navigation from '@/components/Navigation';
import SoulboundWarning from '@/components/SoulboundWarning';
import SharedNetworkAnimation from '@/components/SharedNetworkAnimation';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';
import { useAccount } from 'wagmi';

const ClaimFSN: React.FC = () => {
  const [, setLocation] = useLocation();
  const [claimSuccess, setClaimSuccess] = useState<boolean>(false);
  const [claimedName, setClaimedName] = useState<string>('');
  const [fsnInput, setFsnInput] = useState<string>('');
  const [availabilityStatus, setAvailabilityStatus] = useState<any>(null);
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [userExistingName, setUserExistingName] = useState<string | null>(null);
  const { toast } = useToast();
  const { isConnected, address } = useAccount();
  const { checkNameAvailability, registerName, getUserName, isLoading: isNameRegistryLoading, error: nameRegistryError } = useNameRegistry();

  // Check if connected wallet already owns a name
  useEffect(() => {
    const checkExistingName = async () => {
      if (isConnected && address) {
        const existingName = await getUserName(address);
        setUserExistingName(existingName);
      } else {
        setUserExistingName(null);
      }
    };
    
    checkExistingName();
  }, [isConnected, address]); // Removed getUserName dependency to prevent infinite loop

  // Function to check availability with timeout
  const handleAvailabilityCheck = async (name: string) => {
    if (name.length >= 3) {
      try {
        const result = await checkNameAvailability(name);
        setAvailabilityStatus(result);
      } catch (error) {
        console.error('Availability check failed:', error);
        setAvailabilityStatus({ available: false, reason: 'Check failed' });
      }
    } else {
      setAvailabilityStatus(null);
    }
  };

  // Extract name from URL parameters - run only once
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const nameParam = urlParams.get('name');
    if (nameParam) {
      setFsnInput(nameParam);
      handleAvailabilityCheck(nameParam);
    }
  }, []); // No dependencies to prevent infinite loop

  const handleClaimSubmit = async () => {
    console.log('Claim button clicked!');
    console.log('State check:', {
      isConnected,
      fsnInput,
      availabilityStatus,
      isRegistering,
      userExistingName
    });
    
    if (!isConnected || !fsnInput || !availabilityStatus?.available || isRegistering || userExistingName) {
      console.log('Claim button disabled - conditions not met');
      return;
    }

    console.log('Starting registration process...');
    setIsRegistering(true);

    try {
      // registerName returns void on success, throws on error
      console.log('Calling registerName with:', fsnInput);
      await registerName(fsnInput);
      
      // If we reach here, registration was successful
      console.log('Registration successful!');
      setClaimedName(fsnInput);
      setClaimSuccess(true);
      
      toast({
        title: "FSN Name Claimed! 🎉",
        description: `You've successfully claimed ${fsnInput}!`,
        duration: 5000,
      });

    } catch (err: any) {
      console.error('Registration failed:', err);
      toast({
        title: "Claim Failed",
        description: err.message || "Failed to claim FSN name. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsRegistering(false);
    }
  };

  // Show success screen if claim was successful
  if (claimSuccess) {
    return (
      <FSNClaimSuccess 
        fsnName={claimedName}
        onContinue={() => setLocation('/dashboard')}
      />
    );
  }

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      overflow: 'hidden'
    }}>
      {/* Floating Particle Background */}
      <SharedNetworkAnimation />
      <Navigation showFullNav={false} />
      
      {/* Content with proper z-index */}
      <div style={{ 
        position: 'relative',
        zIndex: 10,
        width: '100%',
        maxWidth: '1200px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        padding: '0 20px'
      }}>
        
        {/* Back Button */}
        <div style={{ marginBottom: '20px' }}>
          <button 
            onClick={() => setLocation('/')}
            style={{
              background: 'none',
              border: '2px solid #00bcd4',
              color: '#00bcd4',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontFamily: 'Inter, sans-serif',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#00bcd4';
              e.currentTarget.style.color = '#000';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#00bcd4';
            }}
          >
            ← Back to Home
          </button>
        </div>
        
        {/* Main Headline */}
        <h1 style={{
          alignSelf: 'center',
          fontSize: '48px',
          fontWeight: '700',
          textAlign: 'center',
          lineHeight: '1.2',
          marginBottom: '30px',
          color: '#00bcd4',
          fontFamily: 'Inter, sans-serif'
        }}>
          Connect wallet to claim your <span style={{ color: '#00f0ff' }}>.fsn</span> name
        </h1>
        
        {/* Connection Info and Wallet */}
        <div style={{
          alignSelf: 'center',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          marginBottom: '30px',
          width: '100%',
          gap: '40px'
        }}>
          
          {/* Connection Info */}
          <div style={{
            fontSize: '18px',
            lineHeight: '1.5',
            color: '#E1F5FE',
            textAlign: 'left',
            maxWidth: '320px',
            fontFamily: 'Inter, sans-serif',
            background: 'rgba(0, 20, 40, 0.6)',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid rgba(0, 188, 212, 0.3)'
          }}>
            <p style={{ margin: '0 0 12px 0', fontWeight: '500', color: '#00bcd4' }}>Names are soulbound.</p>
            <p style={{ margin: '0 0 12px 0', fontWeight: '400' }}>One per wallet forever.</p>
            <p style={{ margin: '0', fontWeight: '400', opacity: '0.9' }}>
              {isConnected ? 'Enter your desired name below.' : 'Connect to proceed.'}
            </p>
          </div>
          
          {/* Wallet Connection */}
          <div>
            <WalletConnect />
          </div>
        </div>

        {/* Show SoulboundWarning if wallet already owns a name */}
        {isConnected && userExistingName && (
          <div style={{ alignSelf: 'center', marginBottom: '40px' }}>
            <SoulboundWarning existingName={userExistingName} />
          </div>
        )}

        {/* FSN Name Input and Claim Section - Only show if wallet connected and doesn't own a name */}
        {isConnected && !userExistingName && (
          <div style={{
            alignSelf: 'center',
            width: '100%',
            maxWidth: '500px',
            background: 'rgba(0, 20, 40, 0.7)',
            padding: '24px',
            borderRadius: '12px',
            border: '1px solid rgba(0, 188, 212, 0.3)'
          }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '600',
              color: '#00bcd4',
              textAlign: 'center',
              marginBottom: '20px',
              fontFamily: 'Inter, sans-serif'
            }}>
              Claim Your .fsn Name
            </h2>

            {/* FSN Input */}
            <div style={{ position: 'relative', marginBottom: '16px' }}>
              <input
                type="text"
                value={fsnInput}
                onChange={(e) => {
                  const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                  setFsnInput(value);
                  handleAvailabilityCheck(value);
                }}
                placeholder="yourname"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  paddingRight: '60px',
                  backgroundColor: 'rgba(0, 40, 60, 0.6)',
                  border: '2px solid #00bcd4',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '18px',
                  fontWeight: '500',
                  outline: 'none',
                  textAlign: 'left',
                  fontFamily: 'Inter, sans-serif'
                }}
                maxLength={32}
              />
              <div style={{
                position: 'absolute',
                right: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#00f0ff',
                fontSize: '18px',
                fontWeight: '500',
                fontFamily: 'Inter, sans-serif'
              }}>
                .fsn
              </div>
            </div>

            {/* Availability Status */}
            {fsnInput && fsnInput.length >= 3 && (
              <div style={{
                padding: '12px 16px',
                borderRadius: '8px',
                border: `2px solid ${availabilityStatus?.available ? '#22c55e' : '#ef4444'}`,
                backgroundColor: availabilityStatus?.available 
                  ? 'rgba(34, 197, 94, 0.15)' 
                  : 'rgba(239, 68, 68, 0.15)',
                color: availabilityStatus?.available ? '#22c55e' : '#ef4444',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '20px',
                textAlign: 'center',
                fontFamily: 'Inter, sans-serif'
              }}>
                {isNameRegistryLoading ? 'Checking availability...' : (
                  availabilityStatus?.available ? '✓ Available for claim' : `✗ ${availabilityStatus?.reason || 'Not available'}`
                )}
              </div>
            )}

            {/* Claim Button */}
            <button
              onClick={handleClaimSubmit}
              disabled={!fsnInput || fsnInput.length < 3 || !availabilityStatus?.available || isRegistering}
              style={{
                width: '100%',
                padding: '14px',
                backgroundColor: (!fsnInput || fsnInput.length < 3 || !availabilityStatus?.available || isRegistering)
                  ? 'rgba(100, 100, 100, 0.3)' : '#00bcd4',
                color: (!fsnInput || fsnInput.length < 3 || !availabilityStatus?.available || isRegistering)
                  ? '#666' : '#000',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: (!fsnInput || fsnInput.length < 3 || !availabilityStatus?.available || isRegistering)
                  ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                fontFamily: 'Inter, sans-serif'
              }}
            >
              {isRegistering ? 'Claiming...' : 'Claim Name'}
            </button>
          </div>
        )}
        
        <Toaster />
      </div>
    </div>
  );
};

export default ClaimFSN;