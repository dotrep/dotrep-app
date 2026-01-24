import React, { useEffect } from "react";
import { Route, Switch, useLocation } from "wouter";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { wagmiConfig } from "./config/wagmi";

import Home from "./pages/Home";
import Discover from "./pages/Discover";
import Claim from "./pages/Claim";
import Wallet from "./pages/Wallet";
import Admin from "./pages/Admin";
import Map from "./pages/Map";
import Manifold from "./pages/Manifold";
import Dashboard from "./pages/Dashboard";
import { Signals } from "./pages/Signals";
import IdentityDebug from "./pages/IdentityDebug";
import Login from "./pages/Login";

/**
 * MVP spine canonical URL for marketing pages.
 * In production, keep this as dotrep.io.
 * In local/dev, you can temporarily point to your preview URL if needed.
 */
const MVP_WHITEPAPER_URL = "https://dotrep.io/whitepaper";

// ---- tiny helpers (no dependency on Redirect component) ----
function InternalRedirect({ to }: { to: string }) {
  const [, setLocation] = useLocation();
  useEffect(() => {
    setLocation(to);
  }, [to, setLocation]);
  return null;
}

function ExternalRedirect({ to }: { to: string }) {
  useEffect(() => {
    if (typeof window !== "undefined") window.location.href = to;
  }, [to]);
  return null;
}

function OkPage({ label }: { label: string }) {
  const build =
    (import.meta as any)?.env?.VITE_BUILD_STAMP ||
    (import.meta as any)?.env?.VITE_GIT_SHA ||
    "dev";
  return (
    <div
      style={{
        padding: 16,
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
      }}
    >
      <div style={{ fontSize: 18, marginBottom: 8 }}>OK ✅</div>
      <div>label: {label}</div>
      <div>build: {build}</div>
      <div>time: {new Date().toISOString()}</div>
      <div style={{ marginTop: 12, opacity: 0.7 }}>
        If you can see this, routing + React render is working.
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ margin: 0 }}>404</h2>
      <p style={{ opacity: 0.8 }}>No route matched this path.</p>
      <a href="/" style={{ textDecoration: "underline" }}>
        Go home
      </a>
    </div>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false },
  },
});

export default function App() {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <Switch>
          {/* ------------------------------------------------------------
             HEALTH / DEBUG
             ------------------------------------------------------------ */}
          <Route path="/__ok" component={() => <OkPage label="__ok" />} />
          <Route
            path="/__ok-dashboard"
            component={() => <OkPage label="__ok-dashboard" />}
          />
          <Route
            path="/__ok-rep-dashboard"
            component={() => <OkPage label="__ok-rep-dashboard" />}
          />

          {/* ------------------------------------------------------------
             ALIASES / REDIRECTS (so links never blank)
             ------------------------------------------------------------ */}
          <Route
            path="/dashboard"
            component={() => <InternalRedirect to="/" />}
          />
          <Route
            path="/rep-dashboard"
            component={() => <InternalRedirect to="/" />}
          />
          <Route path="/rep" component={() => <InternalRedirect to="/" />} />

          {/* marketing route: always bounce to canonical whitepaper */}
          <Route
            path="/whitepaper"
            component={() => <ExternalRedirect to={MVP_WHITEPAPER_URL} />}
          />

          {/* ------------------------------------------------------------
             REAL APP ROUTES
             ------------------------------------------------------------ */}
          <Route path="/" component={Dashboard} />
          <Route path="/home" component={Home} />
          <Route path="/reserve" component={Claim} />
          <Route path="/claim" component={Claim} />
          <Route path="/discover" component={Discover} />
          <Route path="/wallet" component={Wallet} />
          <Route path="/manifold" component={Manifold} />
          <Route path="/signals" component={Signals} />
          <Route path="/map" component={Map} />
          <Route path="/admin" component={Admin} />
          <Route path="/identity-debug" component={IdentityDebug} />
          <Route path="/login" component={Login} />

          {/* Fallback — IMPORTANT so unknown routes don’t render blank */}
          <Route component={NotFound} />
        </Switch>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
