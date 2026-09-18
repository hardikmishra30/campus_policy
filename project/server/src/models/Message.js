const mongoose = require('mongoose');

const citationSchema = new mongoose.Schema(
  {
    docTitle: String,
    section: String,
    page: Number,
  },
  { _id: false }
);

const messageSchema = new mongoose.Schema(
  {
    query: { type: String, required: true },
    answer: { type: String, required: true },
    citations: [citationSchema],
    filters: {
      docType: [String],
      year: [Number],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Message', messageSchema);
