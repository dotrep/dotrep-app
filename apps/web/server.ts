import express from 'express';
import session from 'express-session';
import cors from 'cors';
import crypto from 'crypto';
import { verifyMessage, createPublicClient, http, getAddress, isAddress, hashMessage } from 'viem';
import { base } from 'viem/chains';
import { db } from './db/client.js';
import { reservations } from './shared/schema.js';
import { eq, and, sql, or, like } from 'drizzle-orm';
import { canonicalizeName, toLowerAddress, isValidName, validateRepName } from './lib/repNameValidation.js';
import { seedMissions, getUserState, setProgress, recordHeartbeat, countHeartbeatDays } from './src/rep_phase0/lib/xp.js';
import { upsertSignalRow, listActiveNodes, awardBeacon } from './src/rep_constellation/lib/rewards.js';

const USE_CROSS_ORIGIN = false; // Using Vite proxy instead of CORS

// Base network public client for ERC-1271 smart wallet verification
const publicClient = createPublicClient({
  chain: base,
  transport: http(process.env.BASE_RPC_URL || 'https://mainnet.base.org'),
});

const ERC1271_ABI = [{
  type: 'function',
  name: 'isValidSignature',
  stateMutability: 'view',
  inputs: [{ name: 'hash', type: 'bytes32' }, { name: 'signature', type: 'bytes' }],
  outputs: [{ name: 'magicValue', type: 'bytes4' }],
}] as const;

const ERC1271_MAGIC = '0x1626ba7e' as const;

async function isDeployed(addr: `0x${string}`) {
  const code = await publicClient.getBytecode({ address: addr }).catch(() => null);
  return !!(code && code !== '0x');
}

async function verifyEOA(addr: `0x${string}`, message: string, signature: `0x${string}`) {
  return verifyMessage({ address: addr, message, signature }).catch(() => false);
}

async function verify1271(addr: `0x${string}`, message: string, signature: `0x${string}`) {
  try {
    const magic = await publicClient.readContract({
      address: addr,
      abi: ERC1271_ABI,
      functionName: 'isValidSignature',
      args: [hashMessage(message), signature],
    });
    return (typeof magic === 'string' ? magic.toLowerCase() : magic) === ERC1271_MAGIC;
  } catch {
    return false;
  }
}

// EIP-6492 magic suffix for counterfactual signature detection
const EIP6492_MAGIC_SUFFIX = '0x6492649264926492649264926492649264926492649264926492649264926492' as const;

async function verify6492(addr: `0x${string}`, message: string, signature: `0x${string}`) {
  try {
    console.log('[6492] Checking signature format');
    console.log('[6492] Signature length:', signature.length);
    console.log('[6492] Last 64 chars:', signature.slice(-64));
    console.log('[6492] Expected magic:', EIP6492_MAGIC_SUFFIX.slice(2));
    
    // Check if signature ends with EIP-6492 magic bytes
    const hasMagic = signature.toLowerCase().endsWith(EIP6492_MAGIC_SUFFIX.slice(2).toLowerCase());
    console.log('[6492] Has magic suffix:', hasMagic);
    
    if (!hasMagic) {
      return false; // Not a 6492 signature
    }

    // Remove magic suffix to get the wrapper
    const wrapperHex = signature.slice(0, -64) as `0x${string}`; // Remove 32 bytes (64 hex chars)
    
    // Decode the wrapper: (address factory, bytes factoryCalldata, bytes signature)
    const decoded = await import('viem').then(v => 
      v.decodeAbiParameters(
        [
          { name: 'factory', type: 'address' },
          { name: 'factoryCalldata', type: 'bytes' },
          { name: 'signature', type: 'bytes' }
        ],
        wrapperHex
      )
    );

    const [factory, factoryCalldata, innerSignature] = decoded;
    
    // Simulate wallet deployment and verify signature using CREATE2
    // We'll call the factory with a staticcall to simulate deployment
    try {
      // First, simulate the deployment by calling the factory
      await publicClient.call({
        to: factory,
        data: factoryCalldata,
      });
      
      // Now verify the signature via ERC-1271 against the deployed wallet
      const magic = await publicClient.readContract({
        address: addr,
        abi: ERC1271_ABI,
        functionName: 'isValidSignature',
        args: [hashMessage(message), innerSignature as `0x${string}`],
        // Use state override to simulate the deployed contract
        stateOverride: [
          {
            address: addr,
            stateDiff: []
          }
        ] as any
      });
      
      return (typeof magic === 'string' ? magic.toLowerCase() : magic) === ERC1271_MAGIC;
    } catch (callError) {
      console.error('[6492] Contract call failed:', callError);
      return false;
    }
  } catch (e) {
    console.error('[6492] Verification error:', e);
    return false;
  }
}

async function verifySigSmart({
  address, message, signature,
}: {
  address: string; message: string; signature: `0x${string}`;
}): Promise<'EOA'|'1271'|'6492'|'UNKNOWN'> {
  if (!isAddress(address)) throw new Error('invalid_address');
  const addr = getAddress(address.toLowerCase());

  if (await isDeployed(addr)) {
    // Deployed smart account → EIP-1271
    console.log('[verifySigSmart] Address is deployed, trying EIP-1271 verification');
    const ok1271 = await verify1271(addr, message, signature);
    if (ok1271) {
      console.log('[verifySigSmart] EIP-1271 verification succeeded');
      return '1271';
    }
    
    // EIP-1271 failed, try EOA as fallback (edge case: might be regular signature)
    console.warn('[verifySigSmart] EIP-1271 verification failed, trying EOA fallback');
    const okEOA = await verifyEOA(addr, message, signature);
    if (okEOA) {
      console.log('[verifySigSmart] EOA fallback verification succeeded');
      return 'EOA';
    }
    
    // All verification methods failed for deployed contract
    console.error('[verifySigSmart] All verification methods failed for deployed contract');
    console.warn('[verifySigSmart] ACCEPTING SIGNATURE AS UNKNOWN FOR DEVELOPMENT');
    return 'UNKNOWN';
  } else {
    // Not deployed - could be EOA or counterfactual smart account
    console.log('[verifySigSmart] Address not deployed, trying verification methods');
    
    // Check if signature has EIP-6492 magic bytes
    const has6492Magic = signature.toLowerCase().endsWith(EIP6492_MAGIC_SUFFIX.slice(2).toLowerCase());
    console.log('[verifySigSmart] Has EIP-6492 magic:', has6492Magic);
    
    if (!has6492Magic) {
      // No 6492 magic, try EOA verification
      const okEOA = await verifyEOA(addr, message, signature);
      if (okEOA) {
        console.log('[verifySigSmart] EOA verification succeeded');
        return 'EOA';
      }
      
      // EOA verification failed
      console.error('[verifySigSmart] EOA verification failed for non-6492 signature');
      console.warn('[verifySigSmart] ACCEPTING SIGNATURE AS UNKNOWN FOR DEVELOPMENT');
      return 'UNKNOWN';
    }
    
    // Has 6492 magic - this is a counterfactual smart wallet signature
    // Try 6492 verification, but be more lenient if it fails
    const ok6492 = await verify6492(addr, message, signature);
    if (ok6492) {
      console.log('[verifySigSmart] EIP-6492 verification succeeded');
      return '6492';
    }
    
    // 6492 verification failed, but let's try EOA as a fallback
    // (in case the signature was wrapped but is actually just an EOA)
    console.warn('[verifySigSmart] EIP-6492 verification failed, trying EOA fallback');
    const okEOA = await verifyEOA(addr, message, signature);
    if (okEOA) {
      console.log('[verifySigSmart] EOA fallback verification succeeded');
      return 'EOA';
    }
    
    // All verification methods failed
    // For development/testing, we'll accept the signature as UNKNOWN
    // In production, you might want to throw an error instead
    console.error('[verifySigSmart] All verification methods failed for 6492 signature');
    console.warn('[verifySigSmart] ACCEPTING SIGNATURE AS UNKNOWN FOR DEVELOPMENT');
    return 'UNKNOWN';
  }
}

const app = express();
app.set('trust proxy', 1);

app.use(express.json());

app.use(
  session({
    name: 'rep.sid',
    secret: process.env.SESSION_SECRET || 'dev-only-not-secret',
    resave: false,
    saveUninitialized: true,   // Create session immediately  
    cookie: {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',    // same-origin setup via Vite proxy
      secure: !!process.env.REPLIT_DOMAINS,  // Replit always uses HTTPS
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  })
);

declare module 'express-session' {
  interface SessionData {
    user?: { address: string; method: 'EOA' | '1271' | '6492' | 'UNKNOWN'; ts: number };
    challenge?: { nonce: string; timestamp: number };
  }
}

// Auth endpoints
app.get('/api/auth/challenge', async (req, res) => {
  try {
    // Generate a cryptographically random nonce
    const nonce = crypto.randomBytes(32).toString('hex');
    const timestamp = Date.now();
    
    // Store in session
    req.session.challenge = { nonce, timestamp };
    await new Promise<void>((resolve, reject) => req.session.save(err => (err ? reject(err) : resolve())));
    
    return res.json({ ok: true, nonce, timestamp });
  } catch (e: any) {
    console.error('[challenge] error', e);
    return res.status(500).json({ ok: false, error: 'challenge_failed' });
  }
});

app.post('/api/auth/verify', async (req, res) => {
  try {
    const { address, message, signature, nonce } = req.body ?? {};
    
    if (!address) return res.status(400).json({ ok: false, error: 'missing_address' });
    if (!message) return res.status(400).json({ ok: false, error: 'missing_message' });
    if (!signature) return res.status(400).json({ ok: false, error: 'missing_signature' });
    if (!nonce) return res.status(400).json({ ok: false, error: 'missing_nonce' });
    
    // Validate nonce exists in session
    const storedChallenge = req.session.challenge;
    if (!storedChallenge) {
      console.error('[verify] No challenge found in session');
      return res.status(401).json({ ok: false, error: 'no_challenge' });
    }
    
    // Validate nonce matches
    if (storedChallenge.nonce !== nonce) {
      console.error('[verify] Nonce mismatch');
      return res.status(401).json({ ok: false, error: 'invalid_nonce' });
    }
    
    // Validate challenge freshness (5 minute expiration)
    const CHALLENGE_EXPIRY_MS = 5 * 60 * 1000;
    if (Date.now() - storedChallenge.timestamp > CHALLENGE_EXPIRY_MS) {
      console.error('[verify] Challenge expired');
      return res.status(401).json({ ok: false, error: 'challenge_expired' });
    }
    
    // Verify the message includes the nonce
    if (!message.includes(nonce)) {
      console.error('[verify] Message does not contain nonce');
      return res.status(401).json({ ok: false, error: 'nonce_not_in_message' });
    }
    
    // Verify signature using smart wallet verifier (supports EOA, ERC-1271, EIP-6492)
    console.log('[verify] Attempting signature verification:', { 
      address, 
      messageLength: message.length,
      signatureLength: signature.length 
    });
    
    const method = await verifySigSmart({ 
      address, 
      message, 
      signature: signature as `0x${string}` 
    });
    
    console.log('[verify] Signature verification result:', method);
    
    // Reject UNKNOWN signatures - they failed verification
    if (method === 'UNKNOWN') {
      console.error('[verify] Signature verification failed - method returned as UNKNOWN');
      return res.status(401).json({ ok: false, error: 'signature_verification_failed' });
    }
    
    // Clear the challenge to prevent replay (single-use nonce)
    delete req.session.challenge;
    
    // Signature verified - create session (MUST lowercase for DB compatibility)
    const addr = address.toLowerCase();
    req.session.user = { address: addr, method, ts: Date.now() };
    await new Promise<void>((resolve, reject) => req.session.save(err => (err ? reject(err) : resolve())));
    
    return res.json({ ok: true, method, address: addr });
  } catch (e:any) {
    console.error('[verify] error', e?.message || e);
    return res.status(401).json({ ok: false, error: String(e?.message || e) });
  }
});

app.get('/api/auth/me', (req, res) => {
  console.log('[auth/me] Session check:', {
    hasSession: !!req.session,
    hasUser: !!req.session?.user,
    sessionID: req.sessionID,
    address: req.session?.user?.address || 'none'
  });
  const u = req.session?.user;
  if (u?.address) return res.json({ ok: true, user: u });
  return res.status(401).json({ ok: false });
});

app.post('/api/auth/logout', async (req, res) => {
  try {
    if (req.session) {
      await new Promise<void>((resolve, reject) => {
        req.session.destroy((err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }
    res.clearCookie('rep.sid');
    return res.json({ ok: true });
  } catch (e: any) {
    console.error('[logout] error', e);
    return res.status(500).json({ ok: false, error: 'logout_failed' });
  }
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

    const rawName = String(req.body?.name || '').trim();
    
    // Enhanced validation with detailed error codes
    const validation = validateRepName(rawName);
    if (!validation.valid) {
      console.log('[rep/reserve] Validation failed:', { name: rawName, error: validation.errorCode, message: validation.error });
      return res.status(400).json({ 
        ok: false, 
        error: validation.errorCode || 'invalid_input',
        message: validation.error 
      });
    }
    
    const name = canonicalizeName(rawName);
    
    // Use session address, ignore any address from request body
    const address = sessionAddress;

    // SOULBOUND: Check if this wallet already owns a DIFFERENT .rep name
    const [existingByAddress] = await db
      .select()
      .from(reservations)
      .where(eq(reservations.addressLower, address))
      .limit(1)

    if (existingByAddress && existingByAddress.nameLower !== name) {
      // Wallet already owns a different .rep - reject (soulbound identity)
      return res.status(409).json({ 
        ok: false, 
        error: 'wallet_already_has_rep',
        existingName: existingByAddress.name 
      })
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

// Admin middleware - check if user is admin
function isAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const adminWallets = (process.env.ADMIN_WALLETS || '').toLowerCase().split(',').filter(Boolean);
  const userAddress = req.session?.user?.address?.toLowerCase();
  
  console.log('[isAdmin] Check:', {
    adminWalletsRaw: process.env.ADMIN_WALLETS,
    adminWallets,
    userAddress,
    isMatch: adminWallets.includes(userAddress || '')
  });
  
  if (!userAddress) {
    return res.status(401).json({ ok: false, error: 'not_authenticated' });
  }
  
  if (!adminWallets.includes(userAddress)) {
    return res.status(403).json({ ok: false, error: 'not_admin' });
  }
  
  next();
}

// Admin endpoints
app.get('/api/admin/reservations', isAdmin, async (req, res) => {
  try {
    const search = String(req.query.search || '').toLowerCase();
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const offset = Number(req.query.offset) || 0;
    
    // Build query based on search
    const results = search
      ? await db
          .select()
          .from(reservations)
          .where(
            or(
              like(reservations.nameLower, `%${search}%`),
              like(reservations.addressLower, `%${search}%`)
            )
          )
          .orderBy(sql`${reservations.createdAt} DESC`)
          .limit(limit)
          .offset(offset)
      : await db
          .select()
          .from(reservations)
          .orderBy(sql`${reservations.createdAt} DESC`)
          .limit(limit)
          .offset(offset);
    
    // Get total count
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(reservations);
    
    return res.json({
      ok: true,
      reservations: results,
      total: Number(countResult.count),
      limit,
      offset,
    });
  } catch (e: any) {
    console.error('[admin/reservations] error', e);
    return res.status(500).json({ ok: false, error: 'server_error' });
  }
});

app.get('/api/admin/stats', isAdmin, async (req, res) => {
  try {
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(reservations);
    
    const total = Number(countResult.count);
    
    // Get recent claims (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [recentResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(reservations)
      .where(sql`${reservations.createdAt} > ${oneDayAgo}`);
    
    const last24h = Number(recentResult.count);
    
    return res.json({
      ok: true,
      stats: {
        totalClaims: total,
        last24h,
      },
    });
  } catch (e: any) {
    console.error('[admin/stats] error', e);
    return res.status(500).json({ ok: false, error: 'server_error' });
  }
});

// Phase 0 Missions API Routes

// Seed missions into database (idempotent)
app.post('/api/rep_phase0/seed', async (_req, res) => {
  try {
    await seedMissions();
    return res.json({ ok: true });
  } catch (e: any) {
    console.error('[phase0/seed] error', e);
    return res.status(500).json({ ok: false, error: e?.message || 'seed_failed' });
  }
});

// Get user's mission state
app.get('/api/rep_phase0/state', async (req, res) => {
  try {
    const user = req.session?.user;
    if (!user?.address) {
      return res.status(401).json({ ok: false, error: 'not_authenticated' });
    }
    
    const state = await getUserState(user.address);
    return res.json({ ok: true, state });
  } catch (e: any) {
    console.error('[phase0/state] error', e);
    return res.status(500).json({ ok: false, error: e?.message || 'state_error' });
  }
});

// Update mission progress
app.post('/api/rep_phase0/progress', async (req, res) => {
  try {
    const user = req.session?.user;
    if (!user?.address) {
      return res.status(401).json({ ok: false, error: 'not_authenticated' });
    }
    
    const { action, mission, meta } = req.body || {};
    
    if (!action || !mission) {
      return res.status(400).json({ ok: false, error: 'invalid_input' });
    }
    
    // Server-side validation for "go-live" mission
    if (mission === 'go-live' && action === 'complete') {
      const from = new Date(Date.now() - 6 * 24 * 3600 * 1000).toISOString().slice(0, 10);
      const days = await countHeartbeatDays(user.address, from);
      if (days < 3) {
        return res.status(400).json({ ok: false, error: 'require_3_days_login' });
      }
    }
    
    await setProgress(user.address, mission, action === 'complete' ? 'completed' : 'available', meta);
    return res.json({ ok: true });
  } catch (e: any) {
    console.error('[phase0/progress] error', e);
    return res.status(400).json({ ok: false, error: e?.message || 'progress_error' });
  }
});

// Record daily heartbeat
app.post('/api/rep_phase0/heartbeat', async (req, res) => {
  try {
    const user = req.session?.user;
    if (!user?.address) {
      return res.status(401).json({ ok: false, error: 'not_authenticated' });
    }
    
    const today = new Date().toISOString().slice(0, 10);
    await recordHeartbeat(user.address, today);
    return res.json({ ok: true });
  } catch (e: any) {
    console.error('[phase0/heartbeat] error', e);
    return res.status(500).json({ ok: false, error: e?.message || 'heartbeat_error' });
  }
});

// Constellation Map API endpoints
app.get('/api/constellation/signal-map', async (req, res) => {
  try {
    if (!process.env.CONSTELLATION_ENABLED) {
      return res.json({ ok: true, data: [] });
    }

    // If logged in, mark user as "seen"
    const user = req.session?.user;
    if (user?.address) {
      try {
        const lookupRes = await db
          .select()
          .from(reservations)
          .where(eq(reservations.addressLower, user.address.toLowerCase()))
          .limit(1);
        
        const repName = lookupRes[0]?.name || null;
        await upsertSignalRow({
          wallet: user.address,
          repName,
          seenAt: Date.now(),
        });
      } catch (e) {
        console.error('[signal-map] Failed to upsert signal:', e);
      }
    }

    const data = await listActiveNodes(Date.now());
    return res.json({ ok: true, data });
  } catch (e: any) {
    console.error('[signal-map] error', e);
    return res.status(500).json({ ok: false, error: e?.message || 'signal_error' });
  }
});

app.post('/api/constellation/beacon', async (req, res) => {
  try {
    const user = req.session?.user;
    if (!user?.address) {
      return res.status(401).json({ ok: false, error: 'not_authenticated' });
    }

    if (!process.env.CONSTELLATION_ENABLED) {
      return res.status(400).json({ ok: false, error: 'feature_disabled' });
    }

    const lookupRes = await db
      .select()
      .from(reservations)
      .where(eq(reservations.addressLower, user.address.toLowerCase()))
      .limit(1);
    
    const repName = lookupRes[0]?.name || null;
    
    await upsertSignalRow({
      wallet: user.address,
      repName,
      seenAt: Date.now(),
    });

    const awarded = await awardBeacon(user.address, 25);
    
    if (!awarded) {
      return res.status(400).json({ ok: false, error: 'already_claimed' });
    }

    return res.json({ ok: true, xpAwarded: 25 });
  } catch (e: any) {
    console.error('[beacon] error', e);
    return res.status(400).json({ ok: false, error: e?.message || 'beacon_error' });
  }
});

app.get('/api/health', (_req, res) => res.json({ ok: true, env: process.env.NODE_ENV || 'development' }));

export default app;

if (import.meta && import.meta.url === `file://${process.argv[1]}`) {
  const port = Number(process.env.PORT || 9000);
  app.listen(port, () => console.log(`API listening on http://localhost:${port}`));
}
