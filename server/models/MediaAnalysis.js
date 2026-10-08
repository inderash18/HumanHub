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
    default: ''
  },
  cloudinaryPublicId: {
    type: String,
    default: ''
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
      'GOOGLE_AI_ORIGIN_DOCUMENTED',
      'GOOGLE_AI_EDITING_DOCUMENTED',
      'AI_ORIGIN_DOCUMENTED',
      'AI_EDITING_DOCUMENTED',
      'LIKELY_AI_GENERATED',
      'NO_STRONG_AI_SIGNALS',
      'LIKELY_AUTHENTIC',
      'INCONCLUSIVE',
      'CHECK_UNAVAILABLE',
      'PENDING'
    ],
    default: 'PENDING',
    index: true
  },
  publicationDecision: {
    type: String,
    enum: ['PENDING', 'ALLOWED', 'HELD_FOR_REVIEW', 'BLOCKED'],
    default: 'PENDING',
    index: true
  },
  decisionReason: {
    type: String,
    default: 'Analysis is queued for origin verification and policy evaluation.'
  },
  googleAiDetection: {
    status: { type: String, default: 'NOT_CONFIGURED' },
    provider: { type: String, default: 'Google Cloud SynthID API' },
    watermarkDetected: { type: Boolean, default: null },
    aiOriginAsserted: { type: Boolean, default: false },
    aiEditingAsserted: { type: Boolean, default: false },
    toolsMentioned: [{ type: String }],
    evidenceSource: { type: String, default: 'none' },
    providerRequestId: { type: String, default: null },
    errorMessage: { type: String, default: null },
    limitations: [{ type: String }],
    latencyMs: { type: Number, default: 0 }
  },
  geminiDetection: {
    status: { type: String, default: 'NOT_CONFIGURED' },
    provider: { type: String, default: 'gemini' },
    label: { type: String, default: 'UNVERIFIED' },
    isAiGenerated: { type: Boolean, default: null },
    confidence: { type: Number, default: null },
    explanation: { type: String, default: '' },
    modelVersion: { type: String, default: 'gemini-1.5-flash' },
    latencyMs: { type: Number, default: 0 },
    errorMessage: { type: String, default: null }
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
    isGoogleAiOriginAsserted: { type: Boolean, default: false },
    isGoogleAiEditingAsserted: { type: Boolean, default: false },
    googleToolsMentioned: [{ type: String }],
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
    isGoogleAiMetadataDetected: { type: Boolean, default: false },
    digitalSourceType: { type: String, default: null },
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
    badgeLabel: { type: String, default: 'Checking image before publishing...' },
    badgeVariant: { type: String, default: 'neutral' },
    primaryExplanation: { type: String, default: 'Origin verification in progress.' },
    detailedPoints: [{ type: String }],
    limitations: [{ type: String }],
    cameraOriginVerified: { type: Boolean, default: false }
  },
  policyVersion: {
    type: String,
    default: '2026.2'
  },
  retryCount: {
    type: Number,
    default: 0
  },
  error: {
    type: String,
    default: ''
  },
  errorCode: {
    type: String,
    enum: [
      '',
      'MODEL_NOT_READY',
      'SERVICE_UNREACHABLE',
      'IMAGE_FETCH_FAILED',
      'INFERENCE_TIMEOUT',
      'INFERENCE_FAILED',
      'UNKNOWN_ERROR'
    ],
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
    },
    originalDecision: {
      type: String
    }
  }
}, { timestamps: true });

mediaAnalysisSchema.index({ mediaId: 1, mediaVersion: -1 });
mediaAnalysisSchema.index({ fileHash: 1, processingState: 1 });
mediaAnalysisSchema.index({ publicationDecision: 1, processingState: 1 });
mediaAnalysisSchema.index({ 'reviewRequest.status': 1, createdAt: -1 });

export default mongoose.model('MediaAnalysis', mediaAnalysisSchema);
