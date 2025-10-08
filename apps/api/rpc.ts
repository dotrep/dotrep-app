const P = process.env.BASE_RPC_PRIMARY || "https://api.developer.coinbase.com/rpc/base";
const S = process.env.BASE_RPC_SECONDARY || "";
const TIMEOUT = Number(process.env.RPC_TIMEOUT_MS || 4000);
const RETRIES = Number(process.env.RPC_MAX_RETRIES || 2);
async function post(ep, body) {
  const res = await fetch(ep, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body), signal: AbortSignal.timeout(TIMEOUT) });
  if (!res.ok) throw new Error(String(res.status));
  return res.json();
}
export async function rpc(method, params = []) {
  const eps = [P, ...(S ? [S] : [])];
  for (const ep of eps) {
    try { return await post(ep, { jsonrpc: "2.0", id: 1, method, params }); }
    catch (e) { /* try next / backoff */ for (let i=0;i<RETRIES;i++) await new Promise(r=>setTimeout(r,300*(i+1))); }
  }
  throw new Error("RPC failed (exhausted endpoints)");
}
