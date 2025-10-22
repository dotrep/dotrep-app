import React from "react";
import { Route, Switch } from "wouter";
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { wagmiConfig } from './config/wagmi';
import { ErrorBoundary } from './components/ErrorBoundary';
import Home from "./pages/Home";
import Discover from "./pages/Discover";
import Claim from "./pages/Claim";
import Wallet from "./pages/Wallet";

const queryClient = new QueryClient();

export default function App() {
  return (
    <ErrorBoundary>
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/reserve" component={Claim} />
            <Route path="/claim" component={Claim} />
            <Route path="/discover" component={Discover} />
            <Route path="/wallet" component={Wallet} />
            <Route>
              <Home />
            </Route>
          </Switch>
        </QueryClientProvider>
      </WagmiProvider>
    </ErrorBoundary>
  );
}
