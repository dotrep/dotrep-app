const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;
const dist = path.resolve(__dirname, '../apps/web/dist');
app.get('/healthz', (_req, res) => res.json({ok:true}));
app.use(express.static(dist, { index: 'index.html', extensions: ['html'] }));
app.use((_req, res) => res.sendFile(path.join(dist, 'index.html')));
app.listen(PORT, () => console.log(`✅ Serving dist on :${PORT}`));
