const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    docType: { type: String, required: true, trim: true }, // e.g. "policy", "placement", "syllabus"
    year: { type: Number, required: true },

    originalName: { type: String, required: true }, // original uploaded filename
    storedFilename: { type: String, required: true }, // filename saved on disk
    filePath: { type: String, required: true }, // path passed to RAG service
    mimeType: { type: String, default: 'application/pdf' },
    size: { type: Number },

    status: {
      type: String,
      enum: ['uploaded', 'ingesting', 'ingested', 'failed'],
      default: 'uploaded',
    },
    ingestError: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Document', documentSchema);
