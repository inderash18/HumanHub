import redis from '../config/redis.js';
import Post from '../models/Post.js';
import { analyzeText, analyzeMedia, analyzeBehavior } from '../services/detectionService.js';
import { getIO } from '../socket/socketHandler.js';

// MongoDB retains every pending item for manual review, including failed queue jobs.
export async function processQueueItem() {
  const item = await redis.rpop('moderation:queue');
  if (!item) return;
  let postId;
  try {
    ({ postId } = JSON.parse(item));
    const post = await Post.findOne({ _id: postId, status: 'pending_review' });
    if (!post) return;
    const [text, image, bot] = await Promise.all([
      analyzeText(post.body), analyzeMedia(post.mediaUrls), analyzeBehavior(post.author)
    ]);
    const checks = [text, image, bot].filter(result => result.status === 'ok');
    const status = checks.some(result => result.score >= 0.8) ? 'blocked'
      : checks.length && checks.every(result => result.score < 0.3 && result.confidence >= 0.8)
        ? 'published' : 'pending_review';
    // A background result must never overwrite a moderator's decision.
    const updated = await Post.findOneAndUpdate({ _id: postId, status: 'pending_review' }, {
      $set: { status, detectionScores: { text, image, bot }, moderationError: '' }
    }, { new: true });
    if (updated) getIO()?.to('user_' + post.author).emit('post:verified', {
      postId, status, detectionScores: updated.detectionScores
    });
  } catch {
    if (postId) await Post.updateOne({ _id: postId, status: 'pending_review' }, {
      $set: { moderationError: 'Automatic detection unavailable. Awaiting moderator review.' }
    });
  }
}

let timer;
async function tick() {
  try { await processQueueItem(); }
  catch { console.error('[Moderation] Queue unavailable; pending posts remain available for review.'); }
  timer = setTimeout(tick, 2000);
  timer.unref();
}
export function startWorker() {
  if (!timer) { timer = setTimeout(tick, 0); timer.unref(); }
}
