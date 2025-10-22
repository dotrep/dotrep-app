// apps/web/src/loginFlow.ts
type WalletMethod = "EOA" | "1271" | "6492";

async function safeJson(res: Response) {
  const txt = await res.text();
  try {
    return {
      ok: res.ok,
      status: res.status,
      json: txt ? JSON.parse(txt) : null,
      raw: txt,
    };
  } catch {
    return { ok: res.ok, status: res.status, json: null, raw: txt };
  }
}

async function waitForSession(timeoutMs = 1500) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const r = await fetch("/api/auth/me", { credentials: "include" });
    if (r.ok) return true;
    await new Promise((r) => setTimeout(r, 150));
  }
  return false;
}

async function connectAndOptionallySign(): Promise<{
  address: string;
  method: WalletMethod;
  message?: string;
  signature?: string;
}> {
  const eth = (window as any).ethereum;
  if (!eth) throw new Error("No injected wallet found");

  const [address0] = await eth.request({ method: "eth_requestAccounts" });
  const address = String(address0).toLowerCase();

  // optional challenge flow (skip silently if not present)
  try {
    const ch = await fetch(
      `/api/auth/challenge?address=${encodeURIComponent(address)}`,
      { credentials: "include" },
    );
    if (ch.ok) {
      const { challenge } = await ch.json();
      const signature: string = await eth.request({
        method: "personal_sign",
        params: [challenge, address],
      });
      return { address, method: "EOA", message: challenge, signature };
    }
  } catch {}
  return { address, method: "EOA" };
}

export async function startLogin(canonicalName: string) {
  const name = canonicalName.trim().toLowerCase();
  if (!name) throw new Error("Missing name");

  // 0) wallet connect (+ maybe sign)
  const { address, method, message, signature } =
    await connectAndOptionallySign();

  // 1) verify → sets session cookie
  const verifyBody: Record<string, unknown> = { address, method };
  if (message) verifyBody.message = message;
  if (signature) verifyBody.signature = signature;

  const vRes = await fetch("/api/auth/verify", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(verifyBody),
    credentials: "include",
  });
  const v = await safeJson(vRes);
  if (!v.ok) throw new Error(`/api/auth/verify ${v.status} ${v.raw || ""}`);

  // 2) wait for cookie
  const ok = await waitForSession();
  if (!ok) throw new Error("Session cookie not visible yet");

  // 3) lookup wallet
  const luRes = await fetch(
    `/api/rep/lookup-wallet?address=${encodeURIComponent(address)}`,
    {
      credentials: "include",
    },
  );
  const lu = await safeJson(luRes);
  if (!lu.ok)
    throw new Error(`/api/rep/lookup-wallet ${lu.status} ${lu.raw || ""}`);

  // 4) reserve (idempotent)
  const rvRes = await fetch("/api/rep/reserve", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name, address }),
    credentials: "include",
  });
  const rv = await safeJson(rvRes);
  const reservationId = rv.json?.reservationId as string | undefined;
  if (!rv.ok || !reservationId)
    throw new Error(`/api/rep/reserve ${rv.status} ${rv.raw || ""}`);

  // 5) hard redirect
  window.location.href = `/wallet?name=${encodeURIComponent(name)}&rid=${encodeURIComponent(reservationId)}`;
}
