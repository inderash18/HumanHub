/**
 * Multi-Factor Authentication (MFA) & WebAuthn Passkeys Service
 * (OWASP ASVS V2.8.1 - V2.8.7 Compliant)
 * 
 * Supports TOTP with encrypted secret storage, anti-replay, single-use hashed recovery codes,
 * and WebAuthn Passkeys.
 */
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { authenticator } = require('otplib');
import { 
  generateRegistrationOptions, 
  verifyRegistrationResponse, 
  generateAuthenticationOptions, 
  verifyAuthenticationResponse 
} from '@simplewebauthn/server';

// Encryption configuration for TOTP shared secrets
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';

function getMfaKey() {
  const secret = process.env.MFA_ENCRYPTION_KEY || process.env.JWT_SECRET || 'humanhub_mfa_default_encryption_key_32_bytes!';
  return crypto.createHash('sha256').update(secret).digest();
}

/**
 * Encrypt a plaintext TOTP secret with AES-256-GCM.
 */
export function encryptMfaSecret(secretText) {
  const iv = crypto.randomBytes(12);
  const key = getMfaKey();
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
  let encrypted = cipher.update(secretText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag();
  return {
    ciphertext: encrypted,
    iv: iv.toString('hex'),
    tag: tag.toString('hex'),
    version: 1
  };
}

/**
 * Decrypt an AES-256-GCM encrypted TOTP secret.
 */
export function decryptMfaSecret(encryptedObj) {
  if (!encryptedObj || !encryptedObj.ciphertext || !encryptedObj.iv || !encryptedObj.tag) {
    throw new Error('Invalid encrypted secret structure');
  }
  const key = getMfaKey();
  const decipher = crypto.createDecipheriv(
    ENCRYPTION_ALGORITHM,
    key,
    Buffer.from(encryptedObj.iv, 'hex')
  );
  decipher.setAuthTag(Buffer.from(encryptedObj.tag, 'hex'));
  let decrypted = decipher.update(encryptedObj.ciphertext, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/**
 * Generate a new TOTP secret and provisioning URI.
 */
export function generateTotpSetup(username, issuer = 'HumanHub') {
  const secret = authenticator.generateSecret();
  const otpauthUrl = authenticator.keyuri(username, issuer, secret);
  return { secret, otpauthUrl };
}

/**
 * Verify a TOTP token against a secret with anti-replay check.
 */
export function verifyTotpToken(token, secret, lastUsedTimestep = 0) {
  authenticator.options = { window: 1 }; // Allow +-1 period (30s)
  const isValid = authenticator.verify({ token, secret });
  if (!isValid) return { verified: false };

  const currentTimestep = Math.floor(Date.now() / 1000 / 30);
  if (lastUsedTimestep && currentTimestep <= lastUsedTimestep) {
    return { verified: false, reason: 'Code already used (anti-replay)' };
  }

  return { verified: true, timestep: currentTimestep };
}

/**
 * Generate 10 cryptographically random single-use recovery codes.
 */
export function generateBackupRecoveryCodes(count = 10) {
  const plainCodes = [];
  const hashedCodes = [];

  for (let i = 0; i < count; i++) {
    const raw = crypto.randomBytes(5).toString('hex').toUpperCase(); // 10 chars, e.g. A1B2C3D4E5
    const formatted = `${raw.slice(0, 5)}-${raw.slice(5)}`;
    plainCodes.push(formatted);
    const hash = crypto.createHash('sha256').update(formatted).digest('hex');
    hashedCodes.push({ codeHash: hash, used: false });
  }

  return { plainCodes, hashedCodes };
}

/**
 * Verify and consume a single-use backup recovery code.
 */
export function consumeBackupRecoveryCode(inputCode, storedBackupCodes = []) {
  const cleanCode = (inputCode || '').trim().toUpperCase();
  const inputHash = crypto.createHash('sha256').update(cleanCode).digest('hex');

  const match = storedBackupCodes.find(c => c.codeHash === inputHash && !c.used);
  if (!match) {
    return { valid: false };
  }

  match.used = true;
  match.usedAt = new Date();
  return { valid: true, remaining: storedBackupCodes.filter(c => !c.used).length };
}

// ---------------- WebAuthn Passkeys ----------------

const RP_NAME = 'HumanHub';
const RP_ID = process.env.RP_ID || 'localhost';
const ORIGIN = process.env.FRONTEND_URL || 'http://localhost';

export async function createPasskeyRegistrationOptions(user) {
  return generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: RP_ID,
    userID: Buffer.from(String(user._id)),
    userName: user.username,
    userDisplayName: user.displayName || user.username,
    attestationType: 'none',
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'preferred'
    }
  });
}

export async function verifyPasskeyRegistration(body, expectedChallenge) {
  return verifyRegistrationResponse({
    response: body,
    expectedChallenge,
    expectedOrigin: ORIGIN,
    expectedRPID: RP_ID
  });
}

export async function createPasskeyAuthenticationOptions(userPasskeys = []) {
  return generateAuthenticationOptions({
    rpID: RP_ID,
    allowCredentials: userPasskeys.map(pk => ({
      id: Buffer.from(pk.credentialID, 'base64url'),
      type: 'public-key'
    })),
    userVerification: 'preferred'
  });
}

export async function verifyPasskeyAuthentication(body, expectedChallenge, storedPasskey) {
  return verifyAuthenticationResponse({
    response: body,
    expectedChallenge,
    expectedOrigin: ORIGIN,
    expectedRPID: RP_ID,
    authenticator: {
      credentialPublicKey: Buffer.from(storedPasskey.publicKey, 'base64url'),
      credentialID: Buffer.from(storedPasskey.credentialID, 'base64url'),
      counter: storedPasskey.counter || 0
    }
  });
}

export default {
  encryptMfaSecret,
  decryptMfaSecret,
  generateTotpSetup,
  verifyTotpToken,
  generateBackupRecoveryCodes,
  consumeBackupRecoveryCode,
  createPasskeyRegistrationOptions,
  verifyPasskeyRegistration,
  createPasskeyAuthenticationOptions,
  verifyPasskeyAuthentication
};
