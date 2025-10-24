type WalletMethod = 'EOA'|'1271'|'6492';

async function safeJson(res: Response) {
  const txt = await res.text();
  try { return { ok: res.ok, status: res.status, json: txt ? JSON.parse(txt) : null, raw: txt }; }
  catch { return { ok: res.ok, status: res.status, json: null, raw: txt }; }
}

async function waitForSession(timeoutMs = 1500) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const r = await fetch('/api/auth/me', { credentials: 'include' });
    if (r.ok) return true;
    await new Promise(r => setTimeout(r, 150));
  }
  return false;
}

async function connectWallet(): Promise<{ address: string; method: WalletMethod; message?: string; signature?: string; nonce?: string; }> {
  const eth = (window as any).ethereum;
  if (!eth) throw new Error('No injected wallet found');
  const [addr0] = await eth.request({ method: 'eth_requestAccounts' });
  const address = String(addr0).toLowerCase();
  try {
    const ch = await fetch(`/api/auth/challenge`, { credentials:'include' });
    if (ch.ok) {
      const { nonce } = await ch.json();
      const message = `Sign this message to verify your wallet.\n\nNonce: ${nonce}`;
      const signature: string = await eth.request({ method: 'personal_sign', params: [message, address] });
      return { address, method: 'EOA', message, signature, nonce };
    }
  } catch {}
  return { address, method: 'EOA' };
}

export async function startLogin(inputName: string) {
  const name = inputName.trim().toLowerCase();
  if (!name) throw new Error('Please enter a name');

  const { address, method, message, signature, nonce } = await connectWallet();

  const body: Record<string, unknown> = { address, method };
  if (message) body.message = message;
  if (signature) body.signature = signature;
  if (nonce) body.nonce = nonce;

  const vRes = await fetch('/api/auth/verify', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    credentials: 'include',
  });
  const v = await safeJson(vRes);
  if (!v.ok) throw new Error(`/api/auth/verify ${v.status} ${v.raw || ''}`);

  if (!(await waitForSession())) throw new Error('Session cookie not visible yet');

  const luRes = await fetch(`/api/rep/lookup-wallet?address=${encodeURIComponent(address)}`, { credentials: 'include' });
  const lu = await safeJson(luRes);
  if (!lu.ok) throw new Error(`/api/rep/lookup-wallet ${lu.status} ${lu.raw || ''}`);

  const rvRes = await fetch('/api/rep/reserve', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name, address }),
    credentials: 'include',
  });
  const rv = await safeJson(rvRes);
  const reservationId = rv.json?.reservationId as string | undefined;
  
  // Enhanced error handling with user-friendly messages
  if (!rv.ok || !reservationId) {
    const errorCode = rv.json?.error || 'unknown_error';
    const errorMessage = rv.json?.message || '';
    
    // Map error codes to user-friendly messages
    const friendlyMessages: Record<string, string> = {
      'profanity': 'Name contains inappropriate language. Please choose a different name.',
      'reserved': 'This name is reserved and cannot be used.',
      'reserved_similar': 'Name is too similar to a reserved name. Please choose a different name.',
      'invalid_pattern': 'Name contains invalid patterns. Please use only letters, numbers, hyphens, and underscores.',
      'too_short': 'Name must be at least 2 characters long.',
      'too_long': 'Name must be 20 characters or less.',
      'invalid_chars': 'Name can only contain letters, numbers, hyphens, and underscores.',
      'invalid_format': 'Invalid name format. Name cannot start/end with special characters or have consecutive special characters.',
      'name_taken': 'This name is already taken. Please choose a different name.',
      'wallet_already_has_rep': 'Your wallet already has a .rep name. Each wallet can only claim one name.',
    };
    
    const userMessage = friendlyMessages[errorCode] || errorMessage || 'Unable to reserve name. Please try again.';
    throw new Error(userMessage);
  }

  window.location.href = `/wallet?name=${encodeURIComponent(name)}&rid=${encodeURIComponent(reservationId)}`;
}
