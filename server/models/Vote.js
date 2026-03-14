import mongoose from 'mongoose';

const voteSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  targetType: {
    type: String,
    enum: ['post', 'comment'],
    required: true
  },
  value: {
    type: Number,
    enum: [1, -1],
    required: true
  }
}, { timestamps: true });

// Ensure a user can only vote on a specific item once
voteSchema.index({ user: 1, targetId: 1, targetType: 1 }, { unique: true });

export default mongoose.model('Vote', voteSchema);
