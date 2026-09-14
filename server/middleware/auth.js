import asyncHandler from '../utils/asyncHandler.js';
import { authenticateAccessToken } from '../services/sessionService.js';

const bearer = req => req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];

export const protect = asyncHandler(async (req, res, next) => {
  const token = bearer(req);
  if (!token) return res.status(401).json({ success: false, message: 'Please sign in.' });
  try {
    const { user, session } = await authenticateAccessToken(token);
    req.user = user;
    req.session = session;
  } catch {
    return res.status(401).json({ success: false, message: 'Session expired. Please sign in again.' });
  }
  next();
});

export const optionalProtect = asyncHandler(async (req, res, next) => {
  req.user = null;
  const token = bearer(req);
  if (token) {
    try { req.user = (await authenticateAccessToken(token)).user; } catch { /* Public request. */ }
  }
  next();
});
