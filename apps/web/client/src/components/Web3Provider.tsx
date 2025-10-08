// Web3 provider wrapper for wagmi integration
import React from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { wagmiConfig } from '../config/wagmi';
import { useContractEvents } from '../hooks/useContractEvents';

// Query client for wagmi
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1_000 * 60 * 60 * 24, // 24 hours
    },
  },
});

// Component to initialize contract event listeners
function ContractEventListener() {
  // Temporarily disabled to prevent fetch errors during development
  // useContractEvents();
  return null;
}

interface Web3ProviderProps {
  children: React.ReactNode;
}

export function Web3Provider({ children }: Web3ProviderProps) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ContractEventListener />
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}