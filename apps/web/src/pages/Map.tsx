import { useLocation } from 'wouter';
import { useEffect, useState } from 'react';
import ConstellationCanvas from '../rep_constellation/ui/ConstellationCanvas';

export default function Map() {
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    // Check if feature is enabled via server flag
    // API returns explicit 'enabled' field when CONSTELLATION_ENABLED is set
    fetch('/api/constellation/signal-map', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        setEnabled(data.ok && data.enabled === true);
        setLoading(false);
      })
      .catch(() => {
        setEnabled(false);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '2rem', minHeight: '100vh', background: '#05111a', color: '#fff', textAlign: 'center' }}>
        Loading...
      </div>
    );
  }

  if (!enabled) {
    return (
      <div style={{ padding: '2rem', minHeight: '100vh', background: '#05111a', color: '#fff', textAlign: 'center' }}>
        <h1 style={{ marginBottom: '1rem' }}>Feature Not Available</h1>
        <p>Constellation Map is currently disabled.</p>
        <button
          onClick={() => setLocation('/rep-dashboard')}
          style={{
            marginTop: '1rem',
            padding: '0.75rem 1.5rem',
            borderRadius: '8px',
            border: '1px solid rgba(0, 212, 170, 0.4)',
            background: 'rgba(0, 212, 170, 0.1)',
            color: '#00d4aa',
            fontSize: '0.875rem',
            cursor: 'pointer',
          }}
        >
          ← Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '1rem', minHeight: '100vh', background: '#05111a' }}>
      <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: '1400px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 600, color: '#fff', margin: 0 }}>Constellation</h1>
        <button
          onClick={() => setLocation('/rep-dashboard')}
          style={{
            fontSize: '0.875rem',
            color: 'rgba(255, 255, 255, 0.7)',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '0.5rem',
          }}
        >
          ← Back to Dashboard
        </button>
      </div>
      <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(0, 212, 170, 0.15)', maxWidth: '1400px', margin: '0 auto', height: 'calc(100vh - 120px)', minHeight: '600px' }}>
        <ConstellationCanvas />
      </div>
    </div>
  );
}
