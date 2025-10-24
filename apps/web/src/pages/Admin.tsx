import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAccount, useSignMessage } from 'wagmi';
import './admin.css';

interface Reservation {
  id: string;
  name: string;
  address: string;
  createdAt: string;
  updatedAt: string;
}

interface Stats {
  totalClaims: number;
  last24h: number;
}

export default function Admin() {
  const [, setLocation] = useLocation();
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);

  useEffect(() => {
    checkAuthAndLoad();
  }, [address, isConnected]);

  const checkAuthAndLoad = async () => {
    setLoading(true);
    setError('');
    setNeedsLogin(false);
    
    try {
      // Check if user is authenticated first
      const sessionRes = await fetch('/api/auth/me', {
        credentials: 'include',
      });

      if (!sessionRes.ok) {
        setNeedsLogin(true);
        setIsAuthorized(false);
        setLoading(false);
        return;
      }

      // Try to load admin data
      await Promise.all([loadReservations(), loadStats()]);
      setIsAuthorized(true);
    } catch (err: any) {
      if (err.message.includes('403')) {
        setError('Access denied. Admin access required.');
      } else if (err.message.includes('401')) {
        setNeedsLogin(true);
      } else {
        setError(err.message || 'Failed to load admin data');
      }
      setIsAuthorized(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!address || !isConnected) {
      setError('Please connect your wallet first');
      return;
    }

    setLoggingIn(true);
    setError('');

    try {
      // Get challenge
      const challengeRes = await fetch('/api/auth/challenge', {
        credentials: 'include',
      });

      if (!challengeRes.ok) {
        throw new Error('Failed to get challenge');
      }

      const { nonce } = await challengeRes.json();

      // Create the message to sign
      const message = `Sign this message to login to .rep admin panel.\n\nNonce: ${nonce}`;

      // Sign the message
      const signature = await signMessageAsync({
        message,
      });

      // Verify signature and create session
      const verifyRes = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, message, signature, nonce }),
        credentials: 'include',
      });

      if (!verifyRes.ok) {
        const data = await verifyRes.json();
        throw new Error(data.error || 'Authentication failed');
      }

      // Reload admin data
      await checkAuthAndLoad();
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to login');
    } finally {
      setLoggingIn(false);
    }
  };

  const loadReservations = async (searchTerm?: string) => {
    const params = new URLSearchParams();
    const term = searchTerm !== undefined ? searchTerm : search;
    if (term) params.set('search', term);
    
    const res = await fetch(`/api/admin/reservations?${params}`, {
      credentials: 'include',
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to load reservations');
    }

    const data = await res.json();
    setReservations(data.reservations || []);
  };

  const loadStats = async () => {
    const res = await fetch('/api/admin/stats', {
      credentials: 'include',
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to load stats');
    }

    const data = await res.json();
    setStats(data.stats);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setLoading(true);
    loadReservations(searchInput).finally(() => setLoading(false));
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  const formatAddress = (addr: string) => {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-container">
          <div className="admin-loading">Loading admin panel...</div>
        </div>
      </div>
    );
  }

  if (needsLogin) {
    return (
      <div className="admin-page">
        <div className="admin-container">
          <div className="admin-error">
            <h2>.rep Admin Login</h2>
            <p>
              {isConnected 
                ? 'Please sign in with your wallet to access the admin panel.'
                : 'Please connect your wallet first, then sign in to access the admin panel.'}
            </p>
            {error && <p className="admin-error-text">{error}</p>}
            <div className="admin-error-actions">
              {isConnected ? (
                <button 
                  onClick={handleLogin} 
                  className="admin-button"
                  disabled={loggingIn}
                >
                  {loggingIn ? 'Signing In...' : 'Sign In with Wallet'}
                </button>
              ) : (
                <p className="admin-hint">Connect your wallet using the button in the top right</p>
              )}
              <button onClick={() => setLocation('/')} className="admin-button admin-button-secondary">
                Go to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !isAuthorized) {
    return (
      <div className="admin-page">
        <div className="admin-container">
          <div className="admin-error">
            <h2>Access Restricted</h2>
            <p>{error || 'You do not have permission to access this page.'}</p>
            <button onClick={() => setLocation('/')} className="admin-button">
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-container">
        <header className="admin-header">
          <h1>.rep Admin Panel</h1>
          {isConnected && address && (
            <div className="admin-wallet-badge">
              <span className="admin-wallet-indicator">🟢</span>
              <span className="admin-wallet-address">{formatAddress(address)}</span>
            </div>
          )}
        </header>

        {stats && (
          <div className="admin-stats">
            <div className="stat-card">
              <div className="stat-label">Total Claims</div>
              <div className="stat-value">{stats.totalClaims}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Last 24 Hours</div>
              <div className="stat-value">{stats.last24h}</div>
            </div>
          </div>
        )}

        <div className="admin-controls">
          <form onSubmit={handleSearch} className="admin-search">
            <input
              type="text"
              placeholder="Search by name or address..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="admin-search-input"
            />
            <button type="submit" className="admin-button">Search</button>
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setSearchInput('');
                  setLoading(true);
                  loadReservations('').finally(() => setLoading(false));
                }}
                className="admin-button admin-button-secondary"
              >
                Clear
              </button>
            )}
          </form>
        </div>

        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>.rep Name</th>
                <th>Wallet Address</th>
                <th>Claimed At</th>
                <th>Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {reservations.length === 0 ? (
                <tr>
                  <td colSpan={4} className="admin-table-empty">
                    {search ? 'No results found' : 'No reservations yet'}
                  </td>
                </tr>
              ) : (
                reservations.map((res) => (
                  <tr key={res.id}>
                    <td className="admin-table-name">
                      <span className="rep-dot">.</span>{res.name}
                    </td>
                    <td className="admin-table-address">
                      <code>{res.address}</code>
                    </td>
                    <td>{formatDate(res.createdAt)}</td>
                    <td>{formatDate(res.updatedAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="admin-footer">
          <button onClick={() => setLocation('/')} className="admin-button admin-button-secondary">
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
