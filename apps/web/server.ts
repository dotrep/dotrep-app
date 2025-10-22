import express from 'express';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { createServer as createViteServer } from 'vite';
import { db } from './shared/db.js';
import { repReservations, fsnMessages, contacts, vaultItems, chatHistory, users, fsnDomains, walletAddresses, transactions } from './shared/schema.js';
import { eq, and, or, desc } from 'drizzle-orm';
import { PinataSDK } from 'pinata';
import { Blob } from 'buffer';
import multer from 'multer';
import OpenAI from 'openai';
import cors from 'cors';
import { verifyWalletSignature } from './lib/verifySignature.js';
import { canonicalize, isValidName as validateName } from './shared/validate.js';
import { normAddr } from './lib/addr.js';
import crypto from 'crypto';
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';

declare module 'express-session' {
  interface SessionData {
    userId: string;
    walletAddress: string;
    repName: string;
  }
}

const app = express();

// Enable CORS only in development with restricted origins
const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? [] // No CORS in production - same origin only
  : [
      /^https:\/\/.*\.replit\.dev$/,  // Replit preview domains
      /^https:\/\/.*\.repl\.co$/,      // Legacy Replit domains  
      'http://localhost:5000',
      'http://127.0.0.1:5000',
    ];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) return callback(null, true);
    
    // In production, block all CORS (same-origin only)
    if (process.env.NODE_ENV === 'production') {
      return callback(new Error('CORS not allowed in production'));
    }
    
    // In development, check whitelist
    const isAllowed = allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') {
        return origin === allowed;
      }
      return allowed.test(origin);
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
}));

app.use(express.json());

// Session setup with PostgreSQL storage
const PgSession = connectPgSimple(session);
app.use(
  session({
    store: new PgSession({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET || 'rep-platform-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    },
  })
);

app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

const upload = multer({ storage: multer.memoryStorage() });

// Create Base RPC client for signature verification
// This client is used by verifyMessage to handle EOA, ERC-1271, and ERC-6492 signatures
const baseClient = createPublicClient({
  chain: base,
  transport: http()
});

const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_API_KEY || '',
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

const isValidName = (name) => typeof name === 'string' && /^[a-z][a-z0-9-]{2,31}$/.test(name);
const isValidAddress = (addr) => typeof addr === 'string' && /^0x[a-fA-F0-9]{40}$/.test(addr);

// HMAC secret for challenge verification
const HMAC_SECRET = process.env.HMAC_SECRET || process.env.SESSION_SECRET || 'rep-platform-hmac-secret-change-in-production';

// Helper function to compute HMAC for challenge verification
function computeHMAC(message: string, nonce: string, address: string, expiresAt: number): string {
  const payload = `${message}|${nonce}|${address.toLowerCase()}|${expiresAt}`;
  return crypto.createHmac('sha256', HMAC_SECRET).update(payload).digest('hex');
}

// GET /api/auth/challenge - Generate HMAC challenge for claim flow
app.get('/api/auth/challenge', async (req, res) => {
  try {
    const name = canonicalize(String(req.query.name || ''));
    const address = normAddr(req.query.address as string);
    
    console.log('[CHALLENGE] Request:', { name, address });
    
    if (!validateName(name)) {
      return res.status(400).json({ ok: false, error: 'INVALID_NAME' });
    }
    
    if (!isValidAddress(address)) {
      return res.status(400).json({ ok: false, error: 'INVALID_ADDRESS' });
    }
    
    // Build exact message string
    const message = `Claim ${name}.rep on Base\n\nWallet: ${address}\nNonce: {NONCE}`;
    
    // Generate cryptographically secure nonce
    const nonce = crypto.randomUUID();
    
    // Set expiry to 10 minutes from now
    const expiresAt = Date.now() + (10 * 60 * 1000);
    
    // Compute HMAC for verification
    const mac = computeHMAC(message, nonce, address, expiresAt);
    
    // Replace {NONCE} placeholder with actual nonce in message
    const finalMessage = message.replace('{NONCE}', nonce);
    
    console.log('[CHALLENGE] Generated:', {
      nonce,
      expiresAt: new Date(expiresAt).toISOString(),
      mac: mac.substring(0, 16) + '...'
    });
    
    res.json({
      ok: true,
      message: finalMessage,
      nonce,
      expiresAt,
      mac
    });
  } catch (error) {
    console.error('[CHALLENGE] Error:', error);
    res.status(500).json({ ok: false, error: 'SERVER_ERROR', details: error.message });
  }
});

// POST /api/auth/verify - Verify wallet signature with HMAC challenge
app.post('/api/auth/verify', async (req, res) => {
  try {
    const { message, nonce, expiresAt, mac, signature } = req.body;
    const address = normAddr(req.body.address);
    
    console.log('[VERIFY] Request:', {
      address,
      nonce,
      expiresAt,
      hasMessage: !!message,
      hasSignature: !!signature,
      hasMac: !!mac
    });
    
    if (!address || !message || !nonce || !expiresAt || !mac || !signature) {
      return res.status(400).json({
        ok: false,
        error: 'MISSING_FIELDS',
        details: 'address, message, nonce, expiresAt, mac, and signature are required'
      });
    }
    
    // Address already normalized by normAddr
    const normalizedAddress = address;
    
    // Check TTL - must not be expired
    const now = Date.now();
    if (now > expiresAt) {
      console.error('[VERIFY] Challenge expired:', { now, expiresAt, diff: now - expiresAt });
      return res.status(401).json({ ok: false, error: 'CHALLENGE_EXPIRED' });
    }
    
    // Recompute HMAC and verify it matches
    const expectedMac = computeHMAC(message.replace(new RegExp(`Nonce: ${nonce}`), 'Nonce: {NONCE}'), nonce, normalizedAddress, expiresAt);
    
    if (mac !== expectedMac) {
      console.error('[VERIFY] HMAC mismatch');
      return res.status(401).json({ ok: false, error: 'INVALID_CHALLENGE' });
    }
    
    console.log('[VERIFY] HMAC verified, checking signature...');
    
    // Normalize signature: ensure 0x prefix
    let normalizedSignature = signature;
    if (!normalizedSignature.startsWith('0x')) {
      normalizedSignature = '0x' + normalizedSignature;
    }
    
    // Detect signature type for logging
    let signatureType = 'EOA (ECDSA)';
    if (normalizedSignature.length > 200) {
      // Check for EIP-6492 magic bytes at the end
      if (normalizedSignature.endsWith('6492649264926492649264926492649264926492649264926492649264926492')) {
        signatureType = 'EIP-6492 (Undeployed Smart Wallet)';
      } else {
        signatureType = 'EIP-1271 (Deployed Smart Wallet)';
      }
    }
    
    console.log('[VERIFY] Signature type detected:', signatureType);
    console.log('[VERIFY] Signature length:', normalizedSignature.length);
    
    // Verify signature using viem's publicClient.verifyMessage
    // This automatically handles:
    // - EOA signatures (standard ECDSA)
    // - ERC-1271 (deployed smart contract wallets)
    // - ERC-6492 (undeployed smart contract wallets)
    try {
      console.log('[VERIFY] Verifying with viem publicClient (supports EOA/ERC-1271/ERC-6492)...');
      
      const isValid = await baseClient.verifyMessage({
        address: normalizedAddress as `0x${string}`,
        message,
        signature: normalizedSignature as `0x${string}`,
      });
      
      if (!isValid) {
        console.error('[VERIFY] ✗ Signature verification failed');
        return res.status(401).json({ ok: false, error: 'INVALID_SIGNATURE' });
      }
      
      console.log('[VERIFY] ✓ Signature verified successfully');
      console.log('[VERIFY] Verified as:', signatureType);
      res.json({ ok: true, address: normalizedAddress });
      
    } catch (signatureError) {
      console.error('[VERIFY] ✗ Signature verification error:', signatureError);
      console.error('[VERIFY] Failed with:', {
        address: normalizedAddress,
        messageLength: message.length,
        signatureLength: normalizedSignature.length,
        signatureType
      });
      return res.status(401).json({ ok: false, error: 'INVALID_SIGNATURE' });
    }
  } catch (error) {
    console.error('[VERIFY] Error:', error);
    res.status(500).json({ ok: false, error: 'SERVER_ERROR', details: error.message });
  }
});

// Test endpoint to verify signature verification works
app.post('/api/_verifyTest', async (req, res) => {
  try {
    const { address, message, signature } = req.body;
    
    if (!address || !message || !signature) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Missing required fields: address, message, signature' 
      });
    }
    
    console.log('[VERIFY_TEST] Testing signature verification');
    console.log('[VERIFY_TEST] Address:', address);
    console.log('[VERIFY_TEST] Message:', message);
    console.log('[VERIFY_TEST] Signature:', signature);
    
    const { ok, address: normalizedAddress } = await verifyWalletSignature({
      address,
      message,
      signature: signature as `0x${string}`,
    });
    
    if (!ok) {
      console.log('[VERIFY_TEST] ✗ Signature verification failed');
      return res.status(401).json({ ok: false, error: 'Bad signature' });
    }
    
    console.log('[VERIFY_TEST] ✓ Signature verified successfully');
    console.log('[VERIFY_TEST] Normalized address:', normalizedAddress);
    
    res.json({ ok: true, address: normalizedAddress, message: 'Signature verified successfully' });
  } catch (error) {
    console.error('[VERIFY_TEST] Error:', error);
    res.status(500).json({ ok: false, error: 'Server error', details: error.message });
  }
});

app.get('/api/rep/check', async (req, res) => {
  try {
    const name = String(req.query.name || '').toLowerCase();
    
    if (!isValidName(name)) {
      return res.status(400).json({ ok: false, error: 'INVALID_NAME' });
    }
    
    const existing = await db.select().from(repReservations).where(eq(repReservations.name, name)).limit(1);
    const available = existing.length === 0;
    
    res.json({ ok: true, name, available });
  } catch (error) {
    console.error('Check name error:', error);
    res.status(500).json({ ok: false, error: 'SERVER_ERROR' });
  }
});

app.post('/api/rep/reserve', async (req, res) => {
  try {
    const name = canonicalize(String(req.body?.name || ''));
    const address = normAddr(req.body?.address);
    
    console.log('[RESERVE] Request:', { name, address });
    
    if (!validateName(name)) {
      return res.status(400).json({ ok: false, error: 'INVALID_NAME' });
    }
    
    if (!isValidAddress(address)) {
      return res.status(400).json({ ok: false, error: 'INVALID_ADDRESS' });
    }
    
    // IDEMPOTENT: Check if this exact {name, address} already exists
    const existingReservation = await db.select()
      .from(repReservations)
      .where(and(
        eq(repReservations.name, name),
        eq(repReservations.walletAddress, address)
      ))
      .limit(1);
    
    if (existingReservation.length > 0) {
      // Same name + address = return existing reservation (idempotent)
      console.log('[RESERVE] Returning existing reservation:', existingReservation[0].id);
      return res.json({
        ok: true,
        reservationId: existingReservation[0].id,
        message: 'Reservation already exists'
      });
    }
    
    // Check if name is taken by a different wallet
    const nameReservedByOther = await db.select()
      .from(repReservations)
      .where(eq(repReservations.name, name))
      .limit(1);
    
    if (nameReservedByOther.length > 0 && nameReservedByOther[0].walletAddress !== address) {
      console.log('[RESERVE] Name taken by different wallet');
      return res.status(409).json({
        ok: false,
        error: 'NAME_TAKEN',
        details: 'This name is already claimed by another wallet'
      });
    }
    
    // Check if wallet has a different name
    const walletHasDifferentName = await db.select()
      .from(repReservations)
      .where(eq(repReservations.walletAddress, address))
      .limit(1);
    
    if (walletHasDifferentName.length > 0 && walletHasDifferentName[0].name !== name) {
      console.log('[RESERVE] Wallet has different name:', walletHasDifferentName[0].name);
      return res.status(409).json({
        ok: false,
        error: 'WALLET_HAS_NAME',
        existingName: walletHasDifferentName[0].name,
        details: `Your wallet already owns ${walletHasDifferentName[0].name}.rep`
      });
    }
    
    // Create new reservation
    const reservationId = `rid_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    
    console.log('[RESERVE] Creating new reservation:', reservationId);
    
    await db.insert(repReservations).values({
      id: reservationId,
      name,
      walletAddress: address,
      linked: false,
    });

    await db.insert(users).values({
      address,
      name,
      streak: 0,
      xpMirror: 0,
    }).onConflictDoNothing();

    await db.insert(fsnDomains).values({
      address,
      name,
    }).onConflictDoNothing();

    await db.insert(walletAddresses).values({
      ownerAddress: address,
      fsnName: name,
      blockchain: 'base',
      label: 'Main Wallet',
      isActive: true,
      balance: '0.0',
    }).onConflictDoNothing();
    
    // Auto-create session after successful claim
    req.session.userId = reservationId;
    req.session.walletAddress = address;
    req.session.repName = name;
    
    console.log('[RESERVE] Session created for:', name);
    
    res.json({ ok: true, reservationId });
  } catch (error) {
    console.error('Reserve name error:', error);
    res.status(500).json({ ok: false, error: 'SERVER_ERROR' });
  }
});

// Lookup wallet to check if it has a .rep name
app.post('/api/rep/lookup-wallet', async (req, res) => {
  try {
    const walletAddress = normAddr(req.body?.walletAddress);
    
    console.log('[LOOKUP] Incoming address:', req.body?.walletAddress);
    console.log('[LOOKUP] Normalized address:', walletAddress);
    
    if (!isValidAddress(walletAddress)) {
      return res.status(400).json({ ok: false, error: 'INVALID_WALLET_ADDRESS' });
    }
    
    const reservation = await db.select().from(repReservations).where(eq(repReservations.walletAddress, walletAddress)).limit(1);
    
    console.log('[LOOKUP] Found reservation:', reservation.length > 0 ? reservation[0].name : 'none');
    
    if (reservation.length === 0) {
      return res.json({ ok: false, repName: null });
    }
    
    res.json({ ok: true, repName: reservation[0].name, reservationId: reservation[0].id });
  } catch (error) {
    console.error('Lookup wallet error:', error);
    res.status(500).json({ ok: false, error: 'SERVER_ERROR' });
  }
});

// Auth Routes
app.post('/api/auth/connect', async (req, res) => {
  try {
    const walletAddress = normAddr(req.body?.walletAddress);
    const message = String(req.body?.message || '');
    const signature = String(req.body?.signature || '');
    
    if (!isValidAddress(walletAddress)) {
      return res.status(400).json({ ok: false, error: 'INVALID_WALLET_ADDRESS' });
    }
    
    if (!message || !signature) {
      return res.status(401).json({ ok: false, error: 'SIGNATURE_REQUIRED' });
    }
    
    console.log('[AUTH CONNECT] Verifying signature for wallet:', walletAddress);
    
    // Normalize signature
    const normalizedSignature = signature.startsWith('0x') ? signature : `0x${signature}`;
    
    // Detect signature type for logging
    let sigType = 'EOA (ECDSA)';
    if (normalizedSignature.endsWith('6492649264926492649264926492649264926492649264926492649264926492')) {
      sigType = 'EIP-6492 (Undeployed Smart Wallet)';
    } else if (normalizedSignature.length > 200) {
      sigType = 'EIP-1271 (Deployed Smart Wallet)';
    }
    console.log('[AUTH CONNECT] Signature type detected:', sigType);
    console.log('[AUTH CONNECT] Signature length:', normalizedSignature.length);
    
    // Verify signature using viem's built-in support for EOA, ERC-1271, and ERC-6492
    console.log('[AUTH CONNECT] Verifying with viem publicClient (supports EOA/ERC-1271/ERC-6492)...');
    const isValid = await baseClient.verifyMessage({
      address: walletAddress as `0x${string}`,
      message,
      signature: normalizedSignature as `0x${string}`,
    });
    
    if (!isValid) {
      console.error('[AUTH CONNECT] ✗ Signature verification failed for wallet:', walletAddress);
      return res.status(401).json({ ok: false, error: 'INVALID_SIGNATURE' });
    }
    
    console.log('[AUTH CONNECT] ✓ Signature verified successfully');
    console.log('[AUTH CONNECT] Verified as:', sigType);
    
    // Check if wallet has a .rep name
    const reservation = await db.select().from(repReservations).where(eq(repReservations.walletAddress, walletAddress)).limit(1);
    if (reservation.length === 0) {
      return res.status(404).json({ ok: false, error: 'NO_REP_NAME' });
    }
    
    const { id, name } = reservation[0];
    
    // Create session
    req.session.userId = id;
    req.session.walletAddress = walletAddress;
    req.session.repName = name;
    
    console.log('[AUTH CONNECT] Session data set for:', name);
    
    // Explicitly save session before responding
    req.session.save((err) => {
      if (err) {
        console.error('[AUTH CONNECT] Session save error:', err);
        return res.status(500).json({ ok: false, error: 'SESSION_SAVE_FAILED' });
      }
      
      console.log('[AUTH CONNECT] Session saved successfully for:', name);
      res.json({ ok: true, userId: id, walletAddress, repName: name });
    });
  } catch (error) {
    console.error('[AUTH CONNECT] Error:', error);
    res.status(500).json({ ok: false, error: 'SERVER_ERROR' });
  }
});

app.get('/api/auth/me', async (req, res) => {
  try {
    if (!req.session.userId || !req.session.walletAddress || !req.session.repName) {
      return res.status(401).json({ ok: false, error: 'NOT_AUTHENTICATED' });
    }
    
    res.json({
      ok: true,
      userId: req.session.userId,
      walletAddress: req.session.walletAddress,
      repName: req.session.repName,
    });
  } catch (error) {
    console.error('Auth me error:', error);
    res.status(500).json({ ok: false, error: 'SERVER_ERROR' });
  }
});

app.post('/api/auth/logout', async (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        console.error('[AUTH] Logout error:', err);
        return res.status(500).json({ ok: false, error: 'LOGOUT_FAILED' });
      }
      res.json({ ok: true });
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ ok: false, error: 'SERVER_ERROR' });
  }
});

// User Stats endpoint for dashboard
app.get('/api/user/stats', async (req, res) => {
  try {
    if (!req.session.walletAddress) {
      return res.status(401).json({ ok: false, error: 'NOT_AUTHENTICATED' });
    }
    
    const walletAddress = req.session.walletAddress;
    
    // Get user data
    const user = await db.select().from(users).where(eq(users.address, walletAddress)).limit(1);
    
    // Get message count (signals sent)
    const messageCount = await db.select().from(fsnMessages).where(eq(fsnMessages.fromFsn, req.session.repName || ''));
    
    // Get vault items count
    const vaultCount = await db.select().from(vaultItems).where(eq(vaultItems.address, walletAddress));
    
    const userData = user[0] || { xpMirror: 0, streak: 0 };
    const xpPoints = userData.xpMirror || 0;
    const currentLoginStreak = userData.streak || 0;
    const signalsSent = messageCount.length || 0;
    const vaultItemsCount = vaultCount.length || 0;
    
    // Calculate pulse score (base 55 + XP bonus + activity bonus)
    const pulseScore = Math.min(100, 55 + Math.floor(xpPoints / 10) + (signalsSent * 2) + (vaultItemsCount * 3));
    
    // Determine beacon status
    let beaconStatus = 'locked';
    if (pulseScore >= 70 && signalsSent >= 1 && currentLoginStreak >= 3) {
      beaconStatus = signalsSent >= 5 ? 'active' : 'warming_up';
    }
    
    res.json({
      ok: true,
      pulseScore,
      xpPoints,
      currentLoginStreak,
      signalsSent,
      vaultItemsCount,
      beaconStatus,
    });
  } catch (error) {
    console.error('User stats error:', error);
    res.status(500).json({ ok: false, error: 'SERVER_ERROR' });
  }
});

app.get('/api/wallet/addresses/:userId', async (req, res) => {
  try {
    const userAddress = req.params.userId;
    
    const addresses = await db.select().from(walletAddresses).where(eq(walletAddresses.ownerAddress, userAddress));
    
    res.json(addresses.map(addr => ({
      id: addr.id,
      userId: userAddress,
      fsnName: addr.fsnName,
      blockchain: addr.blockchain,
      address: userAddress,
      label: addr.label,
      isActive: addr.isActive,
      balance: addr.balance,
      createdAt: addr.createdAt
    })));
  } catch (error) {
    console.error('Wallet addresses error:', error);
    res.status(500).json({ error: 'SERVER_ERROR' });
  }
});

app.get('/api/wallet/transactions/:userId', async (req, res) => {
  try {
    const userAddress = req.params.userId;
    
    const wallets = await db.select().from(walletAddresses).where(eq(walletAddresses.ownerAddress, userAddress));
    
    if (wallets.length === 0) {
      return res.json([]);
    }
    
    const walletIds = wallets.map(w => w.id);
    const txs = await db.select().from(transactions)
      .where(or(...walletIds.map(id => eq(transactions.walletAddressId, id))))
      .orderBy(desc(transactions.createdAt))
      .limit(50);
    
    res.json(txs.map(tx => ({
      id: tx.id,
      walletAddressId: tx.walletAddressId,
      txHash: tx.txHash,
      amount: tx.amount,
      toAddress: tx.toAddress,
      fromAddress: tx.fromAddress,
      status: tx.status,
      createdAt: tx.createdAt,
      blockHeight: tx.blockHeight,
      blockTime: tx.blockTime,
      note: tx.note
    })));
  } catch (error) {
    console.error('Wallet transactions error:', error);
    res.status(500).json({ error: 'SERVER_ERROR' });
  }
});

app.get('/api/contacts/:userId', async (req, res) => {
  try {
    const ownerAddress = req.params.userId;
    
    const userContacts = await db.select().from(contacts).where(eq(contacts.ownerAddress, ownerAddress));
    
    res.json(userContacts.map(c => ({
      id: c.id,
      userId: ownerAddress,
      contactFsnName: c.contactFsnName,
      displayName: c.displayName,
      isFriend: c.isFriend,
      addedAt: c.createdAt.toISOString()
    })));
  } catch (error) {
    console.error('Contacts error:', error);
    res.status(500).json({ error: 'SERVER_ERROR' });
  }
});

app.post('/api/contacts', async (req, res) => {
  try {
    const { userId, contactFsnName, displayName, notes, isFriend } = req.body;
    
    const result = await db.insert(contacts).values({
      ownerAddress: userId,
      contactFsnName,
      displayName,
      notes,
      isFriend: isFriend ?? true,
    }).returning();
    
    res.json(result[0]);
  } catch (error) {
    console.error('Add contact error:', error);
    res.status(500).json({ error: 'SERVER_ERROR' });
  }
});

app.delete('/api/contacts/:contactId', async (req, res) => {
  try {
    const contactId = parseInt(req.params.contactId);
    
    await db.delete(contacts).where(eq(contacts.id, contactId));
    
    res.json({ success: true });
  } catch (error) {
    console.error('Delete contact error:', error);
    res.status(500).json({ error: 'SERVER_ERROR' });
  }
});

app.get('/api/fsn/messages/inbox/:fsnName', async (req, res) => {
  try {
    const fsnName = req.params.fsnName;
    
    const messages = await db.select()
      .from(fsnMessages)
      .where(eq(fsnMessages.toFsn, fsnName))
      .orderBy(desc(fsnMessages.createdAt));
    
    res.json({
      success: true,
      messages: messages.map(m => ({
        id: m.id,
        fromFsn: m.fromFsn,
        toFsn: m.toFsn,
        message: m.message,
        fileUrl: m.fileUrl,
        fileName: m.fileName,
        fileType: m.fileType,
        timestamp: m.createdAt.toISOString(),
        isRead: m.isRead,
      }))
    });
  } catch (error) {
    console.error('Inbox error:', error);
    res.status(500).json({ success: false, error: 'SERVER_ERROR' });
  }
});

app.get('/api/fsn/messages/sent/:fsnName', async (req, res) => {
  try {
    const fsnName = req.params.fsnName;
    
    const messages = await db.select()
      .from(fsnMessages)
      .where(eq(fsnMessages.fromFsn, fsnName))
      .orderBy(desc(fsnMessages.createdAt));
    
    res.json({
      success: true,
      messages: messages.map(m => ({
        id: m.id,
        fromFsn: m.fromFsn,
        toFsn: m.toFsn,
        message: m.message,
        fileUrl: m.fileUrl,
        fileName: m.fileName,
        fileType: m.fileType,
        timestamp: m.createdAt.toISOString(),
        isRead: m.isRead,
      }))
    });
  } catch (error) {
    console.error('Sent messages error:', error);
    res.status(500).json({ success: false, error: 'SERVER_ERROR' });
  }
});

app.get('/api/fsn/contacts/:userId', async (req, res) => {
  try {
    const ownerAddress = req.params.userId;
    
    const userContacts = await db.select().from(contacts).where(eq(contacts.ownerAddress, ownerAddress));
    
    res.json({
      contacts: userContacts.map(c => ({
        id: c.id,
        userId: ownerAddress,
        contactFsn: c.contactFsnName,
        createdAt: c.createdAt.toISOString()
      }))
    });
  } catch (error) {
    console.error('FSN contacts error:', error);
    res.status(500).json({ error: 'SERVER_ERROR' });
  }
});

app.post('/api/fsn/messages/send', async (req, res) => {
  try {
    const { fromFsn, toFsn, message, fileUrl, fileName, fileType } = req.body;
    
    const result = await db.insert(fsnMessages).values({
      fromFsn,
      toFsn,
      message,
      fileUrl: fileUrl || null,
      fileName: fileName || null,
      fileType: fileType || null,
      isRead: false,
    }).returning();
    
    res.json({
      success: true,
      message: 'Message sent successfully',
      messageId: result[0].id
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ success: false, error: 'SERVER_ERROR' });
  }
});

app.put('/api/fsn/messages/read/:messageId', async (req, res) => {
  try {
    const messageId = parseInt(req.params.messageId);
    
    await db.update(fsnMessages)
      .set({ isRead: true })
      .where(eq(fsnMessages.id, messageId));
    
    res.json({ success: true });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ success: false, error: 'SERVER_ERROR' });
  }
});

app.post('/api/vault/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file provided' });
    }

    const { walletAddress, filename, mimeType } = req.body;

    if (!process.env.PINATA_API_KEY) {
      return res.status(500).json({ success: false, error: 'Pinata API key not configured' });
    }

    const blob = new Blob([req.file.buffer]);
    const file = new File([blob], filename || req.file.originalname, { 
      type: mimeType || req.file.mimetype 
    });
    
    const uploadResult = await pinata.upload.file(file);

    const result = await db.insert(vaultItems).values({
      address: walletAddress,
      cid: uploadResult.cid,
      mime: mimeType || req.file.mimetype,
      size: req.file.size,
      filename: filename || req.file.originalname,
    }).returning();

    res.json({
      success: true,
      itemId: result[0].id.toString(),
      cid: uploadResult.cid,
      requiresOnChainAnchor: false
    });
  } catch (error) {
    console.error('Vault upload error:', error);
    res.status(500).json({ success: false, error: error.message || 'Upload failed' });
  }
});

app.get('/api/vault/list', async (req, res) => {
  try {
    const { address } = req.query;

    if (!address) {
      return res.status(400).json({ success: false, error: 'Address required' });
    }

    const items = await db.select()
      .from(vaultItems)
      .where(eq(vaultItems.address, address))
      .orderBy(desc(vaultItems.createdAt));

    res.json({
      success: true,
      mode: 'STEALTH',
      items: items.map(item => ({
        itemId: item.id.toString(),
        data: {
          cid: item.cid,
          mime: item.mime,
          size: item.size,
          filename: item.filename,
        },
        createdAt: item.createdAt.toISOString(),
      }))
    });
  } catch (error) {
    console.error('Vault list error:', error);
    res.status(500).json({ success: false, error: 'Failed to load files' });
  }
});

app.get('/api/vault/stats', async (req, res) => {
  try {
    const { address } = req.query;

    if (!address) {
      return res.status(400).json({ success: false, error: 'Address required' });
    }

    const items = await db.select()
      .from(vaultItems)
      .where(eq(vaultItems.address, address));

    const totalSize = items.reduce((sum, item) => sum + item.size, 0);

    res.json({
      success: true,
      fileCount: items.length,
      totalSize,
    });
  } catch (error) {
    console.error('Vault stats error:', error);
    res.status(500).json({ success: false, error: 'Failed to load stats' });
  }
});

app.delete('/api/vault/item/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    const { walletAddress } = req.body;

    await db.delete(vaultItems)
      .where(and(
        eq(vaultItems.id, parseInt(itemId)),
        eq(vaultItems.address, walletAddress)
      ));

    res.json({ success: true });
  } catch (error) {
    console.error('Vault delete error:', error);
    res.status(500).json({ success: false, error: 'Delete failed' });
  }
});

app.post('/api/chat/openai', async (req, res) => {
  try {
    const { messages, userAddress } = req.body;

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array required' });
    }

    const userMessage = messages[messages.length - 1];
    if (userAddress && userMessage && userMessage.role === 'user') {
      await db.insert(chatHistory).values({
        userAddress,
        role: 'user',
        content: userMessage.content,
      }).catch(err => console.warn('Failed to persist user message:', err));
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages,
      max_tokens: 500,
    });

    const assistantMessage = completion.choices[0].message.content;

    if (userAddress && assistantMessage) {
      await db.insert(chatHistory).values({
        userAddress,
        role: 'assistant',
        content: assistantMessage,
      }).catch(err => console.warn('Failed to persist assistant message:', err));
    }

    res.json({ message: assistantMessage });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: error.message || 'Chat failed' });
  }
});

const vite = await createViteServer({
  server: { 
    middlewareMode: true,
    hmr: false,
  },
  appType: 'spa',
});

app.use(vite.middlewares);

app.listen(5000, '0.0.0.0', () => {
  console.log('Server running on http://0.0.0.0:5000');
});
