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
  res.json({ ok: true, name, walletAddress, status: 'RESERVED' });
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
