const express = require('express');
const router = express.Router();
const Document = require('../models/Document');

// GET /documents - list uploaded documents, newest first
router.get('/', async (req, res) => {
  try {
    // Keep vector chunks and document metadata separate in the admin view.
    const docs = await Document.find({
      title: { $exists: true },
      docType: { $exists: true },
      status: { $exists: true },
    }).sort({ createdAt: -1 });
    res.json(docs);
  } catch (err) {
    console.error('[GET /documents]', err.message);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

module.exports = router;
