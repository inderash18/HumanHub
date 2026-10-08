import 'dotenv/config';

export function jwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32 || /your_.*secret|dev_secret/i.test(secret)) {
    throw new Error('Set JWT_SECRET to a unique random value of at least 32 characters.');
  }
  return secret;
}

export function allowedOrigins() {
  const rawOrigins = `${process.env.FRONTEND_URL || ''},${process.env.CORS_ORIGIN || ''}`;
  const configured = rawOrigins
    .split(',')
    .map(s => s.trim().replace(/\/+$/, ''))
    .filter(Boolean);

  return new Set(process.env.NODE_ENV === 'production'
    ? (configured.length > 0 ? configured : ['http://localhost:3000'])
    : [...configured, 'http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001']);
}

export function corsOrigin(origin, callback) {
  if (!origin) return callback(null, true);
  const cleanOrigin = origin.replace(/\/+$/, '');
  const allowed = allowedOrigins();
  if (allowed.has(cleanOrigin) || allowed.has('*')) {
    return callback(null, true);
  }
  return callback(null, false);
}

export function requireTrustedOrigin(req, res, next) {
  const origin = req.headers.origin ? req.headers.origin.replace(/\/+$/, '') : null;
  if ((origin && !allowedOrigins().has(origin)) ||
      (req.headers['sec-fetch-site'] === 'cross-site' && !origin)) {
    return res.status(403).json({ success: false, message: 'Origin is not allowed.' });
  }
  next();
}
