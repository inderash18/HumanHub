import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  body: {
    type: String,
    required: true,
    maxlength: 2000
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true,
    index: true
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null
  },
  depth: {
    type: Number,
    default: 0,
    max: 6
  },
  upvotes: {
    type: Number,
    default: 0
  },
  downvotes: {
    type: Number,
    default: 0
  },
  detectionScores: {
    text: {
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
  isRemoved: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

commentSchema.index({ post: 1, createdAt: 1 });
commentSchema.index({ author: 1, createdAt: -1 });

export default mongoose.model('Comment', commentSchema);
