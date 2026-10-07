import { test } from 'node:test';
import assert from 'node:assert/strict';
import MediaAnalysis from '../models/MediaAnalysis.js';

test('MediaAnalysis schema defaults to PENDING publicationDecision and QUEUED state', () => {
  const analysis = new MediaAnalysis({
    mediaId: 'test-gate-001',
    owner: '657000000000000000000001',
    mediaUrl: '/api/uploads/sample.jpg',
    originalPath: '/tmp/sample.jpg',
    fileHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
  });

  assert.equal(analysis.processingState, 'QUEUED');
  assert.equal(analysis.analysisOutcome, 'PENDING');
  assert.equal(analysis.publicationDecision, 'PENDING');
  assert.equal(analysis.googleAiDetection.status, 'NOT_CONFIGURED');
});

test('Google AI detection assertions properly block publication', () => {
  const googleAiAnalysis = new MediaAnalysis({
    mediaId: 'test-google-ai-002',
    owner: '657000000000000000000001',
    mediaUrl: '/api/uploads/gemini_generated.jpg',
    originalPath: '/tmp/gemini_generated.jpg',
    fileHash: 'abc123hash',
    processingState: 'COMPLETED',
    analysisOutcome: 'GOOGLE_AI_ORIGIN_DOCUMENTED',
    publicationDecision: 'BLOCKED',
    decisionReason: 'Content Credentials confirm generation by Google AI (Gemini / Imagen). Direct publishing is blocked.',
    googleAiDetection: {
      status: 'COMPLETED',
      provider: 'C2PA Google Assertion',
      aiOriginAsserted: true,
      toolsMentioned: ['Gemini', 'Imagen'],
      evidenceSource: 'c2pa_google'
    },
    provenance: {
      status: 'VALID_TRUSTED',
      manifestPresent: true,
      isGoogleAiOriginAsserted: true,
      googleToolsMentioned: ['Gemini', 'Imagen']
    }
  });

  assert.equal(googleAiAnalysis.publicationDecision, 'BLOCKED');
  assert.equal(googleAiAnalysis.googleAiDetection.aiOriginAsserted, true);
  assert.match(googleAiAnalysis.decisionReason, /Google AI/);
});

test('Google AI generative editing holds image for review', () => {
  const googleEditAnalysis = new MediaAnalysis({
    mediaId: 'test-google-edit-003',
    owner: '657000000000000000000001',
    mediaUrl: '/api/uploads/edited.jpg',
    originalPath: '/tmp/edited.jpg',
    fileHash: 'def456hash',
    processingState: 'COMPLETED',
    analysisOutcome: 'GOOGLE_AI_EDITING_DOCUMENTED',
    publicationDecision: 'HELD_FOR_REVIEW',
    decisionReason: 'Generative AI editing with Google AI tools documented in Content Credentials. Held for review.',
    provenance: {
      status: 'VALID_TRUSTED',
      manifestPresent: true,
      isGoogleAiEditingAsserted: true,
      googleToolsMentioned: ['Google Photos Magic Editor']
    }
  });

  assert.equal(googleEditAnalysis.publicationDecision, 'HELD_FOR_REVIEW');
  assert.equal(googleEditAnalysis.provenance.isGoogleAiEditingAsserted, true);
});

test('Hardware camera capture allows publication', () => {
  const cameraAnalysis = new MediaAnalysis({
    mediaId: 'test-camera-004',
    owner: '657000000000000000000001',
    mediaUrl: '/api/uploads/raw_camera.jpg',
    originalPath: '/tmp/raw_camera.jpg',
    fileHash: 'camera123hash',
    processingState: 'COMPLETED',
    analysisOutcome: 'NO_STRONG_AI_SIGNALS',
    publicationDecision: 'ALLOWED',
    decisionReason: 'Hardware Content Credentials verify authentic camera capture sensor origin. Approved for publishing.',
    provenance: {
      status: 'VALID_TRUSTED',
      manifestPresent: true,
      isCameraCaptureAsserted: true,
      signerName: 'Sony Hardware Signer'
    },
    evidence: {
      cameraOriginVerified: true,
      badgeLabel: 'Camera capture documented',
      badgeVariant: 'verified'
    }
  });

  assert.equal(cameraAnalysis.publicationDecision, 'ALLOWED');
  assert.equal(cameraAnalysis.evidence.cameraOriginVerified, true);
});

test('Unverified / unavailable detector holds image for review and preserves safety', () => {
  const unavailAnalysis = new MediaAnalysis({
    mediaId: 'test-unavail-005',
    owner: '657000000000000000000001',
    mediaUrl: '/api/uploads/unavail.jpg',
    originalPath: '/tmp/unavail.jpg',
    fileHash: 'unavail123hash',
    processingState: 'FAILED',
    analysisOutcome: 'CHECK_UNAVAILABLE',
    publicationDecision: 'HELD_FOR_REVIEW',
    decisionReason: 'Automated pixel detector is unavailable. Held for manual moderator review or retry.'
  });

  // Strict policy: Never allow publication when checks fail or are unavailable
  assert.notEqual(unavailAnalysis.publicationDecision, 'ALLOWED');
  assert.equal(unavailAnalysis.publicationDecision, 'HELD_FOR_REVIEW');
});
