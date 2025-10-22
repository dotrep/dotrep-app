import express from 'express';
import session from 'express-session';

const USE_CROSS_ORIGIN = false; // Vite proxy keeps same-origin

const app = express();
app.set('trust proxy', 1);
app.use(express.json());

app.use(
  session({
    name: 'rep.sid',
    secret: process.env.SESSION_SECRET || 'dev-only-not-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      path: '/',
      sameSite: (USE_CROSS_ORIGIN ? 'none' : 'lax') as 'lax' | 'none',
      secure: USE_CROSS_ORIGIN ? true : process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  })
);

declare module 'express-session' {
  interface SessionData {
    user?: { address: string; method: 'EOA' | '1271' | '6492' | 'UNKNOWN'; ts: number };
  }
}

// Auth endpoints
app.post('/api/auth/verify', async (req, res) => {
  try {
    const { address, method } = req.body ?? {};
    if (!address) return res.status(400).json({ ok: false, error: 'missing_address' });
    req.session.user = { address: String(address).toLowerCase(), method: (method as any) || 'EOA', ts: Date.now() };
    await new Promise<void>((resolve, reject) => req.session.save(err => (err ? reject(err) : resolve())));
    return res.json({ ok: true });
  } catch (e:any) {
    console.error('[verify] error', e);
    return res.status(500).json({ ok: false, error: 'verify_failed' });
  }
});

app.get('/api/auth/me', (req, res) => {
  const u = req.session?.user;
  if (u?.address) return res.json({ ok: true, user: u });
  return res.status(401).json({ ok: false });
});

// Temporary stubs (stop 404s)
app.get('/api/rep/lookup-wallet', (req, res) => {
  const address = req.query.address?.toString().toLowerCase();
  res.json({ ok: true, walletFound: !!address, address, reservationId: address ? 'stub-' + Math.random().toString(36).slice(2,8) : undefined });
});

app.post('/api/rep/reserve', (req, res) => {
  const name = String(req.body?.name || '').trim().toLowerCase();
  const address = String(req.body?.address || '').toLowerCase();
  if (!name || !address) return res.status(400).json({ ok:false, error:'missing_name_or_address' });
  const id = 'stub-' + Buffer.from(`${name}:${address}`).toString('base64').slice(0,10);
  res.json({ ok:true, reservationId:id, name, address });
});

app.get('/api/health', (_req, res) => res.json({ ok: true, env: process.env.NODE_ENV || 'development' }));

export default app;

if (import.meta && import.meta.url === `file://${process.argv[1]}`) {
  const port = Number(process.env.PORT || 9000);
  app.listen(port, () => console.log(`API listening on http://localhost:${port}`));
}
