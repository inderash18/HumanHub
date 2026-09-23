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

export async function issueSession(user, res, req = null) {
  const raw = crypto.randomBytes(48).toString('hex');
  const userAgent = req?.headers?.['user-agent'] ? String(req.headers['user-agent']).slice(0, 200) : 'Web Client';
  const ipAddress = req?.ip || req?.connection?.remoteAddress || null;
  const session = await Session.create({
    user: user._id, 
    tokenHash: hash(raw), 
    expiresAt: new Date(Date.now() + lifetime),
    userAgent,
    ipAddress,
    lastActive: new Date()
  });
  if (res && typeof res.cookie === 'function') {
    res.cookie('refreshToken', raw, cookieOptions());
  }
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
  // Advisory last active timestamp update
  Session.updateOne({ _id: session._id }, { $set: { lastActive: new Date() } }).catch(() => {});
  return { user, session };
}

export async function rotateSession(req, res) {
  const raw = readRefreshCookie(req);
  if (!raw || !/^[a-f0-9]{96}$/.test(raw)) return null;
  // Rotate the secret atomically while keeping the session ID stable across tabs.
  const nextToken = crypto.randomBytes(48).toString('hex');
  const userAgent = req?.headers?.['user-agent'] ? String(req.headers['user-agent']).slice(0, 200) : 'Web Client';
  const ipAddress = req?.ip || req?.connection?.remoteAddress || null;
  
  const session = await Session.findOneAndUpdate({
    tokenHash: hash(raw), revokedAt: null, expiresAt: { $gt: new Date() }
  }, { 
    $set: { 
      tokenHash: hash(nextToken), 
      expiresAt: new Date(Date.now() + lifetime),
      userAgent,
      ipAddress,
      lastActive: new Date()
    } 
  }, { new: true });
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

export async function listUserSessions(userId, currentSessionId = null) {
  const sessions = await Session.find({
    user: userId,
    revokedAt: null,
    expiresAt: { $gt: new Date() }
  }).sort({ lastActive: -1 }).limit(20);

  return sessions.map(s => ({
    id: s._id,
    userAgent: s.userAgent || 'Unknown Device',
    ipAddress: s.ipAddress ? s.ipAddress.replace(/^.*:/, '') : null, // Clean IPv4-mapped IPv6
    lastActive: s.lastActive || s.createdAt,
    createdAt: s.createdAt,
    isCurrent: currentSessionId ? String(s._id) === String(currentSessionId) : false
  }));
}

export async function revokeSessionById(userId, sessionId) {
  const session = await Session.findOneAndUpdate(
    { _id: sessionId, user: userId, revokedAt: null },
    { $set: { revokedAt: new Date() } }
  );
  return Boolean(session);
}

export async function revokeAllUserSessions(userId, exceptSessionId = null) {
  const query = { user: userId, revokedAt: null };
  if (exceptSessionId) {
    query._id = { $ne: exceptSessionId };
  }
  const result = await Session.updateMany(query, { $set: { revokedAt: new Date() } });
  return result.modifiedCount;
}
