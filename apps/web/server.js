import express from 'express';
import { createServer as createViteServer } from 'vite';

const app = express();
app.use(express.json());

const reservedNames = new Set();

// API routes
app.get('/api/rep/check', (req, res) => {
  const { name } = req.query;
  const nameRegex = /^[a-z][a-z0-9-]{2,31}$/;
  
  if (!name || !nameRegex.test(name)) {
    return res.json({ ok: false, error: 'Invalid name format' });
  }
  
  const available = !reservedNames.has(name);
  res.json({ ok: true, name, available });
});

app.post('/api/rep/reserve', (req, res) => {
  const { name, walletAddress } = req.body;
  const nameRegex = /^[a-z][a-z0-9-]{2,31}$/;
  
  if (!name || !nameRegex.test(name)) {
    return res.status(400).json({ ok: false, error: 'Invalid name format' });
  }
  
  if (reservedNames.has(name)) {
    return res.status(400).json({ ok: false, error: 'Name already reserved' });
  }
  
  reservedNames.add(name);
  res.json({ ok: true, name, walletAddress });
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
