import express from 'express';
import session from 'express-session';
import { db } from './db/client.js';
import { reservations } from './db/schema.js';
import { eq, and } from 'drizzle-orm';
import { canonicalizeName, toLowerAddress, isValidName } from './lib/repValidation.js';

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

// GET /api/rep/check?name=... - Check name availability
app.get('/api/rep/check', async (req, res) => {
  try {
    const name = canonicalizeName(String(req.query.name || ''))
    
    if (!name || !isValidName(name)) {
      return res.json({ ok: true, available: false })
    }

    const [existing] = await db
      .select()
      .from(reservations)
      .where(eq(reservations.nameLower, name))
      .limit(1)

    return res.json({
      ok: true,
      available: !existing,
    })
  } catch (e: any) {
    console.error('[check] error', e)
    res.status(500).json({ ok: false, error: 'server_error' })
  }
})

// GET /api/rep/lookup-wallet?address=0x...
app.get('/api/rep/lookup-wallet', async (req, res) => {
  try {
    // Get address from session if authenticated, otherwise from query
    const queryAddress = toLowerAddress(String(req.query.address || ''))
    const sessionAddress = req.session?.user?.address
    const address = sessionAddress || queryAddress
    
    if (!address) return res.json({ ok: true, walletFound: false })

    const [row] = await db
      .select()
      .from(reservations)
      .where(eq(reservations.addressLower, address))
      .limit(1)

    if (!row) return res.json({ ok: true, walletFound: false })

    return res.json({
      ok: true,
      walletFound: true,
      address: row.address,
      reservationId: row.id,
      name: row.name,
    })
  } catch (e:any) {
    console.error('[lookup-wallet] error', e)
    res.status(500).json({ ok: false, error: 'server_error' })
  }
})

// POST /api/rep/reserve  { name, address }
app.post('/api/rep/reserve', async (req, res) => {
  try {
    // CRITICAL: Enforce session-based authentication
    const sessionAddress = req.session?.user?.address
    if (!sessionAddress) {
      return res.status(401).json({ ok: false, error: 'unauthorized' })
    }

    const name = canonicalizeName(String(req.body?.name || ''))
    
    // Use session address, ignore any address from request body
    const address = sessionAddress

    if (!name || !isValidName(name)) {
      return res.status(400).json({ ok: false, error: 'invalid_input' })
    }

    // Name already exists?
    const [existingByName] = await db
      .select()
      .from(reservations)
      .where(eq(reservations.nameLower, name))
      .limit(1)

    if (existingByName) {
      // If it's owned by the same address → idempotent success
      if (existingByName.addressLower === address) {
        return res.json({
          ok: true,
          reservationId: existingByName.id,
          name: existingByName.name,
          address: existingByName.address,
        })
      }
      // Otherwise, name taken
      return res.status(409).json({ ok: false, error: 'name_taken' })
    }

    // Insert new reservation - catch unique constraint violations
    try {
      const [created] = await db
        .insert(reservations)
        .values({
          name,
          nameLower: name,
          address,
          addressLower: address,
        })
        .returning()

      return res.json({
        ok: true,
        reservationId: created.id,
        name: created.name,
        address: created.address,
      })
    } catch (insertError: any) {
      // Handle unique constraint violations from race conditions
      if (insertError.code === '23505') { // PostgreSQL unique violation
        return res.status(409).json({ ok: false, error: 'name_taken' })
      }
      throw insertError
    }
  } catch (e: any) {
    console.error('[reserve] error', e)
    res.status(500).json({ ok: false, error: 'server_error' })
  }
});

app.get('/api/health', (_req, res) => res.json({ ok: true, env: process.env.NODE_ENV || 'development' }));

export default app;

if (import.meta && import.meta.url === `file://${process.argv[1]}`) {
  const port = Number(process.env.PORT || 9000);
  app.listen(port, () => console.log(`API listening on http://localhost:${port}`));
}
