import mongoose from 'mongoose';

const communityMemberSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  community: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Community',
    required: true,
    index: true
  },
  role: {
    type: String,
    enum: ['member', 'moderator', 'admin'],
    default: 'member'
  }
}, { timestamps: true });

communityMemberSchema.index({ user: 1, community: 1 }, { unique: true });

export default mongoose.model('CommunityMember', communityMemberSchema);
