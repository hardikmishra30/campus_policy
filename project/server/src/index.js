require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const documentsRouter = require('./routes/documents');
const uploadRouter = require('./routes/upload');
const chatRouter = require('./routes/chat');

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/documents', documentsRouter);
app.use('/upload', uploadRouter);
app.use('/chat', chatRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Central error handler
app.use((err, req, res, next) => {
  console.error('[error]', err.message);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`[server] Listening on http://localhost:${PORT}`);
  });
});
