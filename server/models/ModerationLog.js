import mongoose from 'mongoose';

const moderationLogSchema = new mongoose.Schema({
  moderator: {
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
    enum: ['post', 'comment', 'user'],
    required: true
  },
  action: {
    type: String,
    enum: ['approve', 'reject', 'ban', 'warn', 'remove'],
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  aiScoresAtTime: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, { timestamps: true });

export default mongoose.model('ModerationLog', moderationLogSchema);
