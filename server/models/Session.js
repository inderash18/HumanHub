import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  tokenHash: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
  revokedAt: { type: Date, default: null, index: true },
  userAgent: { type: String, default: 'Unknown Device' },
  ipAddress: { type: String, default: null },
  lastActive: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('Session', sessionSchema);
