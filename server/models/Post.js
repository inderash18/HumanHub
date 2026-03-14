import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 300
  },
  body: {
    type: String,
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  community: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Community',
    required: true
  },
  mediaUrls: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['pending', 'published', 'rejected', 'removed'],
    default: 'pending'
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

export default mongoose.model('Post', postSchema);
