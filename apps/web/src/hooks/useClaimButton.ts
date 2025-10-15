import { useAccount, useConnect, useSwitchChain } from 'wagmi';
import { base } from 'wagmi/chains';

interface UseClaimButtonProps {
  name: string;
  isValid: boolean;
  isChecking: boolean;
  isAvailable: boolean | null;
  showInput: boolean;
  onShowInput: () => void;
}

interface ClaimButtonState {
  text: string;
  disabled: boolean;
  onClick: () => void;
}

export function useClaimButton({
  name,
  isValid,
  isChecking,
  isAvailable,
  showInput,
  onShowInput,
}: UseClaimButtonProps): ClaimButtonState {
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors } = useConnect();
  const { switchChain } = useSwitchChain();

  const handleReserve = async () => {
    try {
      const response = await fetch('http://127.0.0.1:3001/rep/reserve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          walletAddress: address,
        }),
      });

      if (response.ok) {
        const rid = Math.random().toString(36).substring(2, 15);
        window.location.href = `/wallet?name=${encodeURIComponent(name)}&rid=${rid}`;
      } else {
        console.error('Failed to reserve name');
      }
    } catch (error) {
      console.error('Error reserving name:', error);
    }
  };

  if (!showInput) {
    return {
      text: 'Reserve your .rep',
      disabled: false,
      onClick: onShowInput,
    };
  }

  if (!name || !isValid) {
    return {
      text: 'Check availability',
      disabled: true,
      onClick: () => {},
    };
  }

  if (isChecking) {
    return {
      text: 'Checking...',
      disabled: true,
      onClick: () => {},
    };
  }

  if (isAvailable === false) {
    return {
      text: 'Name is taken',
      disabled: true,
      onClick: () => {},
    };
  }

  if (isAvailable === true) {
    if (!isConnected) {
      return {
        text: 'Connect wallet to claim',
        disabled: false,
        onClick: () => {
          const connector = connectors.find(c => c.id === 'browserWallet' || c.id === 'injected');
          if (connector) {
            connect({ connector });
          }
        },
      };
    }

    if (chain?.id !== base.id) {
      return {
        text: 'Switch to Base to claim',
        disabled: false,
        onClick: () => {
          switchChain({ chainId: base.id });
        },
      };
    }

    return {
      text: 'Reserve your .rep',
      disabled: false,
      onClick: handleReserve,
    };
  }

  return {
    text: 'Check availability',
    disabled: true,
    onClick: () => {},
  };
}
