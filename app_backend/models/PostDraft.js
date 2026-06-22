const mongoose = require('mongoose');

const PostDraftSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  content: {
    type: String,
    default: '',
  },
  topic: {
    type: String,
    default: '',
  },
  images: {
    type: [String],
    default: [],
  },
}, { timestamps: true });

module.exports = mongoose.model('PostDraft', PostDraftSchema);
