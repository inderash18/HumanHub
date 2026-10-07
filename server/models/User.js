import mongoose from 'mongoose';

const mediaItemSchema = new mongoose.Schema({
  url: { type: String, required: true },
  publicId: { type: String, default: '' },
  provider: { type: String, default: 'cloudinary' },
  resourceType: { type: String, enum: ['image', 'video', 'raw', 'auto'], default: 'image' },
  format: { type: String, default: '' },
  bytes: { type: Number, default: 0 },
  width: { type: Number, default: 0 },
  height: { type: Number, default: 0 }
}, { _id: false });

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30,
    lowercase: true
  },
  displayName: {
    type: String,
    trim: true,
    maxlength: 50,
    default: ''
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  passwordVersion: {
    type: Number,
    default: 1
  },
  lastPasswordChange: {
    type: Date,
    default: Date.now
  },
  role: {
    type: String,
    enum: ['user', 'moderator', 'admin'],
    default: 'user'
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  isBanned: {
    type: Boolean,
    default: false
  },
  avatar: {
    type: String,
    default: ''
  },
  avatarMedia: mediaItemSchema,
  bio: {
    type: String,
    maxlength: 300,
    default: ''
  },
  followersCount: {
    type: Number,
    default: 0
  },
  followingCount: {
    type: Number,
    default: 0
  },
  postsCount: {
    type: Number,
    default: 0
  },
  privacySettings: {
    isPrivate: { type: Boolean, default: false },
    allowDirectMessages: { type: Boolean, default: true }
  },
  mfa: {
    enabled: { type: Boolean, default: false },
    secretEncrypted: { type: mongoose.Schema.Types.Mixed, default: null },
    backupCodes: [{
      codeHash: { type: String, required: true },
      used: { type: Boolean, default: false },
      usedAt: { type: Date }
    }],
    lastUsedTimestep: { type: Number, default: 0 },
    passkeys: [{
      credentialID: { type: String, required: true },
      publicKey: { type: String, required: true },
      counter: { type: Number, default: 0 },
      name: { type: String, default: 'Passkey' },
      createdAt: { type: Date, default: Date.now }
    }],
    pendingChallenge: { type: String }
  }
}, { timestamps: true });

userSchema.index({ createdAt: -1 });

export default mongoose.model('User', userSchema);
