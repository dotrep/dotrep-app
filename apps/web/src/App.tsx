import React from "react";
import { Route, Switch } from "wouter";
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { wagmiConfig } from '../client/src/config/wagmi';
import { ErrorBoundary } from './components/ErrorBoundary';
import Home from "./pages/Home";
import Discover from "./pages/Discover";
import ClaimFSN from "../client/src/pages/ClaimFSN";
import Wallet from "./pages/Wallet";
import { RepDashboard } from "../client/src/pages/RepDashboard";

const queryClient = new QueryClient();

export default function App() {
  return (
    <ErrorBoundary>
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/reserve" component={ClaimFSN} />
            <Route path="/claim" component={ClaimFSN} />
            <Route path="/discover" component={Discover} />
            <Route path="/wallet" component={Wallet} />
            <Route path="/rep-dashboard" component={RepDashboard} />
            <Route>
              <Home />
            </Route>
          </Switch>
        </QueryClientProvider>
      </WagmiProvider>
    </ErrorBoundary>
  );
}
