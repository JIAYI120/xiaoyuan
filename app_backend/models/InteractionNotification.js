const mongoose = require('mongoose');

const InteractionNotificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  actor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['like', 'comment', 'bookmark', 'follow'],
    required: true,
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    default: null,
  },
  comment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null,
  },
  content: {
    type: String,
    default: '',
    trim: true,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

InteractionNotificationSchema.index({ recipient: 1, createdAt: -1 });
InteractionNotificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
InteractionNotificationSchema.index({ actor: 1, recipient: 1, type: 1, post: 1, comment: 1 });

module.exports = mongoose.model('InteractionNotification', InteractionNotificationSchema);
