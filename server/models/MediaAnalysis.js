import mongoose from 'mongoose';

const mediaAnalysisSchema = new mongoose.Schema({
  mediaId: {
    type: String,
    required: true,
    index: true
  },
  mediaVersion: {
    type: Number,
    default: 1,
    required: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    index: true
  },
  mediaUrl: {
    type: String,
    required: true
  },
  originalPath: {
    type: String,
    required: true
  },
  fileHash: {
    type: String,
    required: true,
    index: true
  },
  mimeType: {
    type: String,
    default: 'image/jpeg'
  },
  dimensions: {
    width: { type: Number, default: 0 },
    height: { type: Number, default: 0 }
  },
  processingState: {
    type: String,
    enum: ['QUEUED', 'RUNNING', 'COMPLETED', 'PARTIAL', 'FAILED'],
    default: 'QUEUED',
    index: true
  },
  analysisOutcome: {
    type: String,
    enum: [
      'AI_ORIGIN_DOCUMENTED',
      'AI_EDITING_DOCUMENTED',
      'LIKELY_AI_GENERATED',
      'NO_STRONG_AI_SIGNALS',
      'INCONCLUSIVE',
      'CHECK_UNAVAILABLE',
      'PENDING'
    ],
    default: 'PENDING',
    index: true
  },
  provenance: {
    status: { type: String, default: 'ABSENT' },
    manifestPresent: { type: Boolean, default: false },
    signatureValid: { type: Boolean, default: null },
    signerTrusted: { type: Boolean, default: null },
    signerName: { type: String, default: null },
    issuer: { type: String, default: null },
    claimGenerator: { type: String, default: null },
    isAiOriginAsserted: { type: Boolean, default: false },
    isAiEditingAsserted: { type: Boolean, default: false },
    isCameraCaptureAsserted: { type: Boolean, default: false },
    aiToolsMentioned: [{ type: String }],
    actions: [{ type: mongoose.Schema.Types.Mixed }],
    validationErrors: [{ type: String }],
    latencyMs: { type: Number, default: 0 }
  },
  metadata: {
    hasExif: { type: Boolean, default: false },
    hasXmp: { type: Boolean, default: false },
    hasIptc: { type: Boolean, default: false },
    cameraMake: { type: String, default: null },
    cameraModel: { type: String, default: null },
    lensModel: { type: String, default: null },
    software: { type: String, default: null },
    creationDate: { type: String, default: null },
    colorSpace: { type: String, default: null },
    aiGenerationSoftwareDetected: { type: String, default: null },
    hasAiGenerationParameters: { type: Boolean, default: false },
    latencyMs: { type: Number, default: 0 }
  },
  detector: {
    modelName: { type: String, default: 'UniversalFakeDetect' },
    version: { type: String, default: '1.0.0' },
    checkpointIdentifier: { type: String, default: 'univfd_clip_vit_l14' },
    rawScore: { type: Number, default: null },
    logit: { type: Number, default: null },
    isSynthetic: { type: Boolean, default: null },
    confidence: { type: Number, default: null },
    latencyMs: { type: Number, default: 0 },
    status: { type: String, default: 'PENDING' },
    errorMessage: { type: String, default: null },
    details: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  evidence: {
    badgeLabel: { type: String, default: 'Checking image...' },
    badgeVariant: { type: String, default: 'neutral' },
    primaryExplanation: { type: String, default: 'Origin verification in progress.' },
    detailedPoints: [{ type: String }],
    limitations: [{ type: String }],
    cameraOriginVerified: { type: Boolean, default: false }
  },
  policyVersion: {
    type: String,
    default: '2026.1'
  },
  retryCount: {
    type: Number,
    default: 0
  },
  error: {
    type: String,
    default: ''
  },
  reviewRequest: {
    status: {
      type: String,
      enum: ['none', 'pending', 'resolved', 'rejected'],
      default: 'none',
      index: true
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: {
      type: String,
      maxlength: 1000
    },
    requestedAt: {
      type: Date
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: {
      type: Date
    },
    resolutionNotes: {
      type: String,
      maxlength: 1000
    },
    originalOutcome: {
      type: String
    }
  }
}, { timestamps: true });

mediaAnalysisSchema.index({ mediaId: 1, mediaVersion: -1 });
mediaAnalysisSchema.index({ fileHash: 1, processingState: 1 });
mediaAnalysisSchema.index({ 'reviewRequest.status': 1, createdAt: -1 });

export default mongoose.model('MediaAnalysis', mediaAnalysisSchema);
