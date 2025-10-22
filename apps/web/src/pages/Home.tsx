// apps/web/src/Home.tsx
import React, { useCallback, useMemo, useState } from "react";

type WalletMethod = "EOA" | "1271" | "6492";

function cx(...xs: (string | false | null | undefined)[]) {
  return xs.filter(Boolean).join(" ");
}

// ---------- helpers ----------
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
  // Basic injected wallet connect (MetaMask / CB injected)
  const eth = (window as any).ethereum;
  if (!eth) throw new Error("No injected wallet found");

  const accounts: string[] = await eth.request({
    method: "eth_requestAccounts",
  });
  if (!accounts?.length) throw new Error("No account returned from wallet");
  const address = String(accounts[0]).toLowerCase();

  // Optional: if your backend exposes /api/auth/challenge, fetch+sign it.
  // If not available, we’ll proceed without signing and just rely on /api/auth/verify setting the session.
  try {
    const ch = await fetch(
      `/api/auth/challenge?address=${encodeURIComponent(address)}`,
      {
        credentials: "include",
      },
    );
    if (ch.ok) {
      const { challenge } = await ch.json();
      const signature: string = await eth.request({
        method: "personal_sign",
        params: [challenge, address],
      });
      return { address, method: "EOA", message: challenge, signature };
    }
  } catch {
    // silently ignore if no challenge endpoint
  }

  return { address, method: "EOA" };
}

// ---------- component ----------
export default function Home() {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const disabled = useMemo(() => busy || !name.trim(), [busy, name]);

  const handleLogin = useCallback(async () => {
    setBusy(true);
    try {
      console.log("[LOGIN] start");

      // 0) connect + (maybe) sign
      const { address, method, message, signature } =
        await connectAndOptionallySign();
      console.log("[LOGIN] connected address =", address);

      // 1) verify = set the session cookie server-side
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
      console.log("[verify]", v);
      if (!v.ok) throw new Error(`/api/auth/verify ${v.status} ${v.raw || ""}`);

      // 2) wait for cookie to round-trip
      const ok = await waitForSession();
      if (!ok) throw new Error("Session cookie not visible yet");

      // 3) lookup wallet (OK if this is stubbed on server)
      const luRes = await fetch(
        `/api/rep/lookup-wallet?address=${encodeURIComponent(address)}`,
        { credentials: "include" },
      );
      const lu = await safeJson(luRes);
      console.log("[lookup-wallet]", lu);
      if (!lu.ok)
        throw new Error(`/api/rep/lookup-wallet ${lu.status} ${lu.raw || ""}`);

      // 4) reserve (idempotent on server)
      const canonicalName = name.trim().toLowerCase();
      const rvRes = await fetch("/api/rep/reserve", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: canonicalName, address }),
        credentials: "include",
      });
      const rv = await safeJson(rvRes);
      console.log("[reserve]", rv);
      const reservationId =
        (rv.json && (rv.json.reservationId as string)) || undefined;
      if (!rv.ok || !reservationId) {
        throw new Error(`/api/rep/reserve ${rv.status} ${rv.raw || ""}`);
      }

      // 5) hard redirect
      const target = `/wallet?name=${encodeURIComponent(
        canonicalName,
      )}&rid=${encodeURIComponent(reservationId)}`;
      console.log("[redirect] →", target);
      window.location.href = target;
    } catch (err: any) {
      console.error("[LOGIN] error:", err?.message || err);
      alert("Login failed. Please try again.\n\n" + (err?.message || err));
    } finally {
      setBusy(false);
    }
  }, [name]);

  return (
    <div className={cx("min-h-screen flex items-center justify-center p-6")}>
      <div className={cx("w-full max-w-md rounded-2xl p-6 shadow")}>
        <h1 className="text-2xl font-semibold mb-4">
          .rep — Claim your handle
        </h1>

        <label className="block text-sm font-medium mb-1" htmlFor="rep-name">
          Name
        </label>
        <input
          id="rep-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={cx(
            "w-full rounded-lg border px-3 py-2 mb-4",
            "focus:outline-none focus:ring-2",
          )}
          placeholder="your-name"
          autoComplete="off"
        />

        <button
          onClick={handleLogin}
          disabled={disabled}
          className={cx(
            "w-full rounded-xl px-4 py-2 font-medium",
            disabled ? "opacity-50 cursor-not-allowed" : "hover:opacity-90",
            "shadow",
          )}
        >
          {busy ? "Connecting…" : "Login with wallet"}
        </button>

        <p className="text-xs opacity-70 mt-4">
          This will connect your wallet, set a session, and reserve your handle
          (idempotent). You’ll be redirected to your wallet page when complete.
        </p>
      </div>
    </div>
  );
}
