import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true,
    maxlength: 300,
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
  status: {
    type: String,
    enum: ['pending', 'published', 'rejected', 'removed'],
    default: 'published',
    index: true
  },
  upvotes: {
    type: Number,
    default: 0
  },
  downvotes: {
    type: Number,
    default: 0
  },
  hotScore: {
    type: Number,
    default: 0,
    index: true
  },
  detectionScores: {
    text: {
      score: { type: Number, default: 0 },
      isAI: { type: Boolean, default: false },
      confidence: { type: Number, default: 0 }
    },
    image: {
      score: { type: Number, default: 0 },
      isAI: { type: Boolean, default: false },
      confidence: { type: Number, default: 0 }
    },
    video: {
      score: { type: Number, default: 0 },
      isAI: { type: Boolean, default: false },
      confidence: { type: Number, default: 0 }
    },
    bot: {
      score: { type: Number, default: 0 },
      isBotLikely: { type: Boolean, default: false },
      confidence: { type: Number, default: 0 }
    }
  },
  reportCount: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ community: 1, createdAt: -1 });
postSchema.index({ status: 1, hotScore: -1 });
postSchema.index({ createdAt: -1 });

export default mongoose.model('Post', postSchema);
