import mongoose from 'mongoose';

const communitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    index: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    maxlength: 500
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  moderators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  rules: [{
    type: String
  }],
  bannerUrl: {
    type: String,
    default: ''
  },
  iconUrl: {
    type: String,
    default: ''
  },
  memberCount: {
    type: Number,
    default: 1
  },
  postCount: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

export default mongoose.model('Community', communitySchema);
