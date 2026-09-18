const express = require('express');
const router = express.Router();
const Document = require('../models/Document');

// GET /documents - list uploaded documents, newest first
router.get('/', async (req, res) => {
  try {
    const docs = await Document.find().sort({ createdAt: -1 });
    res.json(docs);
  } catch (err) {
    console.error('[GET /documents]', err.message);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

module.exports = router;
