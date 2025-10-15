import React, { useState, useEffect } from "react";
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from './wagmi.config';
import Home from "./pages/Home";
import Reserve from "./pages/Reserve";
import Discover from "./pages/Discover";
import Claim from "./pages/Claim";
import Wallet from "./pages/Wallet";

const queryClient = new QueryClient();

export default function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a[href^="/"]');
      
      if (anchor && anchor.getAttribute('href')?.startsWith('/')) {
        const href = anchor.getAttribute('href');
        if (href && !anchor.getAttribute('target')) {
          e.preventDefault();
          window.history.pushState({}, '', href);
          setCurrentPath(href);
          window.scrollTo(0, 0);
        }
      }
    };

    document.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      document.removeEventListener('click', handleClick);
    };
  }, []);

  const renderPage = () => {
    switch (currentPath) {
      case '/reserve':
        return <Reserve />;
      case '/discover':
        return <Discover />;
      case '/claim':
        return <Claim />;
      case '/wallet':
        return <Wallet />;
      case '/':
      default:
        return <Home />;
    }
  };

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {renderPage()}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
