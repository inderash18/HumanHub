import mongoose from 'mongoose';

const waitlistSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['user', 'investor', 'enterprise'],
    default: 'user'
  },
  message: {
    type: String,
    default: ''
  }
}, { timestamps: true });

export default mongoose.model('Waitlist', waitlistSchema);
