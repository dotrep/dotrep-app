import { useLocation } from 'wouter';
import { useEffect, useState } from 'react';
import ConstellationCanvas from '../rep_constellation/ui/ConstellationCanvas';

export default function Map() {
  const [, setLocation] = useLocation();
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    // Check if feature is enabled
    fetch('/api/health', { credentials: 'include' })
      .then(() => setEnabled(true))
      .catch(() => setEnabled(false));
  }, []);

  if (!enabled && !process.env.CONSTELLATION_ENABLED) {
    return null;
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
      <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(0, 212, 170, 0.15)', maxWidth: '1400px', margin: '0 auto' }}>
        <ConstellationCanvas />
      </div>
    </div>
  );
}
