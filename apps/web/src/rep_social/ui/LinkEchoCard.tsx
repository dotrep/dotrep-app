import { useState } from 'react';

export default function LinkEchoCard() {
  const [nonce, setNonce] = useState<string | null>(null);
  const [handle, setHandle] = useState('');
  const [tweetUrl, setTweetUrl] = useState('');
  const [step, setStep] = useState<'idle' | 'posted' | 'verifying' | 'done' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [instructions, setInstructions] = useState<string | null>(null);

  async function start() {
    setError(null);
    try {
      const r = await fetch('/api/echo/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ provider: 'x' }),
      });
      const j = await r.json();
      if (!j.ok) {
        setError(j.error || 'start failed');
        return;
      }
      setNonce(j.nonce);
      setInstructions(j.instructions);
      setStep('idle');
    } catch (e: any) {
      setError(e?.message || 'Network error');
    }
  }

  async function verify() {
    if (!nonce || !tweetUrl || !handle) return;
    setError(null);
    setStep('verifying');
    try {
      const r = await fetch('/api/echo/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ provider: 'x', tweetUrl, nonce, handle }),
      });
      const j = await r.json();
      if (!j.ok) {
        setError(j.error || 'verify failed');
        setStep('error');
        return;
      }
      setStep('done');
      
      // Complete the Link Echo mission (+40 XP)
      fetch('/api/rep_phase0/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'complete', mission: 'link-echo', meta: { provider: 'x', handle } }),
      });
    } catch (e: any) {
      setError(e?.message || 'Network error');
      setStep('error');
    }
  }

  return (
    <div style={{ marginTop: '1rem' }}>
      {!nonce ? (
        <button
          onClick={start}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            border: '1px solid rgba(0, 212, 170, 0.3)',
            background: 'rgba(0, 212, 170, 0.1)',
            color: 'rgb(0, 212, 170)',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: '500',
          }}
        >
          Connect X
        </button>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ fontSize: '0.85rem', opacity: 0.8, lineHeight: '1.5' }}>
            <div style={{ marginBottom: '0.5rem' }}>
              <strong>Step 1:</strong> Post a public tweet that includes:
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'rgb(0, 212, 170)', marginLeft: '1rem' }}>
              #{`dotrep`}
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'rgb(0, 212, 170)', marginLeft: '1rem' }}>
              {nonce}
            </div>
            <div style={{ marginTop: '0.5rem' }}>
              <strong>Step 2:</strong> Paste your tweet URL and X handle below
            </div>
          </div>
          
          <input
            placeholder="@handle (without @)"
            value={handle}
            onChange={e => setHandle(e.target.value.replace(/^@/, ''))}
            style={{
              width: '100%',
              padding: '0.5rem',
              borderRadius: '6px',
              border: '1px solid rgba(0, 212, 170, 0.3)',
              background: 'rgba(0, 0, 0, 0.3)',
              color: '#fff',
              fontSize: '0.9rem',
            }}
          />
          
          <input
            placeholder="https://twitter.com/.../status/..."
            value={tweetUrl}
            onChange={e => setTweetUrl(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem',
              borderRadius: '6px',
              border: '1px solid rgba(0, 212, 170, 0.3)',
              background: 'rgba(0, 0, 0, 0.3)',
              color: '#fff',
              fontSize: '0.9rem',
            }}
          />
          
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button
              onClick={verify}
              disabled={step === 'verifying' || !handle || !tweetUrl}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: '1px solid rgba(0, 212, 170, 0.3)',
                background: step === 'verifying' ? 'rgba(100, 100, 100, 0.3)' : 'rgba(0, 212, 170, 0.1)',
                color: step === 'verifying' ? '#666' : 'rgb(0, 212, 170)',
                cursor: step === 'verifying' || !handle || !tweetUrl ? 'not-allowed' : 'pointer',
                fontSize: '0.9rem',
                fontWeight: '500',
              }}
            >
              {step === 'verifying' ? 'Verifying...' : 'Verify'}
            </button>
            
            {step === 'done' && (
              <span style={{ color: 'rgb(0, 212, 170)', fontSize: '0.9rem' }}>
                ✓ Linked!
              </span>
            )}
            
            {error && (
              <span style={{ color: 'rgb(255, 107, 53)', fontSize: '0.85rem' }}>
                Error: {error}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
