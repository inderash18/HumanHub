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
const STALE_JOB_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes stale lease timeout

/**
 * Process a single image analysis job from the Redis queue or MongoDB fallback.
 */
export async function processAnalysisJob() {
  let analysis = null;

  // 1. Attempt Redis queue pop if Redis is connected
  if (redis) {
    try {
      const rawJob = await redis.rpop(QUEUE_KEY);
      if (rawJob) {
        const jobData = JSON.parse(rawJob);
        const targetId = jobData.id || jobData.analysisId;
        if (targetId) {
          // Atomic claim from Redis job reference
          analysis = await MediaAnalysis.findOneAndUpdate(
            {
              _id: targetId,
              processingState: { $in: ['QUEUED', 'RUNNING'] }
            },
            {
              $set: { processingState: 'RUNNING' }
            },
            { new: true }
          );
        }
      }
    } catch (err) {
      // Gracefully ignore Redis throttling or connection drops; fallback to MongoDB
    }
  }

  // 2. MongoDB Atomic Fallback & Stale Job Recovery
  // Claims oldest QUEUED job OR stale RUNNING job abandoned after worker restart/crash
  if (!analysis) {
    try {
      const staleThreshold = new Date(Date.now() - STALE_JOB_TIMEOUT_MS);
      analysis = await MediaAnalysis.findOneAndUpdate(
        {
          $or: [
            { processingState: 'QUEUED' },
            { processingState: 'RUNNING', updatedAt: { $lt: staleThreshold } }
          ]
        },
        {
          $set: {
            processingState: 'RUNNING'
          }
        },
        {
          sort: { createdAt: 1 },
          new: true
        }
      );
    } catch (dbErr) {
      // Ignore DB read errors
    }
  }

  if (!analysis) return;

  const jobId = analysis._id;

  try {
    // Check if an existing completed analysis exists for this exact fileHash
    const existingAnalysis = await MediaAnalysis.findOne({
      fileHash: analysis.fileHash,
      processingState: 'COMPLETED',
      policyVersion: '2026.2',
      _id: { $ne: analysis._id }
    }).sort({ createdAt: -1 }).lean();

    let report;
    if (existingAnalysis) {
      report = {
        outcome: existingAnalysis.analysisOutcome,
        publication_decision: existingAnalysis.publicationDecision,
        decision_reason: existingAnalysis.decisionReason,
        policy_version: existingAnalysis.policyVersion,
        google_ai_detection: existingAnalysis.googleAiDetection,
        provenance: existingAnalysis.provenance,
        metadata: existingAnalysis.metadata,
        detector: existingAnalysis.detector,
        evidence: existingAnalysis.evidence
      };
    } else if (!process.env.AI_SERVICE_URL) {
      // AI detection unconfigured in free deployment tier -> route to manual review
      report = {
        outcome: 'CHECK_UNAVAILABLE',
        publication_decision: 'HELD_FOR_REVIEW',
        decision_reason: 'Automated AI analysis is unconfigured in this deployment. Media held for manual moderation.',
        policy_version: '2026.2',
        evidence: {
          badge_label: 'Manual Review Required',
          badge_variant: 'neutral',
          primary_explanation: 'Automated verification is unconfigured. Media submitted for manual review.',
          detailed_points: ['Deployment is running in free manual-review mode.'],
          limitations: ['Manual moderator approval required before public feed display.'],
          camera_origin_verified: false
        }
      };
    } else {
      let fileStream;
      if (analysis.originalPath && fs.existsSync(analysis.originalPath)) {
        fileStream = fs.createReadStream(analysis.originalPath);
      } else if (analysis.mediaUrl && (analysis.mediaUrl.startsWith('http://') || analysis.mediaUrl.startsWith('https://'))) {
        const imgStreamRes = await axios.get(analysis.mediaUrl, { responseType: 'stream', timeout: 15000 });
        fileStream = imgStreamRes.data;
      } else {
        throw new Error(`Media file stream unavailable for ${analysis.mediaId}`);
      }

      // Prepare multipart form with unaltered image bytes
      const form = new FormData();
      form.append('file', fileStream, {
        filename: `${analysis.mediaId}.jpg`,
        contentType: analysis.mimeType || 'image/jpeg'
      });

      const response = await axios.post(`${process.env.AI_SERVICE_URL}/analyze/image-origin`, form, {
        headers: {
          ...form.getHeaders(),
          ...(process.env.AI_SERVICE_SECRET ? { 'X-Internal-Secret': process.env.AI_SERVICE_SECRET } : {})
        },
        timeout: 45000,
        maxContentLength: 50 * 1024 * 1024,
        maxBodyLength: 50 * 1024 * 1024
      });

      report = response.data;
    }

    // Map response to MediaAnalysis fields
    analysis.processingState = 'COMPLETED';
    analysis.analysisOutcome = report.outcome || 'INCONCLUSIVE';
    analysis.publicationDecision = report.publication_decision || 'HELD_FOR_REVIEW';
    analysis.decisionReason = report.decision_reason || 'Analysis complete.';
    analysis.policyVersion = report.policy_version || '2026.2';
    analysis.errorCode = '';
    analysis.error = '';

    if (report.google_ai_detection) {
      analysis.googleAiDetection = {
        status: report.google_ai_detection.status || 'NOT_CONFIGURED',
        provider: report.google_ai_detection.provider || 'Google Cloud SynthID API',
        watermarkDetected: report.google_ai_detection.watermark_detected,
        aiOriginAsserted: Boolean(report.google_ai_detection.ai_origin_asserted),
        aiEditingAsserted: Boolean(report.google_ai_detection.ai_editing_asserted),
        toolsMentioned: report.google_ai_detection.tools_mentioned || [],
        evidenceSource: report.google_ai_detection.evidence_source || 'none',
        providerRequestId: report.google_ai_detection.provider_request_id || null,
        errorMessage: report.google_ai_detection.error_message || null,
        limitations: report.google_ai_detection.limitations || [],
        latencyMs: report.google_ai_detection.latency_ms || 0
      };
    }

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
        isGoogleAiOriginAsserted: Boolean(report.provenance.is_google_ai_origin_asserted),
        isGoogleAiEditingAsserted: Boolean(report.provenance.is_google_ai_editing_asserted),
        googleToolsMentioned: report.provenance.google_tools_mentioned || [],
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
        isGoogleAiMetadataDetected: Boolean(report.metadata.is_google_ai_metadata_detected),
        digitalSourceType: report.metadata.digital_source_type,
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
      if (report.detector.status === 'UNAVAILABLE') {
        analysis.errorCode = 'MODEL_NOT_READY';
      }
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
        mediaUrl: analysis.mediaUrl,
        processingState: analysis.processingState,
        analysisOutcome: analysis.analysisOutcome,
        publicationDecision: analysis.publicationDecision,
        decisionReason: analysis.decisionReason,
        googleAiDetection: analysis.googleAiDetection,
        policyVersion: analysis.policyVersion,
        errorCode: analysis.errorCode,
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

    console.log(`[MediaAnalysisWorker] Job completed for media ${analysis.mediaId} -> Outcome: ${analysis.analysisOutcome} | Decision: ${analysis.publicationDecision} (${analysis.decisionReason})`);

  } catch (error) {
    let errorCode = 'INFERENCE_FAILED';
    let safeMessage = 'Automated analysis could not be completed at this time.';
    let detailPoint = 'An internal processing error occurred.';

    if (error.code === 'ENOENT' || error.message?.includes('not found at')) {
      errorCode = 'IMAGE_FETCH_FAILED';
      safeMessage = 'The uploaded media file could not be accessed from storage.';
      detailPoint = 'Image file was unavailable for analysis.';
    } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.code === 'EHOSTUNREACH' || error.message?.includes('ECONNREFUSED')) {
      errorCode = 'SERVICE_UNREACHABLE';
      safeMessage = 'Origin verification service is temporarily unreachable.';
      detailPoint = 'AI analysis service connection could not be established.';
    } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout') || error.message?.includes('timed out')) {
      errorCode = 'INFERENCE_TIMEOUT';
      safeMessage = 'Inference request timed out during model execution.';
      detailPoint = 'Analysis exceeded the execution time limit.';
    } else if (error.response?.status === 503 || error.message?.includes('MODEL_NOT_READY')) {
      errorCode = 'MODEL_NOT_READY';
      safeMessage = 'Analysis models are currently initializing.';
      detailPoint = 'Model weights or backbone components are loading.';
    }

    console.error(`[MediaAnalysisWorker] Error [${errorCode}] processing job:`, error.message);

    if (jobId) {
      const analysis = await MediaAnalysis.findById(jobId);
      if (analysis) {
        analysis.retryCount = (analysis.retryCount || 0) + 1;
        if (analysis.retryCount >= MAX_RETRIES) {
          analysis.processingState = 'FAILED';
          analysis.analysisOutcome = 'CHECK_UNAVAILABLE';
          analysis.publicationDecision = 'HELD_FOR_REVIEW';
          analysis.decisionReason = 'Automated check unavailable after multiple retries. Held for manual review or author retry.';
          analysis.policyVersion = '2026.2';
          analysis.errorCode = errorCode;
          analysis.error = error.message;
          analysis.evidence = {
            badgeLabel: 'Image check unavailable',
            badgeVariant: 'unavailable',
            primaryExplanation: safeMessage,
            detailedPoints: [detailPoint],
            limitations: ['Verification may be retried by the post author.']
          };
          await analysis.save();

          const io = getIO();
          if (io) {
            io.emit('media:analysis:updated', {
              mediaId: analysis.mediaId,
              mediaVersion: analysis.mediaVersion,
              mediaUrl: analysis.mediaUrl,
              processingState: 'FAILED',
              analysisOutcome: 'CHECK_UNAVAILABLE',
              publicationDecision: 'HELD_FOR_REVIEW',
              decisionReason: analysis.decisionReason,
              policyVersion: analysis.policyVersion,
              errorCode: analysis.errorCode,
              evidence: analysis.evidence
            });
          }
        } else {
          // Requeue for retry with exponential backoff
          analysis.processingState = 'QUEUED';
          if (typeof analysis.save === 'function') await analysis.save();
          const retryTimer = setTimeout(async () => {
            if (redis) {
              try {
                await redis.lpush(QUEUE_KEY, JSON.stringify({ id: analysis._id, mediaId: analysis.mediaId, mediaVersion: analysis.mediaVersion }));
              } catch {}
            }
          }, Math.pow(2, analysis.retryCount) * 1000);
          if (retryTimer.unref) retryTimer.unref();
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
