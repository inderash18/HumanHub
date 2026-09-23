import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { open } from 'node:fs/promises';
import asyncHandler from '../utils/asyncHandler.js';
import redis from '../config/redis.js';
import MediaAnalysis from '../models/MediaAnalysis.js';
import Post from '../models/Post.js';
import { matchesMediaType } from '../utils/mediaSignature.js';
import { getIO } from '../socket/socketHandler.js';

const QUEUE_KEY = 'media:analysis:queue';

/**
 * Compute SHA-256 of file at path.
 */
async function computeFileSha256(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('data', chunk => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

/**
 * @desc    Upload original image and enqueue for origin verification
 * @route   POST /api/v1/media/uploads
 * @access  Private
 */
export const uploadMediaAndEnqueueAnalysis = asyncHandler(async (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ success: false, message: 'No image file uploaded' });
  }

  // 1. Magic bytes validation
  try {
    const handle = await open(file.path, 'r');
    try {
      const buffer = Buffer.alloc(16);
      const { bytesRead } = await handle.read(buffer, 0, buffer.length, 0);
      if (!matchesMediaType(buffer.subarray(0, bytesRead), file.mimetype)) {
        throw new Error('File content does not match header MIME type.');
      }
    } finally {
      await handle.close();
    }
  } catch (err) {
    await fs.promises.unlink(file.path).catch(() => {});
    return res.status(400).json({ success: false, message: 'Invalid or unsupported image file' });
  }

  // 2. Compute SHA-256 of unaltered bytes
  const fileHash = await computeFileSha256(file.path);
  const mediaId = crypto.randomUUID();
  const mediaUrl = `/api/uploads/${file.filename}`;

  // 3. Create MediaAnalysis record (Initial State: QUEUED)
  const analysis = await MediaAnalysis.create({
    mediaId,
    mediaVersion: 1,
    owner: req.user._id,
    mediaUrl,
    originalPath: file.path,
    fileHash,
    mimeType: file.mimetype,
    processingState: 'QUEUED',
    analysisOutcome: 'PENDING',
    evidence: {
      badgeLabel: 'Checking image...',
      badgeVariant: 'neutral',
      primaryExplanation: 'Origin verification and Content Credentials inspection in progress.',
      detailedPoints: ['Extracting image metadata and analyzing pixel structures...'],
      limitations: ['Automated checks are processing in the background.']
    }
  });

  // 4. Enqueue into Redis for async analysis
  try {
    await redis.lpush(QUEUE_KEY, JSON.stringify({
      id: String(analysis._id),
      mediaId,
      mediaVersion: 1
    }));
  } catch (err) {
    console.error('[MediaAnalysis] Redis enqueue failed:', err.message);
  }

  res.status(201).json({
    success: true,
    mediaId,
    mediaVersion: 1,
    url: mediaUrl,
    fileHash,
    processingState: 'QUEUED',
    analysisOutcome: 'PENDING',
    evidence: analysis.evidence
  });
});

/**
 * @desc    Get analysis report for a specific media ID
 * @route   GET /api/v1/media/:mediaId/analysis
 * @access  Public (Sanitized) / Private (Diagnostics for Owner/Admin)
 */
export const getMediaAnalysis = asyncHandler(async (req, res) => {
  const { mediaId } = req.params;
  const analysis = await MediaAnalysis.findOne({ mediaId }).sort({ mediaVersion: -1 });

  if (!analysis) {
    return res.status(404).json({ success: false, message: 'Analysis not found for this media' });
  }

  const isPrivileged = req.user && (
    String(analysis.owner) === String(req.user._id) ||
    ['admin', 'moderator'].includes(req.user.role)
  );

  // Public sanitized response (privacy protected)
  const publicReport = {
    mediaId: analysis.mediaId,
    mediaVersion: analysis.mediaVersion,
    mediaUrl: analysis.mediaUrl,
    processingState: analysis.processingState,
    analysisOutcome: analysis.analysisOutcome,
    policyVersion: analysis.policyVersion,
    evidence: analysis.evidence,
    provenance: {
      status: analysis.provenance?.status,
      manifestPresent: analysis.provenance?.manifestPresent,
      signatureValid: analysis.provenance?.signatureValid,
      signerTrusted: analysis.provenance?.signerTrusted,
      signerName: analysis.provenance?.signerName,
      isAiOriginAsserted: analysis.provenance?.isAiOriginAsserted,
      isAiEditingAsserted: analysis.provenance?.isAiEditingAsserted,
      isCameraCaptureAsserted: analysis.provenance?.isCameraCaptureAsserted,
      aiToolsMentioned: analysis.provenance?.aiToolsMentioned
    },
    metadata: {
      cameraMake: analysis.metadata?.cameraMake,
      cameraModel: analysis.metadata?.cameraModel,
      lensModel: analysis.metadata?.lensModel,
      software: analysis.metadata?.software,
      creationDate: analysis.metadata?.creationDate,
      colorSpace: analysis.metadata?.colorSpace,
      hasAiGenerationParameters: analysis.metadata?.hasAiGenerationParameters,
      aiGenerationSoftwareDetected: analysis.metadata?.aiGenerationSoftwareDetected
    },
    reviewRequest: {
      status: analysis.reviewRequest?.status,
      requestedAt: analysis.reviewRequest?.requestedAt
    }
  };

  // Add internal diagnostic fields for owner/moderator
  if (isPrivileged) {
    publicReport.diagnostics = {
      fileHash: analysis.fileHash,
      dimensions: analysis.dimensions,
      detector: analysis.detector,
      retryCount: analysis.retryCount,
      error: analysis.error,
      reviewDetails: analysis.reviewRequest
    };
  }

  res.json({ success: true, data: publicReport });
});

/**
 * @desc    Retry analysis for a failed media item
 * @route   POST /api/v1/media/:mediaId/analysis/retry
 * @access  Private (Owner / Moderator only)
 */
export const retryMediaAnalysis = asyncHandler(async (req, res) => {
  const { mediaId } = req.params;
  const analysis = await MediaAnalysis.findOne({ mediaId }).sort({ mediaVersion: -1 });

  if (!analysis) {
    return res.status(404).json({ success: false, message: 'Media analysis not found' });
  }

  if (String(analysis.owner) !== String(req.user._id) && !['admin', 'moderator'].includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Not authorized to retry this analysis' });
  }

  analysis.processingState = 'QUEUED';
  analysis.analysisOutcome = 'PENDING';
  analysis.retryCount = 0;
  analysis.error = '';
  analysis.evidence = {
    badgeLabel: 'Checking image...',
    badgeVariant: 'neutral',
    primaryExplanation: 'Analysis re-enqueued.',
    detailedPoints: ['Retrying detector and provenance validation...'],
    limitations: ['Background processing in progress.']
  };
  await analysis.save();

  await redis.lpush(QUEUE_KEY, JSON.stringify({
    id: String(analysis._id),
    mediaId: analysis.mediaId,
    mediaVersion: analysis.mediaVersion
  }));

  res.json({ success: true, message: 'Analysis re-enqueued successfully', processingState: 'QUEUED' });
});

/**
 * @desc    Submit a review dispute request for an image origin outcome
 * @route   POST /api/v1/media/:mediaId/analysis/review-request
 * @access  Private
 */
export const requestMediaReview = asyncHandler(async (req, res) => {
  const { mediaId } = req.params;
  const { reason } = req.body;

  if (!reason || !reason.trim()) {
    return res.status(400).json({ success: false, message: 'Please provide a reason for the review request' });
  }

  const analysis = await MediaAnalysis.findOne({ mediaId }).sort({ mediaVersion: -1 });
  if (!analysis) {
    return res.status(404).json({ success: false, message: 'Media analysis not found' });
  }

  if (analysis.reviewRequest?.status === 'pending') {
    return res.status(400).json({ success: false, message: 'A review request is already pending for this media' });
  }

  analysis.reviewRequest = {
    status: 'pending',
    requestedBy: req.user._id,
    reason: reason.trim().slice(0, 1000),
    requestedAt: new Date(),
    originalOutcome: analysis.analysisOutcome
  };

  await analysis.save();

  // Notify moderators
  const io = getIO();
  if (io) {
    io.to('moderators').emit('moderation:review_requested', {
      mediaId: analysis.mediaId,
      requestedBy: req.user.username,
      reason: analysis.reviewRequest.reason
    });
  }

  res.json({
    success: true,
    message: 'Review request submitted for human moderator evaluation',
    reviewStatus: 'pending'
  });
});

/**
 * @desc    Get all pending review requests for moderators
 * @route   GET /api/v1/moderation/reviews
 * @access  Private (Moderator / Admin)
 */
export const getReviewQueue = asyncHandler(async (req, res) => {
  const reviews = await MediaAnalysis.find({ 'reviewRequest.status': 'pending' })
    .populate('owner', 'username displayName avatar')
    .populate('reviewRequest.requestedBy', 'username displayName avatar')
    .sort({ 'reviewRequest.requestedAt': 1 })
    .limit(50);

  res.json({ success: true, count: reviews.length, data: reviews });
});

/**
 * @desc    Resolve a disputed origin review
 * @route   POST /api/v1/moderation/reviews/:id/decide
 * @access  Private (Moderator / Admin)
 */
export const resolveMediaReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { decision, notes } = req.body; // override_authentic | confirm_ai | mark_inconclusive

  const analysis = await MediaAnalysis.findById(id);
  if (!analysis) {
    return res.status(404).json({ success: false, message: 'Review item not found' });
  }

  if (decision === 'override_authentic') {
    analysis.analysisOutcome = 'NO_STRONG_AI_SIGNALS';
    analysis.evidence.badgeLabel = 'Human Verified (Dispute Resolved)';
    analysis.evidence.badgeVariant = 'verified';
    analysis.evidence.primaryExplanation = 'A human moderator reviewed and verified the authentic provenance of this image.';
    analysis.evidence.detailedPoints.push(`Moderator resolution (${req.user.username}): Authentic capture confirmed.`);
  } else if (decision === 'confirm_ai') {
    analysis.analysisOutcome = 'LIKELY_AI_GENERATED';
    analysis.evidence.badgeLabel = 'Likely AI-generated (Moderator Confirmed)';
    analysis.evidence.badgeVariant = 'warning';
    analysis.evidence.primaryExplanation = 'Human moderator review confirmed synthetic/AI generation markers.';
  } else if (decision === 'mark_inconclusive') {
    analysis.analysisOutcome = 'INCONCLUSIVE';
    analysis.evidence.badgeLabel = 'Inconclusive (Under Review)';
    analysis.evidence.badgeVariant = 'neutral';
    analysis.evidence.primaryExplanation = 'Disputed signals reviewed by moderation team and classified as inconclusive.';
  }

  analysis.reviewRequest.status = 'resolved';
  analysis.reviewRequest.reviewedBy = req.user._id;
  analysis.reviewRequest.reviewedAt = new Date();
  analysis.reviewRequest.resolutionNotes = (notes || '').trim().slice(0, 1000);

  await analysis.save();

  // Broadcast update
  const io = getIO();
  if (io) {
    io.emit('media:analysis:updated', {
      mediaId: analysis.mediaId,
      mediaVersion: analysis.mediaVersion,
      analysisOutcome: analysis.analysisOutcome,
      evidence: analysis.evidence,
      processingState: analysis.processingState
    });
  }

  res.json({ success: true, message: 'Review dispute resolved successfully', analysis });
});
