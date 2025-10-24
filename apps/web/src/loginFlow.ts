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
  if (!rv.ok || !reservationId) throw new Error(`/api/rep/reserve ${rv.status} ${rv.raw || ''}`);

  window.location.href = `/wallet?name=${encodeURIComponent(name)}&rid=${encodeURIComponent(reservationId)}`;
}
