const express = require('express');
const axios = require('axios');
const router = express.Router();
const { upload } = require('../middleware/upload');
const Document = require('../models/Document');

// POST /upload (multipart/form-data)
// fields: file (PDF), title, docType, year
router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'PDF file is required (field name: "file")' });
    }

    const { title, docType, year } = req.body;
    if (!title || !docType || !year) {
      return res.status(400).json({ error: 'title, docType, and year are required' });
    }

    const doc = await Document.create({
      title,
      docType,
      year: Number(year),
      originalName: req.file.originalname,
      storedFilename: req.file.filename,
      filePath: req.file.path,
      mimeType: req.file.mimetype,
      size: req.file.size,
      status: 'uploaded',
    });

    // --- Call Python RAG service to ingest the document ---
    // POST http://localhost:8000/ingest
    // Request body:  { documentId, filePath, title, docType, year }
    // Expected response: any JSON (implementation owned by rag-service)
    try {
      doc.status = 'ingesting';
      await doc.save();

      const ragUrl = `${process.env.RAG_SERVICE_URL}/ingest`;
      const ragResponse = await axios.post(ragUrl, {
        documentId: doc._id.toString(),
        filePath: doc.filePath,
        title: doc.title,
        docType: doc.docType,
        year: doc.year,
      });

      doc.status = 'ingested';
      await doc.save();

      return res.status(201).json({
        document: doc,
        ragResponse: ragResponse.data,
      });
    } catch (ragErr) {
      doc.status = 'failed';
      doc.ingestError = ragErr.message;
      await doc.save();

      console.error('[upload] RAG ingest call failed:', ragErr.message);
      // Document record is kept even if ingest failed, so it's visible in /admin with status "failed".
      return res.status(201).json({
        document: doc,
        warning: 'Document saved, but RAG ingest call failed. Check that rag-service is running.',
        ragError: ragErr.message,
      });
    }
  } catch (err) {
    console.error('[POST /upload]', err.message);
    res.status(500).json({ error: 'Upload failed', details: err.message });
  }
});

module.exports = router;
