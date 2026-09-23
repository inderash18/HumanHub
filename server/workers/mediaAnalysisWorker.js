import fs from 'node:fs';
import FormData from 'form-data';
import axios from 'axios';
import redis from '../config/redis.js';
import MediaAnalysis from '../models/MediaAnalysis.js';
import { getIO } from '../socket/socketHandler.js';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
const QUEUE_KEY = 'media:analysis:queue';
const MAX_RETRIES = 3;

/**
 * Process a single image analysis job from the Redis queue.
 */
export async function processAnalysisJob() {
  let rawJob = null;
  try {
    rawJob = await redis.rpop(QUEUE_KEY);
  } catch (err) {
    console.error('[MediaAnalysisWorker] Redis connection issue:', err.message);
    return;
  }

  if (!rawJob) return;

  let jobId, mediaId, mediaVersion;
  try {
    const jobData = JSON.parse(rawJob);
    jobId = jobData.id || jobData.analysisId;
    mediaId = jobData.mediaId;
    mediaVersion = jobData.mediaVersion || 1;

    const analysis = await MediaAnalysis.findOne({
      _id: jobId,
      processingState: { $in: ['QUEUED', 'RUNNING'] }
    });

    if (!analysis) return;

    // Set state to RUNNING
    analysis.processingState = 'RUNNING';
    await analysis.save();

    if (!fs.existsSync(analysis.originalPath)) {
      throw new Error(`Original media file not found at ${analysis.originalPath}`);
    }

    // Prepare multipart form with unaltered original image bytes
    const form = new FormData();
    form.append('file', fs.createReadStream(analysis.originalPath), {
      filename: `${analysis.mediaId}.jpg`,
      contentType: analysis.mimeType || 'image/jpeg'
    });

    const response = await axios.post(`${AI_SERVICE_URL}/analyze/image-origin`, form, {
      headers: {
        ...form.getHeaders()
      },
      timeout: 30000,
      maxContentLength: 50 * 1024 * 1024,
      maxBodyLength: 50 * 1024 * 1024
    });

    const report = response.data;

    // Map response to MediaAnalysis fields
    analysis.processingState = 'COMPLETED';
    analysis.analysisOutcome = report.outcome || 'INCONCLUSIVE';
    analysis.policyVersion = report.policy_version || '2026.1';

    if (report.provenance) {
      analysis.provenance = {
        status: report.provenance.status || 'ABSENT',
        manifestPresent: Boolean(report.provenance.manifest_present),
        signatureValid: report.provenance.signature_valid,
        signerTrusted: report.provenance.signer_trusted,
        signerName: report.provenance.signer_name,
        issuer: report.provenance.issuer,
        claimGenerator: report.provenance.claim_generator,
        isAiOriginAsserted: Boolean(report.provenance.is_ai_origin_asserted),
        isAiEditingAsserted: Boolean(report.provenance.is_ai_editing_asserted),
        isCameraCaptureAsserted: Boolean(report.provenance.is_camera_capture_asserted),
        aiToolsMentioned: report.provenance.ai_tools_mentioned || [],
        actions: report.provenance.actions || [],
        validationErrors: report.provenance.validation_errors || [],
        latencyMs: report.provenance.latency_ms || 0
      };
    }

    if (report.metadata) {
      analysis.metadata = {
        hasExif: Boolean(report.metadata.has_exif),
        hasXmp: Boolean(report.metadata.has_xmp),
        hasIptc: Boolean(report.metadata.has_iptc),
        cameraMake: report.metadata.camera_make,
        cameraModel: report.metadata.camera_model,
        lensModel: report.metadata.lens_model,
        software: report.metadata.software,
        creationDate: report.metadata.creation_date,
        colorSpace: report.metadata.color_space,
        aiGenerationSoftwareDetected: report.metadata.ai_generation_software_detected,
        hasAiGenerationParameters: Boolean(report.metadata.has_ai_generation_parameters),
        latencyMs: report.metadata.latency_ms || 0
      };
      if (report.metadata.width && report.metadata.height) {
        analysis.dimensions = {
          width: report.metadata.width,
          height: report.metadata.height
        };
      }
    }

    if (report.detector) {
      analysis.detector = {
        modelName: report.detector.model_name || 'UniversalFakeDetect',
        version: report.detector.version || '1.0.0',
        checkpointIdentifier: report.detector.checkpoint_identifier || 'univfd_clip_vit_l14',
        rawScore: report.detector.raw_score,
        logit: report.detector.logit,
        isSynthetic: report.detector.is_synthetic,
        confidence: report.detector.confidence,
        latencyMs: report.detector.latency_ms || 0,
        status: report.detector.status || 'COMPLETED',
        errorMessage: report.detector.error_message,
        details: report.detector.details || {}
      };
    }

    if (report.evidence) {
      analysis.evidence = {
        badgeLabel: report.evidence.badge_label || 'Analysis Complete',
        badgeVariant: report.evidence.badge_variant || 'neutral',
        primaryExplanation: report.evidence.primary_explanation || '',
        detailedPoints: report.evidence.detailed_points || [],
        limitations: report.evidence.limitations || [],
        cameraOriginVerified: Boolean(report.evidence.camera_origin_verified)
      };
    }

    await analysis.save();

    // Notify client via Socket.io
    const io = getIO();
    if (io) {
      const payload = {
        mediaId: analysis.mediaId,
        mediaVersion: analysis.mediaVersion,
        processingState: analysis.processingState,
        analysisOutcome: analysis.analysisOutcome,
        evidence: analysis.evidence,
        provenanceStatus: analysis.provenance?.status,
        metadata: {
          cameraMake: analysis.metadata?.cameraMake,
          cameraModel: analysis.metadata?.cameraModel,
          software: analysis.metadata?.software
        }
      };
      io.to(`media_${analysis.mediaId}`).emit('media:analysis:updated', payload);
      io.to(`user_${analysis.owner}`).emit('media:analysis:updated', payload);
      io.emit('media:analysis:updated', payload);
    }

    console.log(`[MediaAnalysisWorker] Job completed for media ${analysis.mediaId} -> Outcome: ${analysis.analysisOutcome}`);

  } catch (error) {
    console.error(`[MediaAnalysisWorker] Error processing job:`, error.message);
    if (jobId) {
      const analysis = await MediaAnalysis.findById(jobId);
      if (analysis) {
        analysis.retryCount = (analysis.retryCount || 0) + 1;
        if (analysis.retryCount >= MAX_RETRIES) {
          analysis.processingState = 'FAILED';
          analysis.analysisOutcome = 'CHECK_UNAVAILABLE';
          analysis.error = error.message;
          analysis.evidence = {
            badgeLabel: 'Check unavailable',
            badgeVariant: 'unavailable',
            primaryExplanation: 'Automated analysis could not be completed at this time.',
            detailedPoints: ['Inference request timed out or worker encountered an internal error.'],
            limitations: ['Verification may be retried by the post author.']
          };
          await analysis.save();

          const io = getIO();
          if (io) {
            io.emit('media:analysis:updated', {
              mediaId: analysis.mediaId,
              mediaVersion: analysis.mediaVersion,
              processingState: 'FAILED',
              analysisOutcome: 'CHECK_UNAVAILABLE',
              evidence: analysis.evidence
            });
          }
        } else {
          // Requeue for retry with backoff
          analysis.processingState = 'QUEUED';
          await analysis.save();
          setTimeout(async () => {
            try {
              await redis.lpush(QUEUE_KEY, JSON.stringify({ id: analysis._id, mediaId: analysis.mediaId, mediaVersion: analysis.mediaVersion }));
            } catch {}
          }, Math.pow(2, analysis.retryCount) * 1000);
        }
      }
    }
  }
}

let workerTimer = null;
async function workerLoop() {
  try {
    await processAnalysisJob();
  } catch (err) {
    console.error('[MediaAnalysisWorker] Error in worker tick:', err.message);
  }
  workerTimer = setTimeout(workerLoop, 1000);
  if (workerTimer.unref) workerTimer.unref();
}

export function startMediaAnalysisWorker() {
  if (!workerTimer) {
    console.log('[MediaAnalysisWorker] Starting Media Analysis background worker...');
    workerTimer = setTimeout(workerLoop, 500);
    if (workerTimer.unref) workerTimer.unref();
  }
}
