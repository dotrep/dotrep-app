import express from 'express';
import { createServer as createViteServer } from 'vite';
import { db } from './shared/db.js';
import { repReservations, fsnMessages, contacts, vaultItems, chatHistory, users, fsnDomains, walletAddresses, transactions } from './shared/schema.js';
import { eq, and, or, desc } from 'drizzle-orm';
import { PinataSDK } from 'pinata';
import { Blob } from 'buffer';
import multer from 'multer';
import OpenAI from 'openai';

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

const upload = multer({ storage: multer.memoryStorage() });

const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_API_KEY || '',
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

const isValidName = (name) => typeof name === 'string' && /^[a-z][a-z0-9-]{2,31}$/.test(name);
const isValidAddress = (addr) => typeof addr === 'string' && /^0x[a-fA-F0-9]{40}$/.test(addr);

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
    const name = String(req.body?.name || '').toLowerCase();
    const walletAddress = String(req.body?.walletAddress || '');
    
    if (!isValidName(name)) {
      return res.status(400).json({ ok: false, error: 'INVALID_NAME' });
    }
    
    if (!isValidAddress(walletAddress)) {
      return res.status(400).json({ ok: false, error: 'INVALID_WALLET_ADDRESS' });
    }
    
    // CRITICAL: Reject if wallet address not provided (prevents bypass)
    if (!walletAddress || walletAddress === '' || walletAddress === '0x0000000000000000000000000000000000000000') {
      return res.status(401).json({ ok: false, error: 'WALLET_NOT_CONNECTED' });
    }
    
    const existing = await db.select().from(repReservations).where(eq(repReservations.name, name)).limit(1);
    if (existing.length > 0) {
      return res.status(409).json({ ok: false, error: 'ALREADY_RESERVED' });
    }
    
    const reservationId = `rid_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    
    await db.insert(repReservations).values({
      id: reservationId,
      name,
      walletAddress,
      linked: false,
    });

    await db.insert(users).values({
      address: walletAddress,
      name,
      streak: 0,
      xpMirror: 0,
    }).onConflictDoNothing();

    await db.insert(fsnDomains).values({
      address: walletAddress,
      name,
    }).onConflictDoNothing();

    await db.insert(walletAddresses).values({
      ownerAddress: walletAddress,
      fsnName: name,
      blockchain: 'base',
      label: 'Main Wallet',
      isActive: true,
      balance: '0.0',
    }).onConflictDoNothing();
    
    res.json({ ok: true, name, walletAddress, status: 'RESERVED', reservationId });
  } catch (error) {
    console.error('Reserve name error:', error);
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
