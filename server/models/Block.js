import mongoose from 'mongoose';

const blockSchema = new mongoose.Schema({
  blocker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  blocked: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  }
}, { timestamps: true });

blockSchema.index({ blocker: 1, blocked: 1 }, { unique: true });
blockSchema.index({ blocked: 1, blocker: 1 });

blockSchema.statics.isBlocked = async function(userA, userB) {
  if (!userA || !userB) return false;
  const count = await this.countDocuments({
    $or: [
      { blocker: userA, blocked: userB },
      { blocker: userB, blocked: userA }
    ]
  });
  return count > 0;
};

export default mongoose.model('Block', blockSchema);
