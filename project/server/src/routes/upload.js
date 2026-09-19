const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs/promises');
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
      await removeUploadedFile(req.file.path);
      return res.status(400).json({ error: 'title, docType, and year are required' });
    }

    const contentHash = await hashFile(req.file.path);
    const existingDocument = await Document.findOne({ contentHash });
    if (existingDocument) {
      await removeUploadedFile(req.file.path);
      return res.status(409).json({
        error: 'This document has already been uploaded',
        document: existingDocument,
      });
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
      contentHash,
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
    if (err.code === 11000 && err.keyPattern?.contentHash) {
      return res.status(409).json({ error: 'This document has already been uploaded' });
    }
    console.error('[POST /upload]', err.message);
    res.status(500).json({ error: 'Upload failed', details: err.message });
  }
});

async function hashFile(filePath) {
  const fileBuffer = await fs.readFile(filePath);
  return crypto.createHash('sha256').update(fileBuffer).digest('hex');
}

async function removeUploadedFile(filePath) {
  try {
    await fs.unlink(filePath);
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.error('[upload] Failed to remove duplicate file:', err.message);
    }
  }
}

module.exports = router;
