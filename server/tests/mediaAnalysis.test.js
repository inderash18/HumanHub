import { test } from 'node:test';
import assert from 'node:assert/strict';
import MediaAnalysis from '../models/MediaAnalysis.js';

test('MediaAnalysis schema defaults to PENDING outcome and QUEUED state', () => {
  const analysis = new MediaAnalysis({
    mediaId: 'test-media-123',
    owner: '657000000000000000000001',
    mediaUrl: '/api/uploads/sample.jpg',
    originalPath: '/tmp/sample.jpg',
    fileHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
  });

  assert.equal(analysis.processingState, 'QUEUED');
  assert.equal(analysis.analysisOutcome, 'PENDING');
  assert.equal(analysis.mediaVersion, 1);
  assert.equal(analysis.provenance.manifestPresent, false);
  assert.equal(analysis.reviewRequest.status, 'none');
});

test('MediaAnalysis stores sanitized metadata without GPS or device serials', () => {
  const analysis = new MediaAnalysis({
    mediaId: 'test-media-safe',
    owner: '657000000000000000000001',
    mediaUrl: '/api/uploads/safe.jpg',
    originalPath: '/tmp/safe.jpg',
    fileHash: 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    metadata: {
      hasExif: true,
      cameraMake: 'Sony',
      cameraModel: 'ILCE-7M4',
      lensModel: 'FE 24-70mm F2.8 GM II',
      creationDate: '2026:09:23 12:00:00'
    }
  });

  assert.equal(analysis.metadata.cameraMake, 'Sony');
  assert.equal(analysis.metadata.cameraModel, 'ILCE-7M4');
  assert.equal(analysis.metadata.gps, undefined);
  assert.equal(analysis.metadata.serialNumber, undefined);
});

test('MediaAnalysis records dispute review requests accurately', () => {
  const analysis = new MediaAnalysis({
    mediaId: 'test-media-disputed',
    owner: '657000000000000000000001',
    mediaUrl: '/api/uploads/disputed.jpg',
    originalPath: '/tmp/disputed.jpg',
    fileHash: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    analysisOutcome: 'LIKELY_AI_GENERATED',
    reviewRequest: {
      status: 'pending',
      requestedBy: '657000000000000000000001',
      reason: 'Raw photo captured on Sony A7IV with heavy Lightroom color grading.',
      requestedAt: new Date()
    }
  });

  assert.equal(analysis.reviewRequest.status, 'pending');
  assert.match(analysis.reviewRequest.reason, /Sony A7IV/);
});
