// Contract event listeners for real-time updates
import { useWatchContractEvent } from 'wagmi';
import { useAccount } from 'wagmi';
import { useCallback } from 'react';
import { contractAddresses, registryABI, pointsABI, filesABI } from '../config/contracts';

export function useContractEvents() {
  const { address } = useAccount();

  // Registry events - listen for name registrations
  const onNameRegistered = useCallback((logs: any[]) => {
    logs.forEach((log) => {
      console.log('Name registered:', {
        owner: log.args.owner,
        name: log.args.name
      });
      
      // Trigger UI updates
      window.dispatchEvent(new CustomEvent('fsn:nameRegistered', {
        detail: { owner: log.args.owner, name: log.args.name }
      }));
    });
  }, []);

  useWatchContractEvent({
    address: contractAddresses.Registry as `0x${string}`,
    abi: registryABI,
    eventName: 'Registered',
    onLogs: onNameRegistered
  });

  // Points events - listen for XP awards
  const onXPAwarded = useCallback((logs: any[]) => {
    logs.forEach((log) => {
      console.log('XP awarded:', {
        user: log.args.user,
        amount: log.args.amount,
        actionId: log.args.actionId
      });
      
      // Trigger UI updates for current user
      if (address && log.args.user.toLowerCase() === address.toLowerCase()) {
        window.dispatchEvent(new CustomEvent('fsn:xpAwarded', {
          detail: { amount: Number(log.args.amount), actionId: log.args.actionId }
        }));
      }
    });
  }, [address]);

  useWatchContractEvent({
    address: contractAddresses.Points as `0x${string}`,
    abi: pointsABI,
    eventName: 'Awarded',
    onLogs: onXPAwarded
  });

  // Files events - listen for file pins
  const onFilePinned = useCallback((logs: any[]) => {
    logs.forEach((log) => {
      console.log('File pinned:', {
        user: log.args.user,
        cid: log.args.cid
      });
      
      // Trigger UI updates for current user
      if (address && log.args.user.toLowerCase() === address.toLowerCase()) {
        window.dispatchEvent(new CustomEvent('fsn:filePinned', {
          detail: { cid: log.args.cid }
        }));
      }
    });
  }, [address]);

  useWatchContractEvent({
    address: contractAddresses.Files as `0x${string}`,
    abi: filesABI,
    eventName: 'Pinned',
    onLogs: onFilePinned
  });

  return {
    // Event listeners are automatically active when this hook is used
    // Custom event listeners can be added to React components
  };
}