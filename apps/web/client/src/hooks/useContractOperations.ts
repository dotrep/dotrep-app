// Contract operation hooks for FSN system
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useAccount } from 'wagmi';
import { useState, useCallback } from 'react';
import { contractAddresses, registryABI, pointsABI, filesABI } from '../config/contracts';
import { encodePacked, keccak256, toHex } from 'viem';

// Registry operations
export function useRegistryOperations() {
  const { address } = useAccount();
  const { writeContract, data: txHash } = useWriteContract();
  const [isRegistering, setIsRegistering] = useState(false);

  // Check if name is available
  const checkNameAvailability = useCallback(async (name: string) => {
    try {
      const { data: owner } = await useReadContract({
        address: contractAddresses.Registry as `0x${string}`,
        abi: registryABI,
        functionName: 'ownerOf',
        args: [name.toLowerCase()],
      });
      
      return {
        available: owner === '0x0000000000000000000000000000000000000000',
        owner: owner as string
      };
    } catch (error) {
      console.error('Name availability check failed:', error);
      return { available: false, owner: null };
    }
  }, []);

  // Register a name
  const registerName = useCallback(async (name: string) => {
    if (!address) throw new Error('Wallet not connected');
    
    setIsRegistering(true);
    try {
      await writeContract({
        address: contractAddresses.Registry as `0x${string}`,
        abi: registryABI,
        functionName: 'register',
        args: [name.toLowerCase()],
      });
    } catch (error) {
      setIsRegistering(false);
      throw error;
    }
  }, [address, writeContract]);

  // Check if address has a name
  const { data: hasName, refetch: refetchHasName } = useReadContract({
    address: contractAddresses.Registry as `0x${string}`,
    abi: registryABI,
    functionName: 'hasName',
    args: address ? [address] : undefined,
    query: { enabled: !!address }
  });

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
    onSuccess: () => {
      setIsRegistering(false);
      refetchHasName();
    }
  });

  return {
    checkNameAvailability,
    registerName,
    hasName: !!hasName,
    isRegistering: isRegistering || isConfirming,
    isSuccess,
    refetchHasName
  };
}

// Points (XP) operations
export function usePointsOperations() {
  const { address } = useAccount();

  // Get total XP for connected address
  const { data: totalXP, refetch: refetchXP } = useReadContract({
    address: contractAddresses.Points as `0x${string}`,
    abi: pointsABI,
    functionName: 'totalOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address }
  });

  return {
    totalXP: totalXP ? Number(totalXP) : 0,
    refetchXP
  };
}

// Files (IPFS) operations
export function useFilesOperations() {
  const { address } = useAccount();
  const { writeContract, data: txHash } = useWriteContract();
  const [isPinning, setIsPinning] = useState(false);

  // Pin file to IPFS (emit event)
  const pinFile = useCallback(async (ipfsCid: string) => {
    if (!address) throw new Error('Wallet not connected');
    
    // Convert IPFS CID to bytes32 (simplified - real implementation would need proper CID handling)
    const cidBytes = keccak256(encodePacked(['string'], [ipfsCid]));
    
    setIsPinning(true);
    try {
      await writeContract({
        address: contractAddresses.Files as `0x${string}`,
        abi: filesABI,
        functionName: 'pin',
        args: [cidBytes],
      });
    } catch (error) {
      setIsPinning(false);
      throw error;
    }
  }, [address, writeContract]);

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
    onSuccess: () => setIsPinning(false)
  });

  return {
    pinFile,
    isPinning: isPinning || isConfirming,
    isSuccess
  };
}

// Combined hook for all contract operations
export function useContractOperations() {
  const registry = useRegistryOperations();
  const points = usePointsOperations();
  const files = useFilesOperations();

  return {
    registry,
    points,
    files
  };
}