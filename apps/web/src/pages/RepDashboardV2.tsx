import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useAccount, useDisconnect } from "wagmi";
import "./rep-dashboard.css";

/**
 * RepDashboardV2
 * - Fixes redirect-to-/claim loops by adding a DEV bypass: /rep-dashboard?dev=1
 * - Keeps a clean session/wallet guard for normal users
 * - Displays the "new" dashboard UI (hero + cards + actions)
 */

type DashboardStats = {
  pulseScore: number;
  signals: number;
  xpPoints: number;
};

function formatAddress(addr?: string) {
  if (!addr) return "";
  if (addr.length <= 10) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function getSearchParam(key: string): string | null {
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get(key);
  } catch {
    return null;
  }
}

function isDevBypassEnabled(): boolean {
  return getSearchParam("dev") === "1";
}

function readLocalStorageFirst(keys: string[]): string | null {
  try {
    for (const k of keys) {
      const v = window.localStorage.getItem(k);
      if (v && v.trim()) return v.trim();
    }
    return null;
  } catch {
    return null;
  }
}

function safeNumber(v: any, fallback: number) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export default function RepDashboardV2() {
  const [, setLocation] = useLocation();

  const { address, isConnected } = useAccount();
  const { disconnectAsync } = useDisconnect();

  // --- local "session-ish" / identity values (soft assumptions, non-breaking) ---
  const storedSessionAddress = useMemo(() => {
    return readLocalStorageFirst([
      "rep_session_address",
      "session_address",
      "repAddress",
      "walletAddress",
      "address",
    ]);
  }, []);

  const storedRepName = useMemo(() => {
    return readLocalStorageFirst([
      "rep_name",
      "repName",
      "dotrep_name",
      "claimed_rep",
      "rep_username",
    ]);
  }, []);

  const effectiveAddress = address ?? storedSessionAddress ?? undefined;

  const [repName, setRepName] = useState<string>(
    storedRepName ?? "chameleon-dev",
  );
  const [stats, setStats] = useState<DashboardStats>({
    // Defaults match your screenshot vibe. Replace later with real values if desired.
    pulseScore: 55,
    signals: 0,
    xpPoints: 100,
  });

  const [isBooting, setIsBooting] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // --- Guard logic ---
  useEffect(() => {
    const devBypass = isDevBypassEnabled();

    // Give the app a tick to hydrate before redirecting
    const t = setTimeout(() => {
      // If no wallet connected and no stored session address, normally redirect to /claim.
      if (!devBypass && !isConnected && !storedSessionAddress) {
        console.log(
          "[DASHBOARD_V2] No wallet + no stored session — redirecting to /claim",
        );
        setLocation("/claim");
        return;
      }

      // If we have no repName stored, we still allow the dashboard (to avoid loops),
      // but you can re-tighten this later.
      if (!repName || repName.trim().length === 0) {
        console.log(
          "[DASHBOARD_V2] No repName detected — continuing (soft mode).",
        );
        setRepName("chameleon-dev");
      }

      setIsBooting(false);
    }, 50);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, storedSessionAddress, setLocation]);

  // OPTIONAL: if you have an API endpoint later, you can hydrate stats here.
  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      try {
        // If you already have a known endpoint, replace this with your real one.
        // const res = await fetch("/api/rep/dashboard");
        // if (!res.ok) return;
        // const data = await res.json();
        // if (cancelled) return;

        // Example:
        // setRepName(data.repName ?? repName);
        // setStats({
        //   pulseScore: safeNumber(data.pulseScore, 55),
        //   signals: safeNumber(data.signals, 0),
        //   xpPoints: safeNumber(data.xpPoints, 100),
        // });

        if (cancelled) return;
      } catch (e) {
        // keep silent; dashboard should still render
      }
    }

    hydrate();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleLogout() {
    try {
      setIsLoggingOut(true);

      // Clear any local session flags (safe cleanup)
      try {
        window.localStorage.removeItem("rep_session_address");
        window.localStorage.removeItem("session_address");
        window.localStorage.removeItem("rep_name");
        window.localStorage.removeItem("repName");
        window.localStorage.removeItem("dotrep_name");
        window.localStorage.removeItem("claimed_rep");
      } catch {}

      // Disconnect wallet session if connected
      try {
        await disconnectAsync?.();
      } catch {}

      setLocation("/");
    } finally {
      setIsLoggingOut(false);
    }
  }

  if (isBooting) {
    return (
      <div className="rep-dashboard">
        <div style={{ padding: 24, opacity: 0.7 }}>Loading dashboard…</div>
      </div>
    );
  }

  return (
    <div className="rep-dashboard">
      {/* HERO */}
      <div className="dashboard-hero">
        <div className="rep-logo">
          <span className="rep-dot">.</span>rep
        </div>

        <div className="hero-wallet-pill">
          <span className="pill-indicator" />
          <span>
            {effectiveAddress
              ? formatAddress(effectiveAddress)
              : "Not connected"}
          </span>
        </div>

        <h1 className="hero-title">
          <span className="rep-dot">.</span>
          {repName}
        </h1>

        <p className="hero-subtitle">Your onchain identity on Base</p>
      </div>

      {/* CARDS */}
      <div className="dashboard-cards">
        {/* Pulse Score */}
        <div className="dashboard-card">
          <div className="card-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M3 12h3l2-6 4 12 2-6h4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h3 className="card-title">Pulse Score</h3>
          <p className="card-value">{stats.pulseScore}</p>
          <p className="card-label">Base activity score</p>
        </div>

        {/* Signals */}
        <div className="dashboard-card">
          <div className="card-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M21 15a4 4 0 0 1-4 4H7l-4 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h3 className="card-title">Signals</h3>
          <p className="card-value">{stats.signals}</p>
          <p className="card-label">Messages sent</p>
        </div>

        {/* XP Points */}
        <div className="dashboard-card">
          <div className="card-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 1v22"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M17 5H9a4 4 0 0 0 0 8h6a4 4 0 0 1 0 8H6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h3 className="card-title">XP Points</h3>
          <p className="card-value">{stats.xpPoints}</p>
          <p className="card-label">Claimed bonus</p>
        </div>

        {/* Wallet */}
        <div className="dashboard-card">
          <div className="card-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0-8 0 4 4 0 0 0 8 0z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h3 className="card-title">Wallet</h3>
          <p className="card-value">
            {effectiveAddress
              ? formatAddress(effectiveAddress)
              : "Not connected"}
          </p>
          <p className="card-label">Base Network</p>
        </div>
      </div>

      {/* ACTIONS */}
      <div className="dashboard-actions">
        <button
          className="action-button action-button-primary"
          onClick={() => setLocation("/missions")}
        >
          View Missions
        </button>

        <button
          className="action-button action-button-secondary"
          onClick={() => setLocation("/")}
        >
          Back to Home
        </button>

        <button
          className="action-button action-button-secondary"
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? "Logging out..." : "Logout"}
        </button>

        {/* V2 Stamp */}
        <div className="fixed bottom-3 left-3 text-xs opacity-40 pointer-events-none">
          DASHBOARD_V2 · DOTREP_PROD_REFRESH_2026
        </div>
      </div>
    </div>
  );
}
