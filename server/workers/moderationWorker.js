import redis from '../config/redis.js';
import Post from '../models/Post.js';
import User from '../models/User.js';
import { analyzeText, analyzeMedia, analyzeBehavior } from '../services/detectionService.js';
import { getIO } from '../socket/socketHandler.js';

const processQueueItem = async () => {
    try {
        const item = await redis.rpop('moderation:queue');
        if (!item) return;

        const job = JSON.parse(item);
        console.log(`[Moderation] Processing job: ${job.postId}`);

        const post = await Post.findById(job.postId).populate('author', 'trustScore');
        if (!post) return;

        // Run Parallel Checks
        const [textResult, mediaResult, botResult] = await Promise.all([
            analyzeText(post.body),
            analyzeMedia(post.mediaUrls),
            analyzeBehavior(post.author._id)
        ]);

        post.detectionScores = {
            text: textResult,
            image: mediaResult, // Mapping dummy
            video: { score: 0, isAI: false, confidence: 0 },
            bot: botResult
        };

        // Decision Engine
        if (textResult.score >= 0.85) {
            post.status = 'rejected';
        } else if (mediaResult.score >= 0.80) {
            post.status = 'rejected';
        } else if (botResult.score >= 0.75) {
            post.status = 'rejected';
        } else if (post.author.trustScore < 0.3) {
            post.status = 'pending'; // Leave pending for manual review
        } else {
            post.status = 'published';
        }

        await post.save();
        console.log(`[Moderation] Post ${post._id} processed. Result: ${post.status}`);

        // Notify client real-time
        const io = getIO();
        if (io) {
            io.to(`user_${post.author._id}`).emit('post:verified', {
                postId: post._id,
                status: post.status,
                detectionScores: post.detectionScores
            });
        }

    } catch (err) {
        console.error('[Moderation Worker Error]', err);
    }
};

// Continuous polling loop running strictly in the background
const startWorker = () => {
    setInterval(processQueueItem, 2000); // Poll every 2 seconds
};

if (process.env.NODE_ENV !== 'test') {
    startWorker();
    console.log('[Moderation Worker] Started pulling queue items');
}
