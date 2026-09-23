import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Session from '../models/Session.js';
import generateToken from '../utils/generateToken.js';
import { jwtSecret } from '../config/security.js';

const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const lifetime = 7 * 24 * 60 * 60 * 1000;
export const cookieOptions = () => ({
  httpOnly: true, secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax', path: '/api/auth', maxAge: lifetime
});

export function clearCookieOptions() {
  const { maxAge, ...options } = cookieOptions();
  return options;
}

export function readRefreshCookie(req) {
  const part = (req.headers.cookie || '').split(';').map(s => s.trim())
    .find(s => s.startsWith('refreshToken='));
  if (!part) return null;
  try { return decodeURIComponent(part.slice('refreshToken='.length)); }
  catch { return null; }
}

export function publicUser(user) {
  const { _id, username, displayName, email, avatar, bio, role,
    followersCount, followingCount, postsCount, privacySettings } = user;
  return { _id, username, displayName, email, avatar, bio, role,
    followersCount, followingCount, postsCount, privacySettings };
}

export async function issueSession(user, res) {
  const raw = crypto.randomBytes(48).toString('hex');
  const session = await Session.create({
    user: user._id, tokenHash: hash(raw), expiresAt: new Date(Date.now() + lifetime)
  });
  res.cookie('refreshToken', raw, cookieOptions());
  return generateToken(user, session._id);
}

export async function authenticateAccessToken(token) {
  const decoded = jwt.verify(token, jwtSecret(), {
    algorithms: ['HS256'], issuer: 'humanhub', audience: 'humanhub-client'
  });
  if (!decoded.id || !decoded.sid) throw new Error('Invalid session');
  const [user, session] = await Promise.all([
    User.findById(decoded.id).select('-passwordHash'),
    Session.findOne({ _id: decoded.sid, user: decoded.id, revokedAt: null, expiresAt: { $gt: new Date() } })
  ]);
  if (!user || !session || user.isBanned || !user.emailVerified) {
    throw new Error('Session is no longer active');
  }
  return { user, session };
}

export async function rotateSession(req, res) {
  const raw = readRefreshCookie(req);
  if (!raw || !/^[a-f0-9]{96}$/.test(raw)) return null;
  // Rotate the secret atomically while keeping the session ID stable across tabs.
  const nextToken = crypto.randomBytes(48).toString('hex');
  const session = await Session.findOneAndUpdate({
    tokenHash: hash(raw), revokedAt: null, expiresAt: { $gt: new Date() }
  }, { $set: { tokenHash: hash(nextToken), expiresAt: new Date(Date.now() + lifetime) } }, { new: true });
  if (!session) return null;
  const user = await User.findById(session.user);
  if (!user || user.isBanned || !user.emailVerified) return null;
  res.cookie('refreshToken', nextToken, cookieOptions());
  return { token: generateToken(user, session._id), user: publicUser(user) };
}

export async function revokeSession(req) {
  const revoked = [];
  const raw = readRefreshCookie(req);
  if (raw) {
    const old = await Session.findOneAndUpdate({ tokenHash: hash(raw), revokedAt: null },
      { $set: { revokedAt: new Date() } });
    if (old) revoked.push(String(old._id));
  }
  const token = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
  if (token) {
    let decoded;
    try {
      decoded = jwt.verify(token, jwtSecret(), {
        algorithms: ['HS256'], issuer: 'humanhub', audience: 'humanhub-client'
      });
    } catch { return revoked; }
    if (decoded.sid) {
      await Session.updateMany({ _id: decoded.sid, user: decoded.id }, { $set: { revokedAt: new Date() } });
      revoked.push(String(decoded.sid));
    }
  }
  return revoked;
}
