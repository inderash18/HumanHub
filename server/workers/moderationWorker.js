import redis from '../config/redis.js';
import Post from '../models/Post.js';
import MediaAnalysis from '../models/MediaAnalysis.js';
import { analyzeText, analyzeBehavior } from '../services/detectionService.js';
import { getIO } from '../socket/socketHandler.js';

/**
 * Process a post from the moderation queue.
 * Integrates real MediaAnalysis decisions directly.
 */
export async function processQueueItem() {
  let post = null;

  // 1. Try Redis queue pop if Redis is configured
  if (redis) {
    try {
      const item = await redis.rpop('moderation:queue');
      if (item) {
        const { postId } = JSON.parse(item);
        if (postId) {
          post = await Post.findOne({ _id: postId, status: 'pending_review' });
        }
      }
    } catch {}
  }

  // 2. MongoDB Fallback
  if (!post) {
    try {
      post = await Post.findOne({
        status: 'pending_review',
        $or: [
          { 'detectionScores.text': { $exists: false } },
          { 'detectionScores.text.status': { $ne: 'ok' } }
        ]
      }).sort({ createdAt: 1 });
    } catch {}
  }

  if (!post) return;

  const postId = post._id;

  try {
    // 1. Check associated MediaAnalysis records
    let mediaApproved = true;
    let mediaBlocked = false;
    let mediaBlockReason = '';
    let mediaHeld = false;

    if (post.mediaUrls && post.mediaUrls.length > 0) {
      const analyses = await MediaAnalysis.find({
        mediaUrl: { $in: post.mediaUrls }
      });

      for (const url of post.mediaUrls) {
        const cleanUrl = url.split('#')[0];
        const match = analyses.find(a => a.mediaUrl === cleanUrl);
        if (!match || match.publicationDecision !== 'ALLOWED') {
          mediaApproved = false;
          if (match?.publicationDecision === 'BLOCKED') {
            mediaBlocked = true;
            mediaBlockReason = match.decisionReason || 'Prohibited AI-generated media detected.';
          } else {
            mediaHeld = true;
          }
        }
      }
    }

    // 2. Text and behavior analysis
    const [text, bot] = await Promise.all([
      analyzeText(post.body || post.caption),
      analyzeBehavior(post.author)
    ]);

    let finalStatus = 'pending_review';
    let modError = '';

    if (mediaBlocked) {
      finalStatus = 'blocked';
      modError = mediaBlockReason;
    } else if (text.status === 'ok' && text.score >= 0.8) {
      finalStatus = 'blocked';
      modError = 'Text content flagged by automated policy.';
    } else if (mediaApproved && (!text.status || text.status !== 'ok' || text.score < 0.3)) {
      finalStatus = 'published';
    } else if (mediaHeld) {
      finalStatus = 'pending_review';
      modError = 'Media held for moderator review.';
    }

    const updated = await Post.findOneAndUpdate(
      { _id: postId, status: 'pending_review' },
      {
        $set: {
          status: finalStatus,
          detectionScores: { text, bot },
          moderationError: modError
        }
      },
      { new: true }
    );

    if (updated) {
      getIO()?.to('user_' + post.author).emit('post:verified', {
        postId,
        status: finalStatus,
        moderationError: modError
      });
    }
  } catch (err) {
    if (postId) {
      await Post.updateOne(
        { _id: postId, status: 'pending_review' },
        { $set: { moderationError: 'Automated verification pending moderator review.' } }
      );
    }
  }
}

let timer;
async function tick() {
  try {
    await processQueueItem();
  } catch {
    // Keep running
  }
  timer = setTimeout(tick, 2000);
  if (timer.unref) timer.unref();
}

export function startWorker() {
  if (!timer) {
    timer = setTimeout(tick, 0);
    if (timer.unref) timer.unref();
  }
}
