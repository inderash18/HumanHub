import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  caption: {
    type: String,
    trim: true,
    maxlength: 2200,
    default: ''
  },
  body: {
    type: String,
    default: ''
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  community: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Community',
    required: false,
    index: true
  },
  mediaUrls: [{
    type: String
  }],
  mediaType: {
    type: String,
    enum: ['text', 'image', 'video', 'mixed'],
    default: 'text'
  },
  status: {
    type: String,
    enum: ['published', 'pending_review', 'blocked'],
    default: 'published',
    index: true
  },
  likesCount: {
    type: Number,
    default: 0
  },
  commentsCount: {
    type: Number,
    default: 0
  },
  savesCount: {
    type: Number,
    default: 0
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }]
}, { timestamps: true });

postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ community: 1, createdAt: -1 });
postSchema.index({ status: 1, createdAt: -1 });
postSchema.index({ tags: 1 });

export default mongoose.model('Post', postSchema);
