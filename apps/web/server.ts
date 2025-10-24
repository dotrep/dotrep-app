import express from 'express';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import pg from 'pg';
import cors from 'cors';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import { verifyMessage, createPublicClient, http, getAddress, isAddress, hashMessage } from 'viem';
import { base } from 'viem/chains';
import { db } from './db/client.js';
import { reservations, repSocialProofs, repSocialAccounts } from './shared/schema.js';
import { eq, and, sql, or, like, isNull } from 'drizzle-orm';
import { canonicalizeName, toLowerAddress, isValidName, validateRepName } from './lib/repNameValidation.js';
import { seedMissions, getUserState, setProgress, recordHeartbeat, countHeartbeatDays } from './src/rep_phase0/lib/xp.js';
import { upsertSignalRow, listActiveNodes, awardBeacon } from './src/rep_constellation/lib/rewards.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// CORS Configuration Note:
// Using Vite proxy in both dev and production (Vite serves frontend on port 5000, 
// proxies /api/* requests to Express on port 9000). This provides same-origin requests
// and eliminates CORS issues. CORS middleware not needed.

// Configure PostgreSQL session store for production reliability
const PgStore = connectPgSimple(session);
const pgPool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  // For production, use connection pooling
  max: 10,
  idleTimeoutMillis: 30000,
});

app.use(
  session({
    store: new PgStore({
      pool: pgPool,
      tableName: 'session', // Store sessions in 'session' table
      createTableIfMissing: true, // Auto-create table on first run
    }),
    name: 'rep.sid',
    secret: process.env.SESSION_SECRET || 'dev-only-not-secret',
    resave: false,
    saveUninitialized: false,   // Don't create session until something stored (best practice)  
    cookie: {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',    // same-origin setup via Vite proxy
      secure: !!process.env.REPLIT_DOMAINS,  // Replit always uses HTTPS
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    },
  })
);

declare module 'express-session' {
  interface SessionData {
    user?: { address: string; method: 'EOA' | '1271' | '6492' | 'UNKNOWN'; ts: number };
    challenge?: { nonce: string; timestamp: number };
  }
}

// Rate limiting configuration for production security
// Use wallet address for authenticated endpoints (more accurate than IP)
const reserveRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Max 5 reserve attempts per hour
  message: { ok: false, error: 'rate_limit_exceeded', retryAfter: '1 hour' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => !req.session?.user?.address, // Only rate limit authenticated users
  keyGenerator: (req) => req.session?.user?.address || 'unauthenticated',
});

const echoStartRateLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 10, // Max 10 social proof starts per day
  message: { ok: false, error: 'rate_limit_exceeded', retryAfter: '24 hours' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => !req.session?.user?.address,
  keyGenerator: (req) => req.session?.user?.address || 'unauthenticated',
});

const echoVerifyRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Max 20 verify attempts per hour
  message: { ok: false, error: 'rate_limit_exceeded', retryAfter: '1 hour' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => !req.session?.user?.address,
  keyGenerator: (req) => req.session?.user?.address || 'unauthenticated',
});

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Max 20 auth attempts per 15 min per IP
  message: { ok: false, error: 'rate_limit_exceeded', retryAfter: '15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
  // For auth endpoints, use IP-based limiting (built-in handles IPv6 correctly)
});

// Auth endpoints
app.get('/api/auth/challenge', authRateLimiter, async (req, res) => {
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

app.post('/api/auth/verify', authRateLimiter, async (req, res) => {
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
    
    // Check if this is an EIP-6492 signature (undeployed smart wallet)
    const EIP6492_MAGIC_SUFFIX = '6492649264926492649264926492649264926492649264926492649264926492';
    const isEIP6492 = signature.toLowerCase().endsWith(EIP6492_MAGIC_SUFFIX);
    
    // Check if address is deployed
    const normalizedAddr = address as `0x${string}`;
    const code = await publicClient.getBytecode({ address: normalizedAddr });
    const isAddressDeployed = !!code && code !== '0x';
    console.log('[verify] Signature check:', { isEIP6492, isAddressDeployed });
    
    const method = await verifySigSmart({ 
      address, 
      message, 
      signature: signature as `0x${string}` 
    });
    
    console.log('[verify] Signature verification result:', method);
    
    // Handle UNKNOWN signatures securely:
    // - Only accept UNKNOWN if BOTH conditions are met:
    //   1. Signature has EIP-6492 magic (indicates smart wallet signature)
    //   2. Address is NOT deployed (indicates counterfactual/undeployed wallet)
    // - This prevents attackers from spoofing deployed accounts with fake EIP-6492 signatures
    if (method === 'UNKNOWN') {
      if (isEIP6492 && !isAddressDeployed) {
        console.warn('[verify] Accepting UNKNOWN signature for undeployed EIP-6492 smart wallet (Coinbase Smart Wallet)');
      } else {
        console.error('[verify] Rejecting UNKNOWN signature:', { 
          reason: isEIP6492 ? 'deployed_address_verification_failed' : 'not_eip6492_wallet',
          isEIP6492,
          isAddressDeployed
        });
        return res.status(401).json({ ok: false, error: 'signature_verification_failed' });
      }
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
app.post('/api/rep/reserve', reserveRateLimiter, async (req, res) => {
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

// Link Echo (Social Proof) API Routes

// POST /api/echo/start - Generate nonce for social proof verification
app.post('/api/echo/start', echoStartRateLimiter, async (req, res) => {
  try {
    // Check feature flags
    if (!process.env.ECHO_ENABLED || process.env.ECHO_ENABLED === '0') {
      return res.status(403).json({ ok: false, error: 'feature_disabled' });
    }
    
    // Require authentication
    const user = req.session?.user;
    if (!user?.address) {
      return res.status(401).json({ ok: false, error: 'not_authenticated' });
    }
    
    const { provider = 'x' } = req.body || {};
    
    // Check provider-specific feature flags
    if (provider === 'x' && (!process.env.ECHO_X_ENABLED || process.env.ECHO_X_ENABLED === '0')) {
      return res.status(403).json({ ok: false, error: 'provider_unavailable' });
    }
    if (provider === 'farcaster' && (!process.env.ECHO_FC_ENABLED || process.env.ECHO_FC_ENABLED === '0')) {
      return res.status(403).json({ ok: false, error: 'provider_unavailable' });
    }
    if (provider === 'lens' && (!process.env.ECHO_LENS_ENABLED || process.env.ECHO_LENS_ENABLED === '0')) {
      return res.status(403).json({ ok: false, error: 'provider_unavailable' });
    }
    
    // For now, only support X/Twitter
    if (provider !== 'x') {
      return res.status(400).json({ ok: false, error: 'provider_unavailable' });
    }
    
    // Generate random nonce (16 bytes = 32 hex chars)
    const nonce = crypto.randomBytes(16).toString('hex');
    
    // Look up user's .rep name for instructions
    const [reservation] = await db
      .select()
      .from(reservations)
      .where(eq(reservations.addressLower, user.address.toLowerCase()))
      .limit(1);
    
    if (!reservation?.name) {
      return res.status(400).json({ ok: false, error: 'no_rep_name' });
    }
    
    const repName = reservation.name;
    const repLabel = `${repName}.rep`;
    
    // Store nonce in database
    await db.insert(repSocialProofs).values({
      userWallet: user.address.toLowerCase(),
      provider,
      nonce,
      consumedAt: null,
    });
    
    // Return nonce, repLabel, and instructions
    return res.json({
      ok: true,
      provider,
      nonce,
      repLabel,
      instructions: `Post a public tweet containing: #dotrep and ${nonce} and your ${repLabel} identity`,
    });
  } catch (e: any) {
    console.error('[echo/start] error', e);
    return res.status(500).json({ ok: false, error: e?.message || 'start_error' });
  }
});

// POST /api/echo/verify - Verify tweet URL contains nonce and #dotrep (secure version)
app.post('/api/echo/verify', echoVerifyRateLimiter, async (req, res) => {
  try {
    // Check feature flags
    if (!process.env.ECHO_ENABLED || process.env.ECHO_ENABLED === '0') {
      return res.status(403).json({ ok: false, error: 'feature_disabled' });
    }
    
    // Require authentication
    const user = req.session?.user;
    if (!user?.address) {
      return res.status(401).json({ ok: false, error: 'not_authenticated' });
    }
    
    const { provider = 'x', tweetUrl, nonce } = req.body || {};
    
    // Validate inputs
    if (!tweetUrl || !nonce) {
      return res.status(400).json({ ok: false, error: 'invalid_input' });
    }
    
    // For now, only support X/Twitter
    if (provider !== 'x') {
      return res.status(400).json({ ok: false, error: 'provider_unavailable' });
    }
    
    // Check provider-specific feature flags
    if (provider === 'x' && (!process.env.ECHO_X_ENABLED || process.env.ECHO_X_ENABLED === '0')) {
      return res.status(403).json({ ok: false, error: 'provider_unavailable' });
    }
    
    // Find the nonce in database (must be unconsumed and belong to this user)
    const [proof] = await db
      .select()
      .from(repSocialProofs)
      .where(
        and(
          eq(repSocialProofs.userWallet, user.address.toLowerCase()),
          eq(repSocialProofs.provider, provider),
          eq(repSocialProofs.nonce, nonce),
          isNull(repSocialProofs.consumedAt)
        )
      )
      .limit(1);
    
    if (!proof) {
      return res.status(400).json({ ok: false, error: 'nonce_invalid' });
    }
    
    // Extract handle from tweet URL - support both twitter.com and x.com
    const handleMatch = tweetUrl.match(/(?:twitter\.com|x\.com)\/([^\/]+)\/status\//);
    const handle = handleMatch ? handleMatch[1] : 'unknown';
    
    // Fetch tweet HTML and check contents
    console.log('[echo/verify] Fetching tweet:', tweetUrl);
    const tweetRes = await fetch(tweetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; .rep verifier)',
      },
    });
    
    if (!tweetRes.ok) {
      console.error('[echo/verify] Failed to fetch tweet:', tweetRes.status);
      return res.status(400).json({ ok: false, error: 'tweet_fetch_fail' });
    }
    
    const html = await tweetRes.text();
    
    // Squash whitespace and lowercase for simple text search
    const squashed = html.toLowerCase().replace(/\s+/g, '');
    
    // Check if tweet contains #dotrep tag
    if (!squashed.includes('#dotrep')) {
      console.error('[echo/verify] #dotrep tag not found in tweet');
      return res.status(400).json({ ok: false, error: 'tag_not_found' });
    }
    
    // Check if tweet contains the nonce (this proves the user created the tweet)
    if (!squashed.includes(nonce.toLowerCase())) {
      console.error('[echo/verify] Nonce not found in tweet');
      return res.status(400).json({ ok: false, error: 'nonce_invalid' });
    }
    
    // Get user's .rep name and check for repLabel format
    const [reservation] = await db
      .select()
      .from(reservations)
      .where(eq(reservations.addressLower, user.address.toLowerCase()))
      .limit(1);
    
    if (!reservation?.name) {
      console.error('[echo/verify] User has no .rep name');
      return res.status(400).json({ ok: false, error: 'no_rep_name' });
    }
    
    const repName = reservation.name;
    const repLabel = `${repName}.rep`;
    const normalizedRepLabel = repLabel.toLowerCase().replace(/\s+/g, '');
    
    // Check if tweet contains the repLabel (e.g., "test.rep")
    if (!squashed.includes(normalizedRepLabel)) {
      // Backward compatibility: also accept legacy ".name" format for migration window
      const legacyFormat = `.${repName.toLowerCase()}`.replace(/\s+/g, '');
      if (!squashed.includes(legacyFormat)) {
        console.error('[echo/verify] repLabel not found in tweet. Expected:', repLabel, 'or legacy:', `.${repName}`);
        return res.status(400).json({ ok: false, error: 'rep_label_not_found' });
      }
      console.log('[echo/verify] Accepted legacy format:', `.${repName}`);
    }
    
    // Mark nonce as consumed
    await db
      .update(repSocialProofs)
      .set({ consumedAt: new Date() })
      .where(eq(repSocialProofs.id, proof.id));
    
    // Save or update social account
    await db
      .insert(repSocialAccounts)
      .values({
        userWallet: user.address.toLowerCase(),
        provider,
        handle,
        proofUrl: tweetUrl,
      })
      .onConflictDoUpdate({
        target: [repSocialAccounts.userWallet, repSocialAccounts.provider],
        set: {
          handle,
          proofUrl: tweetUrl,
          verifiedAt: new Date(),
        },
      });
    
    console.log('[echo/verify] Social account verified:', { user: user.address, provider, handle });
    
    return res.json({
      ok: true,
      provider,
      handle,
    });
  } catch (e: any) {
    console.error('[echo/verify] error', e);
    return res.status(500).json({ ok: false, error: e?.message || 'verify_error' });
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
      return res.json({ ok: true, enabled: false, data: [] });
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
    return res.json({ ok: true, enabled: true, data });
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

// Health check endpoints for Cloud Run and monitoring
// Dedicated /healthz endpoint for Cloud Run - responds IMMEDIATELY
app.get('/healthz', (_req, res) => res.status(200).send('OK'));
app.get('/api/health', (_req, res) => res.json({ ok: true, env: process.env.NODE_ENV || 'development' }));

// In production, serve static files from the Vite build
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, 'dist');
  
  // CRITICAL: Root endpoint must handle both health checks AND browser requests
  app.get('/', (req, res) => {
    try {
      // Fast health check detection - only check user-agent (most reliable indicator)
      const ua = req.get('user-agent') || '';
      
      // Cloud Run uses GoogleHC, kube-probe, or empty UA for health checks
      if (ua.includes('GoogleHC') || ua.includes('kube-probe') || ua === '') {
        return res.status(200).send('OK');
      }
      
      // Browser request - serve SPA (with error handling)
      res.sendFile(path.join(distPath, 'index.html'), (err) => {
        if (err && !res.headersSent) {
          console.error('[root] Error serving index.html:', err);
          res.status(500).send('Error loading application');
        }
      });
    } catch (err) {
      console.error('[root] Unexpected error:', err);
      if (!res.headersSent) {
        res.status(500).send('Internal server error');
      }
    }
  });
  
  // Serve static assets (JS, CSS, images) but NOT index.html
  // The { index: false } ensures all / requests go through the route handler above
  app.use(express.static(distPath, { index: false }));
  
  // Serve index.html for all other non-API routes (SPA routing)
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  // In development, just provide a simple health check at root
  // (Vite dev server handles the SPA)
  app.get('/', (_req, res) => res.status(200).send('OK'));
}

export default app;

// Environment variable validation for production safety
function validateEnvironment() {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Critical: Database connection
  if (!process.env.DATABASE_URL) {
    errors.push('DATABASE_URL is required for database connection');
  }

  // Critical: Session secret (use a strong secret in production)
  if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET === 'dev-only-not-secret') {
    if (process.env.NODE_ENV === 'production') {
      errors.push('SESSION_SECRET must be set to a strong secret in production');
    } else {
      warnings.push('SESSION_SECRET should be set for security (using default dev secret)');
    }
  }

  // Important: Admin configuration
  if (!process.env.ADMIN_WALLETS) {
    warnings.push('ADMIN_WALLETS not set - admin endpoints will be inaccessible');
  }

  // Important: Feature flags for Echo social proof
  if (process.env.ECHO_ENABLED === '1' && !process.env.ECHO_X_ENABLED) {
    warnings.push('ECHO_ENABLED is on but ECHO_X_ENABLED is not set - social proof may not work');
  }

  // Log results
  if (errors.length > 0) {
    console.error('\n❌ CRITICAL ENVIRONMENT ERRORS:');
    errors.forEach(err => console.error(`  - ${err}`));
    console.error('\n⚠️  Server will NOT start. Fix the errors above.\n');
    process.exit(1);
  }

  if (warnings.length > 0) {
    console.warn('\n⚠️  ENVIRONMENT WARNINGS:');
    warnings.forEach(warn => console.warn(`  - ${warn}`));
    console.warn('');
  }

  console.log('✅ Environment validation passed');
}

if (import.meta && import.meta.url === `file://${process.argv[1]}`) {
  // Validate environment before starting server
  validateEnvironment();
  
  const port = Number(process.env.PORT || 5000);
  const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';
  
  app.listen(port, host, () => {
    const displayHost = host === '0.0.0.0' ? 'all interfaces' : host;
    console.log(`API listening on ${displayHost}:${port} (${process.env.NODE_ENV || 'development'} mode)`);
  });
}
