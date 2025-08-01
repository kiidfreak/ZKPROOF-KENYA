const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  comments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  category: {
    type: String,
    required: true,
    default: 'General',
    trim: true
  },
  pinned: {
    type: Boolean,
    default: false
  },
  attachments: [
    {
      filename: String,
      originalname: String,
      mimetype: String,
      size: Number
    }
  ],
  reports: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  blinded: { type: Boolean, default: false },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, {
  timestamps: true
});

module.exports = mongoose.model('Post', PostSchema); 