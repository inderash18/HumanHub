/**
 * Password Hashing & Verification Engine (OWASP ASVS V2.4.1 / V2.4.2 Compliant)
 * 
 * Implements Argon2id for all new passwords and transparent migration for legacy bcrypt hashes.
 */
import * as argon2 from '@node-rs/argon2';
import bcrypt from 'bcryptjs';

// OWASP ASVS Minimum Benchmark Configuration for Argon2id
const ARGON2_OPTIONS = {
  memoryCost: 65536, // 64 MB
  timeCost: 3,       // 3 iterations
  parallelism: 4,    // 4 threads
  outputLen: 32,
  algorithm: argon2.Algorithm.Argon2id
};

export const MAX_PASSWORD_LENGTH = 128;
export const MIN_PASSWORD_LENGTH = 8;

/**
 * Hash a password using Argon2id.
 */
export async function hashPassword(password) {
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH || password.length > MAX_PASSWORD_LENGTH) {
    throw new Error(`Password must be between ${MIN_PASSWORD_LENGTH} and ${MAX_PASSWORD_LENGTH} characters.`);
  }
  return argon2.hash(password, ARGON2_OPTIONS);
}

/**
 * Verify a plaintext password against a stored hash (supports Argon2id and legacy bcrypt).
 */
export async function verifyPassword(password, storedHash) {
  if (typeof password !== 'string' || typeof storedHash !== 'string' || !password || !storedHash) {
    return false;
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    return false;
  }

  // Check if hash is Argon2id
  if (storedHash.startsWith('$argon2id$') || storedHash.startsWith('$argon2i$') || storedHash.startsWith('$argon2d$')) {
    try {
      return await argon2.verify(storedHash, password);
    } catch {
      return false;
    }
  }

  // Check if hash is legacy bcrypt ($2a$, $2b$, $2y$)
  if (storedHash.startsWith('$2a$') || storedHash.startsWith('$2b$') || storedHash.startsWith('$2y$')) {
    try {
      return await bcrypt.compare(password, storedHash);
    } catch {
      return false;
    }
  }

  return false;
}

/**
 * Determine if a stored hash needs to be re-hashed to current Argon2id standards.
 */
export function needsRehash(storedHash) {
  if (!storedHash || typeof storedHash !== 'string') return true;
  // If stored hash is legacy bcrypt, it must be upgraded upon successful authentication
  if (storedHash.startsWith('$2a$') || storedHash.startsWith('$2b$') || storedHash.startsWith('$2y$')) {
    return true;
  }
  // If not starting with standard argon2id, rehash
  if (!storedHash.startsWith('$argon2id$')) {
    return true;
  }
  return false;
}

export default {
  hashPassword,
  verifyPassword,
  needsRehash,
  MAX_PASSWORD_LENGTH,
  MIN_PASSWORD_LENGTH
};
