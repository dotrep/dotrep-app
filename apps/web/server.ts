// apps/web/server.ts
import express from "express";
import session from "express-session";
// import cors from 'cors'; // not needed for same-origin via Vite proxy

// Use same-origin (Vite proxies /api to this server). Leave this FALSE.
// If you truly run the API on a different origin/port over HTTPS, set TRUE and enable CORS + SameSite=None.
const USE_CROSS_ORIGIN = false;

const app = express();

// Behind a proxy/load balancer (Vercel/Render/NGINX/etc.)
app.set("trust proxy", 1);

// Enable only if you flip USE_CROSS_ORIGIN to true.
// if (USE_CROSS_ORIGIN) {
//   app.use(
//     cors({
//       origin: ['http://localhost:5173', 'https://your.site'],
//       credentials: true,
//       methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
//       allowedHeaders: ['Content-Type', 'Authorization'],
//     })
//   );
// }

app.use(express.json());

// ---- SESSION CONFIG ----
if (!process.env.SESSION_SECRET && process.env.NODE_ENV === "production") {
  throw new Error("SESSION_SECRET is required in production");
}

app.use(
  session({
    name: "rep.sid",
    secret: process.env.SESSION_SECRET || "dev-only-not-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      path: "/",
      sameSite: (USE_CROSS_ORIGIN ? "none" : "lax") as "lax" | "none",
      secure: USE_CROSS_ORIGIN
        ? true // SameSite=None requires Secure (HTTPS)
        : process.env.NODE_ENV === "production", // http dev -> false
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    },
  }),
);

// ---- Type augmentation (optional) ----
declare module "express-session" {
  interface SessionData {
    user?: {
      address: string;
      method: "EOA" | "1271" | "6492" | "UNKNOWN";
      ts: number;
    };
  }
}

// ---- AUTH ENDPOINTS ----

// Persist session after signature verification upstream.
// Body: { address: string, method?: 'EOA'|'1271'|'6492' }
app.post("/api/auth/verify", async (req, res) => {
  try {
    const { address, method } = req.body ?? {};
    if (!address)
      return res.status(400).json({ ok: false, error: "missing_address" });

    req.session.user = {
      address: String(address).toLowerCase(),
      method: (method as any) || "EOA",
      ts: Date.now(),
    };

    await new Promise<void>((resolve, reject) => {
      req.session.save((err) => (err ? reject(err) : resolve()));
    });

    return res.json({ ok: true });
  } catch (e) {
    console.error("[verify] error", e);
    return res.status(500).json({ ok: false, error: "verify_failed" });
  }
});

// Returns 200 if a session exists, else 401.
app.get("/api/auth/me", (req, res) => {
  const u = req.session?.user;
  if (u?.address) return res.json({ ok: true, user: u });
  return res.status(401).json({ ok: false });
});

// ---- Optional health check ----
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, env: process.env.NODE_ENV || "development" });
});

// ---- Export for tests/integration ----
export default app;

// Run standalone with: npx tsx apps/web/server.ts
if (import.meta && import.meta.url === `file://${process.argv[1]}`) {
  const port = Number(process.env.PORT || 4000);
  app.listen(port, () => {
    console.log(`.rep web server listening on http://localhost:${port}`);
  });
}
// --- Temporary stub until the real lookup-wallet is implemented ---
app.get("/api/rep/lookup-wallet", (req, res) => {
  const address = req.query.address?.toString().toLowerCase();
  console.log("[lookup-wallet] address:", address);
  // Return a fake response so frontend sees something valid
  res.json({
    ok: true,
    walletFound: true,
    address,
    reservationId: "stub-" + Math.random().toString(36).slice(2, 8),
  });
});
