import { useState, useEffect } from 'react';

export default function LinkEchoCard() {
  const [repName, setRepName] = useState<string>('');
  const [nonce, setNonce] = useState<string>('');
  const [tweetUrl, setTweetUrl] = useState('');
  const [step, setStep] = useState<'loading' | 'ready' | 'awaiting' | 'verifying' | 'done' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [hasOpenedTwitter, setHasOpenedTwitter] = useState(false);

  useEffect(() => {
    init();
  }, []);

  async function init() {
    try {
      // Fetch user's .rep name
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      if (!res.ok) {
        setStep('error');
        setError('Not authenticated');
        return;
      }
      
      const data = await res.json();
      const address = data.user?.address;
      
      if (address) {
        const lookupRes = await fetch(`/api/rep/lookup-wallet?address=${encodeURIComponent(address)}`, {
          credentials: 'include',
        });
        const lookupData = await lookupRes.json();
        if (lookupData.ok && lookupData.name) {
          setRepName(lookupData.name);
        }
      }

      // Generate nonce
      const nonceRes = await fetch('/api/echo/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ provider: 'x' }),
      });
      const nonceData = await nonceRes.json();
      if (nonceData.ok) {
        setNonce(nonceData.nonce);
        setStep('ready');
      } else {
        setStep('error');
        setError(nonceData.error || 'Failed to initialize');
      }
    } catch (e: any) {
      setStep('error');
      setError(e?.message || 'Initialization failed');
    }
  }

  function openTwitterIntent() {
    if (!repName || !nonce) return;
    
    const tweetText = `Just claimed my .${repName} identity on Base! 🔵 

#dotrep
Proof: ${nonce}`;
    const intentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    window.open(intentUrl, '_blank', 'width=550,height=420');
    setStep('awaiting');
    setHasOpenedTwitter(true);
  }

  async function verify() {
    if (!tweetUrl || !nonce) return;
    setError(null);
    setStep('verifying');
    try {
      const r = await fetch('/api/echo/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ provider: 'x', tweetUrl, nonce }),
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
        body: JSON.stringify({ action: 'complete', mission: 'link-echo', meta: { provider: 'x', handle: j.handle } }),
      });
    } catch (e: any) {
      setError(e?.message || 'Network error');
      setStep('error');
    }
  }

  if (step === 'loading') {
    return (
      <div style={{ marginTop: '1rem', opacity: 0.7, fontSize: '0.9rem' }}>
        Loading...
      </div>
    );
  }

  if (step === 'done') {
    return (
      <div style={{ 
        marginTop: '1rem',
        padding: '1rem',
        borderRadius: '8px',
        background: 'rgba(0, 212, 170, 0.1)',
        border: '1px solid rgba(0, 212, 170, 0.3)',
        color: 'rgb(0, 212, 170)',
      }}>
        ✓ X account linked! Mission complete.
      </div>
    );
  }

  return (
    <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {!hasOpenedTwitter ? (
        <button
          onClick={openTwitterIntent}
          disabled={step !== 'ready'}
          style={{
            padding: '0.75rem 1.25rem',
            borderRadius: '8px',
            border: '1px solid rgba(0, 212, 170, 0.3)',
            background: step === 'ready' ? 'rgba(0, 212, 170, 0.1)' : 'rgba(100, 100, 100, 0.1)',
            color: step === 'ready' ? 'rgb(0, 212, 170)' : '#666',
            cursor: step === 'ready' ? 'pointer' : 'not-allowed',
            fontSize: '0.95rem',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
          }}
        >
          🐦 Link X & Share
        </button>
      ) : (
        <>
          <div style={{ 
            fontSize: '0.85rem', 
            opacity: 0.9, 
            lineHeight: '1.5',
            padding: '0.75rem',
            borderRadius: '6px',
            background: 'rgba(255, 255, 255, 0.05)',
          }}>
            ✓ Tweet window opened! After posting, paste your tweet URL below:
          </div>
          
          <input
            placeholder="https://twitter.com/.../status/... or https://x.com/.../status/..."
            value={tweetUrl}
            onChange={e => setTweetUrl(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
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
              disabled={step === 'verifying' || !tweetUrl}
              style={{
                padding: '0.75rem 1.25rem',
                borderRadius: '8px',
                border: '1px solid rgba(0, 212, 170, 0.3)',
                background: step === 'verifying' ? 'rgba(100, 100, 100, 0.3)' : 'rgba(0, 212, 170, 0.1)',
                color: step === 'verifying' ? '#666' : 'rgb(0, 212, 170)',
                cursor: step === 'verifying' || !tweetUrl ? 'not-allowed' : 'pointer',
                fontSize: '0.9rem',
                fontWeight: '500',
              }}
            >
              {step === 'verifying' ? 'Verifying...' : 'Verify & Complete'}
            </button>
            
            {error && (
              <span style={{ color: 'rgb(255, 107, 53)', fontSize: '0.85rem' }}>
                {error === 'tag_not_found' ? 'Tweet must include #dotrep' : 
                 error === 'nonce_invalid' ? 'Please use the tweet we pre-filled for you' :
                 error === 'tweet_fetch_fail' ? 'Could not fetch tweet. Make sure it\'s public!' :
                 `Error: ${error}`}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
