import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  reporter: {
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
  category: {
    type: String,
    enum: ['ai_generated', 'fake_news', 'spam', 'harassment', 'nsfw', 'other'],
    required: true
  },
  detail: {
    type: String,
    maxlength: 1000
  },
  status: {
    type: String,
    enum: ['open', 'resolved', 'dismissed'],
    default: 'open'
  }
}, { timestamps: true });

export default mongoose.model('Report', reportSchema);
