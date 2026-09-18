const express = require('express');
const axios = require('axios');
const router = express.Router();
const Message = require('../models/Message');

// POST /chat
// Request body: { query: string, filters?: { docType?: string[], year?: number[] } }
// Response: { answer: string, citations: [{ docTitle, section, page }] }
router.post('/', async (req, res) => {
  try {
    const { query, filters } = req.body;
    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({ error: 'query is required' });
    }

    // --- Call Python RAG service ---
    // POST http://localhost:8000/retrieve_and_generate
    // Request body:  { query: string, filters: { docType: string[], year: number[] } }
    // Expected response: { answer: string, citations: [{ docTitle, section, page }] }
    const ragUrl = `${process.env.RAG_SERVICE_URL}/retrieve_and_generate`;
    const ragResponse = await axios.post(ragUrl, {
      query,
      filters: filters || {},
    });

    const { answer, citations } = ragResponse.data;

    // Optionally persist the Q&A exchange (non-fatal if it fails)
    try {
      await Message.create({
        query,
        answer,
        citations: citations || [],
        filters: filters || {},
      });
    } catch (saveErr) {
      console.error('[chat] Failed to save message history:', saveErr.message);
    }

    res.json({ answer, citations: citations || [] });
  } catch (err) {
    console.error('[POST /chat]', err.message);
    res.status(502).json({
      error: 'Failed to get response from RAG service',
      details: err.message,
    });
  }
});

module.exports = router;
