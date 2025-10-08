/**
 * Generic Name Registry Hook
 * Handles blockchain name registration without any specific branding
 */
import { useState, useEffect } from 'react';
import { useAccount, useWriteContract } from 'wagmi';
import { parseAbiItem } from 'viem';

// Generic contract configuration - will be updated with real deployment
const CONTRACT_ADDRESS = '0x5555555555555555555555555555555555555555'; // Mock address until deployment
const CHAIN_ID = 84532; // Base Sepolia

const CONTRACT_ABI = [
  parseAbiItem('function registerName(string memory name) external'),
  parseAbiItem('function getOwner(string memory name) external view returns (address)'),
  parseAbiItem('function getName(address owner) external view returns (string memory)'),
  parseAbiItem('function isNameAvailable(string memory name) external view returns (bool)'),
  parseAbiItem('function nameExistsInRegistry(string memory name) external view returns (bool)'),
  parseAbiItem('function transferName(string memory name, address to) external'),
  parseAbiItem('event NameRegistered(string indexed name, address indexed owner)'),
  parseAbiItem('event NameTransferred(string indexed name, address indexed from, address indexed to)')
];

export interface NameRegistryResult {
  available: boolean;
  reason: string;
}

export function useNameRegistry() {
  const { address, isConnected } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Register name function using writeContract
  const { writeContract, isPending: isRegistering, isSuccess: isRegistrationSuccess } = useWriteContract();

  // Check name availability
  const checkNameAvailability = async (name: string): Promise<NameRegistryResult> => {
    if (!name || name.length < 3) {
      return { available: false, reason: 'Name must be at least 3 characters' };
    }

    if (name.length > 32) {
      return { available: false, reason: 'Name must be less than 32 characters' };
    }

    // Validate alphanumeric only
    if (!/^[a-z0-9]+$/.test(name)) {
      return { available: false, reason: 'Name can only contain lowercase letters and numbers' };
    }

    try {
      setIsLoading(true);
      setError(null);

      // SOULBOUND CHECK: One wallet can only register ONE name
      if (address) {
        try {
          const existingName = await getUserName(address);
          if (existingName) {
            return { 
              available: false, 
              reason: `Your wallet already owns "${existingName}". Names are soulbound - one per wallet.` 
            };
          }
        } catch (soulboundError) {
          console.warn('Could not check for existing names, proceeding with availability check:', soulboundError);
          // Continue with availability check even if soulbound check fails
        }
      }

      // For development, simulate availability check until contract is deployed
      const mockUnavailableNames = ['test', 'admin', 'root', 'api', 'www', 'system', 'support'];
      const isAvailable = !mockUnavailableNames.includes(name.toLowerCase());

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));

      return {
        available: isAvailable,
        reason: isAvailable ? 'Available for registration' : 'Name already taken'
      };
    } catch (err: any) {
      console.error('Name availability check failed:', err);
      setError(err.message || 'Failed to check name availability');
      return { available: false, reason: 'Unable to check availability' };
    } finally {
      setIsLoading(false);
    }
  };

  // Get name for address (enforces soulbound rule)
  const getUserName = async (userAddress?: string): Promise<string | null> => {
    if (!userAddress) return null;

    try {
      // Check backend database for existing FSN names claimed by this wallet
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(`/api/fsn/check-wallet/${userAddress}`, {
        method: 'GET',
        credentials: 'include',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        return data.fsnName || null;
      } else {
        console.warn('Failed to check wallet for existing names, status:', response.status);
        return null;
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.error('Request timed out checking wallet for existing names');
      } else {
        console.error('Failed to get user name:', err);
      }
      return null;
    }
  };

  // Register a name (with soulbound enforcement)
  const handleRegisterName = async (name: string) => {
    if (!isConnected) {
      throw new Error('Wallet not connected');
    }

    if (!address) {
      throw new Error('Wallet address not available');
    }

    if (!name) {
      throw new Error('Name is required');
    }

    // CRITICAL: Double-check soulbound rule before registration
    const existingName = await getUserName(address);
    if (existingName) {
      throw new Error(`Your wallet already owns "${existingName}". Names are soulbound - only one per wallet allowed.`);
    }

    const availability = await checkNameAvailability(name);
    if (!availability.available) {
      throw new Error(availability.reason);
    }

    try {
      setError(null);
      // For development, simulate the registration process
      console.log('Registering name:', name, 'for address:', address);
      console.log('Soulbound check passed - wallet has no existing name');
      
      // Simulate blockchain transaction delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock successful registration
      console.log('Name registered successfully:', name);
      
      // When real contract is deployed, replace with:
      // writeContract({
      //   address: CONTRACT_ADDRESS,
      //   abi: CONTRACT_ABI,
      //   functionName: 'registerName',
      //   args: [name.toLowerCase()],
      //   chainId: CHAIN_ID,
      // });
      
    } catch (err: any) {
      console.error('Registration failed:', err);
      setError(err.message || 'Registration failed');
      throw err;
    }
  };

  return {
    // State
    isLoading: isLoading || isRegistering,
    isRegistering,
    isRegistrationSuccess,
    error,
    isConnected,
    userAddress: address,

    // Functions
    checkNameAvailability,
    registerName: handleRegisterName,
    getUserName,

    // Contract info
    contractAddress: CONTRACT_ADDRESS,
    chainId: CHAIN_ID,
  };
}