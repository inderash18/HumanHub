import jwt from 'jsonwebtoken';
import asyncHandler from '../utils/asyncHandler.js';
import User from '../models/User.js';

export const protect = asyncHandler(async (req, res, next) => {
  let token;
  
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.accessToken) {
    token = req.cookies.accessToken; // fallback if cookies used
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized to access this route. No token provided.');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret_key_123');
    req.user = await User.findById(decoded.id).select('-passwordHash');
    if (!req.user) {
      res.status(401);
      throw new Error('User account no longer exists. Please sign up or log in again.');
    }
    next();
  } catch (error) {
    res.status(401);
    throw new Error(error.message || 'Not authorized. Token failed or expired.');
  }
});

export const optionalProtect = asyncHandler(async (req, res, next) => {
  let token;
  
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret_key_123');
      req.user = await User.findById(decoded.id).select('-passwordHash');
    } catch (error) {
      req.user = null;
    }
  } else {
    req.user = null;
  }

  next();
});
