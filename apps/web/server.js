import express from 'express';
import { createServer as createViteServer } from 'vite';

const app = express();
app.use(express.json());

const reservedNames = new Set();

// Validation helpers
const isValidName = (name) => typeof name === 'string' && /^[a-z][a-z0-9-]{2,31}$/.test(name);
const isValidAddress = (addr) => typeof addr === 'string' && /^0x[a-fA-F0-9]{40}$/.test(addr);

// API routes
app.get('/api/rep/check', (req, res) => {
  const name = String(req.query.name || '').toLowerCase();
  
  if (!isValidName(name)) {
    return res.status(400).json({ ok: false, error: 'INVALID_NAME' });
  }
  
  const available = !reservedNames.has(name);
  res.json({ ok: true, name, available });
});

app.post('/api/rep/reserve', (req, res) => {
  const name = String(req.body?.name || '').toLowerCase();
  const walletAddress = String(req.body?.walletAddress || '');
  
  if (!isValidName(name)) {
    return res.status(400).json({ ok: false, error: 'INVALID_NAME' });
  }
  
  if (!isValidAddress(walletAddress)) {
    return res.status(400).json({ ok: false, error: 'INVALID_WALLET_ADDRESS' });
  }
  
  if (reservedNames.has(name)) {
    return res.status(409).json({ ok: false, error: 'ALREADY_RESERVED' });
  }
  
  reservedNames.add(name);
  const reservationId = `rid_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  res.json({ ok: true, name, walletAddress, status: 'RESERVED', reservationId });
});

// Mock wallet endpoints
app.get('/api/wallet/addresses/:userId', (req, res) => {
  res.json([
    {
      id: 1,
      userId: parseInt(req.params.userId),
      fsnName: 'demo.rep',
      blockchain: 'ethereum',
      address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1',
      label: 'Main Wallet',
      isActive: true,
      balance: '1.234',
      createdAt: new Date()
    }
  ]);
});

app.get('/api/wallet/transactions/:userId', (req, res) => {
  res.json([
    {
      id: 1,
      walletAddressId: 1,
      txHash: '0x123...abc',
      amount: '0.5',
      toAddress: '0x456...def',
      fromAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1',
      status: 'confirmed',
      createdAt: new Date(),
      note: 'Test transaction'
    }
  ]);
});

// Mock contacts endpoints
app.get('/api/contacts/:userId', (req, res) => {
  res.json([
    {
      id: 1,
      userId: parseInt(req.params.userId),
      contactFsnName: 'alice.rep',
      displayName: 'Alice',
      isFriend: true,
      addedAt: new Date().toISOString()
    }
  ]);
});

// Mock FSN message endpoints
app.get('/api/fsn/messages/inbox/:fsnName', (req, res) => {
  res.json({
    messages: [
      {
        id: 1,
        fromFsn: 'core.rep',
        toFsn: req.params.fsnName,
        message: 'Welcome to .rep! This is your secure messaging system.',
        fileUrl: null,
        fileName: null,
        fileType: null,
        timestamp: new Date().toISOString(),
        isRead: false
      }
    ]
  });
});

app.get('/api/fsn/messages/sent/:fsnName', (req, res) => {
  res.json({ messages: [] });
});

app.get('/api/fsn/contacts/:userId', (req, res) => {
  res.json({
    contacts: [
      {
        id: 1,
        userId: parseInt(req.params.userId),
        contactFsn: 'core.rep',
        createdAt: new Date().toISOString()
      }
    ]
  });
});

app.post('/api/fsn/messages/send', (req, res) => {
  res.json({
    success: true,
    message: 'Message sent successfully',
    messageId: Date.now()
  });
});

// Create Vite server in middleware mode
const vite = await createViteServer({
  server: { 
    middlewareMode: true,
    hmr: false,
  },
  appType: 'spa',
});

// Use vite's connect instance as middleware
app.use(vite.middlewares);

app.listen(5000, '0.0.0.0', () => {
  console.log('Server running on http://0.0.0.0:5000');
});
