import { useAccount, useConnect, useSwitchChain } from 'wagmi';
import { base } from 'wagmi/chains';

interface HomeButtonState {
  text: string;
  disabled: boolean;
  onClick: () => void;
}

export function useHomeButton(): HomeButtonState {
  const { isConnected, chain } = useAccount();
  const { connect, connectors } = useConnect();
  const { switchChain } = useSwitchChain();

  const navigateToClaim = () => {
    window.history.pushState({}, '', '/claim');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  if (!isConnected) {
    return {
      text: 'Connect wallet',
      disabled: false,
      onClick: () => {
        const injectedConnector = connectors.find(c => c.id === 'injected');
        if (injectedConnector) {
          connect({ connector: injectedConnector });
        }
      },
    };
  }

  if (chain?.id !== base.id) {
    return {
      text: 'Switch to Base',
      disabled: false,
      onClick: () => {
        switchChain({ chainId: base.id });
      },
    };
  }

  return {
    text: 'Reserve your.rep',
    disabled: false,
    onClick: navigateToClaim,
  };
}
