import rateLimit from 'express-rate-limit';

// Key generator preferring authenticated user ID or falling back to client IP
const resolveClientKey = (req) => {
  if (req.user && req.user._id) {
    return `user_${req.user._id}`;
  }
  return req.ip;
};

// General API abuse limiter - handles normal browsing across multiple tabs & SPA polling
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'test' ? 5000 : 1500, // 1500 requests / 15 min per user/IP
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: resolveClientKey,
  validate: { xForwardedForHeader: false },
  handler: (req, res, _next, options) => {
    const retryAfter = Math.ceil(options.windowMs / 1000);
    res.status(429).json({
      success: false,
      message: 'Too many requests. Please slow down and try again.',
      retryAfter
    });
  }
});

// Targeted authentication limiter to prevent credential brute-forcing
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'test' ? 1000 : 45, // 45 attempts / 15 min
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: resolveClientKey,
  validate: { xForwardedForHeader: false },
  handler: (req, res, _next, options) => {
    const retryAfter = Math.ceil(options.windowMs / 1000);
    res.status(429).json({
      success: false,
      message: 'Too many authentication attempts. Please try again later.',
      retryAfter
    });
  }
});

// Write / mutation limiter for creating posts, comments, stories
export const mutationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 2000 : 300,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: resolveClientKey,
  validate: { xForwardedForHeader: false },
  handler: (req, res, _next, options) => {
    const retryAfter = Math.ceil(options.windowMs / 1000);
    res.status(429).json({
      success: false,
      message: 'Too many submissions. Please wait a moment before trying again.',
      retryAfter
    });
  }
});

