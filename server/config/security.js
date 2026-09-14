import 'dotenv/config';

export function jwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32 || /your_.*secret|dev_secret/i.test(secret)) {
    throw new Error('Set JWT_SECRET to a unique random value of at least 32 characters.');
  }
  return secret;
}

export function allowedOrigins() {
  const configured = (process.env.FRONTEND_URL || '').split(',').map(s => s.trim()).filter(Boolean);
  return new Set(process.env.NODE_ENV === 'production'
    ? configured
    : [...configured, 'http://localhost:3000', 'http://localhost:5173']);
}

export function corsOrigin(origin, callback) {
  callback(null, !origin || allowedOrigins().has(origin));
}

export function requireTrustedOrigin(req, res, next) {
  if ((req.headers.origin && !allowedOrigins().has(req.headers.origin)) ||
      req.headers['sec-fetch-site'] === 'cross-site' && !req.headers.origin) {
    return res.status(403).json({ success: false, message: 'Origin is not allowed.' });
  }
  next();
}
