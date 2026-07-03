import mongoose from 'mongoose';

const storySchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  mediaUrl: {
    type: String,
    required: true
  },
  caption: {
    type: String,
    default: ''
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // Expires in 24 hours
    index: { expires: 0 } // MongoDB TTL index to auto-delete expired documents
  }
}, { timestamps: true });

export default mongoose.model('Story', storySchema);
