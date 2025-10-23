import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAccount } from 'wagmi';
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
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    checkAuthAndLoad();
  }, [address, isConnected]);

  const checkAuthAndLoad = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Check if user is authenticated first
      const sessionRes = await fetch('/api/auth/me', {
        credentials: 'include',
      });

      if (!sessionRes.ok) {
        setError('Please login first');
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
        setError('Please login to access admin panel');
      } else {
        setError(err.message || 'Failed to load admin data');
      }
      setIsAuthorized(false);
    } finally {
      setLoading(false);
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
