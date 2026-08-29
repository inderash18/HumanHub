import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },
  otpHash: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['register', 'forgot_password', 'email_change'],
    default: 'register'
  },
  tempUserData: {
    username: String,
    displayName: String,
    passwordHash: String
  },
  resendAttempts: {
    type: Number,
    default: 0
  },
  lastSentAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 } // MongoDB TTL index: documents are automatically removed at expiresAt
  }
}, { timestamps: true });

otpSchema.index({ email: 1, type: 1 });

export default mongoose.model('OTP', otpSchema);
