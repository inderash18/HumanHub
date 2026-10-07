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

const storySchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  media: mediaItemSchema,
  mediaUrl: {
    type: String,
    required: true
  },
  mediaType: {
    type: String,
    enum: ['image', 'video'],
    default: 'image'
  },
  caption: {
    type: String,
    trim: true,
    maxlength: 200,
    default: ''
  },
  views: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    viewedAt: {
      type: Date,
      default: Date.now
    }
  }],
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reaction: {
      type: String,
      default: 'heart'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // Expires in 24 hours
    index: { expires: 0 } // MongoDB TTL index to auto-delete expired documents
  }
}, { timestamps: true });

storySchema.index({ author: 1, createdAt: -1 });
storySchema.index({ createdAt: -1 });

export default mongoose.model('Story', storySchema);
