import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { hashPassword, verifyPassword, needsRehash } from '../utils/passwordHasher.js';
import { validateSafeUrl, isPrivateIp } from '../utils/ssrfValidator.js';
import { 
  encryptMfaSecret, 
  decryptMfaSecret, 
  generateTotpSetup, 
  verifyTotpToken, 
  generateBackupRecoveryCodes, 
  consumeBackupRecoveryCode 
} from '../services/mfaService.js';
import { 
  canViewPost, 
  canEditPost, 
  canDeletePost, 
  canViewMedia, 
  canComment, 
  canFollow, 
  canMessage 
} from '../policies/authorization.js';

test('Security Hardening - Password Hasher (Argon2id & Bcrypt Migration)', async (t) => {
  await t.test('hashes password using Argon2id with OWASP parameters', async () => {
    const rawPass = 'Correct-Horse-Battery-Staple-2026!';
    const hash = await hashPassword(rawPass);
    assert.ok(hash.startsWith('$argon2id$'), 'Must be Argon2id algorithm');
    assert.equal(needsRehash(hash), false, 'Fresh Argon2id hash should not need rehash');

    const isValid = await verifyPassword(rawPass, hash);
    assert.equal(isValid, true, 'Valid password must verify');

    const isInvalid = await verifyPassword('wrong-password', hash);
    assert.equal(isInvalid, false, 'Invalid password must fail');
  });

  await t.test('seamlessly verifies legacy bcrypt hash and flags for rehash', async () => {
    const legacyPass = 'LegacyUserPassword123#';
    const legacyHash = await bcrypt.hash(legacyPass, 10);
    assert.ok(legacyHash.startsWith('$2'), 'Must be bcrypt hash');
    assert.equal(needsRehash(legacyHash), true, 'Legacy bcrypt hash must trigger rehash flag');

    const isValid = await verifyPassword(legacyPass, legacyHash);
    assert.equal(isValid, true, 'Legacy bcrypt password must verify successfully');

    const isInvalid = await verifyPassword('wrong-password', legacyHash);
    assert.equal(isInvalid, false, 'Invalid password against legacy bcrypt must fail');
  });
});

test('Security Hardening - SSRF & Cloud Metadata Protection', async (t) => {
  await t.test('blocks loopback and private IPv4 ranges', () => {
    assert.equal(isPrivateIp('127.0.0.1'), true);
    assert.equal(isPrivateIp('127.0.1.5'), true);
    assert.equal(isPrivateIp('10.0.0.1'), true);
    assert.equal(isPrivateIp('172.16.0.1'), true);
    assert.equal(isPrivateIp('172.31.255.255'), true);
    assert.equal(isPrivateIp('192.168.1.1'), true);
    assert.equal(isPrivateIp('0.0.0.0'), true);
  });

  await t.test('blocks cloud metadata IP 169.254.169.254 and link-local', () => {
    assert.equal(isPrivateIp('169.254.169.254'), true);
    assert.equal(isPrivateIp('169.254.1.1'), true);
  });

  await t.test('blocks IPv6 loopback, link-local, and unique local', () => {
    assert.equal(isPrivateIp('::1'), true);
    assert.equal(isPrivateIp('fe80::1'), true);
    assert.equal(isPrivateIp('fc00::1'), true);
    assert.equal(isPrivateIp('fd12:3456:789a:1::1'), true);
  });

  await t.test('allows public IPs', () => {
    assert.equal(isPrivateIp('8.8.8.8'), false);
    assert.equal(isPrivateIp('1.1.1.1'), false);
    assert.equal(isPrivateIp('93.184.216.34'), false);
  });

  await t.test('validateSafeUrl blocks non-http protocols and local hostnames', async () => {
    const fileRes = await validateSafeUrl('file:///etc/passwd');
    assert.equal(fileRes.isSafe, false);

    const gopherRes = await validateSafeUrl('gopher://127.0.0.1:70/');
    assert.equal(gopherRes.isSafe, false);

    const localRes = await validateSafeUrl('http://localhost:5000/internal');
    assert.equal(localRes.isSafe, false);

    const metaRes = await validateSafeUrl('http://169.254.169.254/latest/meta-data/');
    assert.equal(metaRes.isSafe, false);
  });
});

test('Security Hardening - MFA (TOTP, Secret Encryption, Anti-Replay & Recovery Codes)', async (t) => {
  await t.test('encrypts and decrypts TOTP shared secret with AES-256-GCM', () => {
    const rawSecret = 'JBSWY3DPEHPK3PXP';
    const encrypted = encryptMfaSecret(rawSecret);
    assert.ok(encrypted.ciphertext && encrypted.iv && encrypted.tag, 'Encrypted secret must contain ciphertext, iv, and auth tag');

    const decrypted = decryptMfaSecret(encrypted);
    assert.equal(decrypted, rawSecret, 'Decrypted secret must match original');
  });

  await t.test('generates and consumes single-use hashed backup recovery codes', () => {
    const { plainCodes, hashedCodes } = generateBackupRecoveryCodes(5);
    assert.equal(plainCodes.length, 5);
    assert.equal(hashedCodes.length, 5);

    const firstCode = plainCodes[0];
    const invalidCode = 'invalid-code-12345';

    // Verify invalid code fails
    const failRes = consumeBackupRecoveryCode(invalidCode, hashedCodes);
    assert.equal(failRes.valid, false);

    // Verify first code succeeds and is marked consumed
    const passRes = consumeBackupRecoveryCode(firstCode, hashedCodes);
    assert.equal(passRes.valid, true);
    assert.equal(hashedCodes[0].used, true);

    // Verify replaying the same code fails
    const replayRes = consumeBackupRecoveryCode(firstCode, hashedCodes);
    assert.equal(replayRes.valid, false, 'Replaying a used recovery code must be rejected');
  });
});

test('Security Hardening - Centralized BOLA Authorization Policies', async (t) => {
  const alice = { _id: '507f191e810c19729de860ea', role: 'user', emailVerified: true };
  const bob = { _id: '507f191e810c19729de860eb', role: 'user', emailVerified: true };
  const charlie = { _id: '507f191e810c19729de860ec', role: 'user', emailVerified: true };
  const admin = { _id: '507f191e810c19729de860ed', role: 'admin', emailVerified: true };

  const publicPost = {
    _id: '607f191e810c19729de860f1',
    author: alice._id,
    status: 'published',
    authorPrivacy: { isPrivate: false }
  };

  const privatePost = {
    _id: '607f191e810c19729de860f2',
    author: { _id: alice._id, privacySettings: { isPrivate: true } },
    status: 'published'
  };

  const pendingPost = {
    _id: '607f191e810c19729de860f3',
    author: alice._id,
    status: 'pending_review'
  };

  await t.test('canViewPost allows public post to anyone, blocks private post to non-followers', () => {
    assert.equal(canViewPost({ user: bob, post: publicPost }), true);
    assert.equal(canViewPost({ user: null, post: publicPost }), true);

    // Private post: Author can view, approved follower can view, non-follower cannot, admin can
    assert.equal(canViewPost({ user: alice, post: privatePost }), true);
    assert.equal(canViewPost({ user: bob, post: privatePost, isFollowing: true }), true);
    assert.equal(canViewPost({ user: bob, post: privatePost, isFollowing: false }), false);
    assert.equal(canViewPost({ user: null, post: privatePost }), false);
    assert.equal(canViewPost({ user: admin, post: privatePost }), true);
  });

  await t.test('canViewPost enforces bidirectional blocking', () => {
    assert.equal(canViewPost({ user: bob, post: publicPost, isBlocked: true }), false);
    assert.equal(canViewPost({ user: admin, post: publicPost, isBlocked: true }), true);
  });

  await t.test('canViewPost restricts pending_review and blocked posts', () => {
    assert.equal(canViewPost({ user: alice, post: pendingPost }), true);
    assert.equal(canViewPost({ user: bob, post: pendingPost }), false);
    assert.equal(canViewPost({ user: admin, post: pendingPost }), true);
  });

  await t.test('canDeletePost allows owner and admin, denies unrelated user', () => {
    assert.equal(canDeletePost({ user: alice, post: publicPost }), true);
    assert.equal(canDeletePost({ user: admin, post: publicPost }), true);
    assert.equal(canDeletePost({ user: bob, post: publicPost }), false);
  });

  await t.test('canFollow prevents self-following and blocked users', () => {
    assert.equal(canFollow({ user: alice, targetUser: alice }), false);
    assert.equal(canFollow({ user: alice, targetUser: bob, isBlocked: false }), true);
    assert.equal(canFollow({ user: alice, targetUser: bob, isBlocked: true }), false);
  });

  await t.test('canMessage enforces privacy and blocking rules', () => {
    const strictUser = { _id: '507f191e810c19729de860ee', privacySettings: { allowDirectMessages: false } };
    assert.equal(canMessage({ user: alice, recipientUser: strictUser, isFollowing: false }), false);
    assert.equal(canMessage({ user: alice, recipientUser: strictUser, isFollowing: true }), true);
    assert.equal(canMessage({ user: alice, recipientUser: bob, isBlocked: true }), false);
  });
});
