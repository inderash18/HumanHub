import mongoose from 'mongoose';

const mediaModerationSchema = new mongoose.Schema({
  mediaUrl: {
    type: String,
    required: true,
    index: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  },
  mediaType: {
    type: String,
    enum: ['image', 'video'],
    default: 'image'
  },
  status: {
    type: String,
    enum: ['processing', 'allowed', 'pending_review', 'blocked'],
    default: 'processing',
    index: true
  },
  c2paData: {
    hasCredentials: { type: Boolean, default: false },
    manifest: { type: mongoose.Schema.Types.Mixed, default: null }
  },
  aiSignal: {
    score: { type: Number, default: 0 },
    suspiciousFramesPct: { type: Number, default: 0 }
  },
  reason: {
    type: String,
    default: ''
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  }
}, { timestamps: true });

mediaModerationSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model('MediaModeration', mediaModerationSchema);
