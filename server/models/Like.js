import mongoose from 'mongoose';

const likeSchema = new mongoose.Schema({
  user: {
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
  }
}, { timestamps: true });

// Prevent duplicate likes
likeSchema.index({ user: 1, post: 1 }, { unique: true });

export default mongoose.model('Like', likeSchema);
