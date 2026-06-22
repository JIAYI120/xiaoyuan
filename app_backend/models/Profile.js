const mongoose = require('mongoose');

const ProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  nickname: { type: String, default: '' },
  identity: { type: String, default: '学生' },
  bio: { type: String, default: '用文字记录校园生活的每一刻' },
  gender: { type: String, default: '' },
  birthday: { type: String, default: '' },
  location: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Profile', ProfileSchema);
