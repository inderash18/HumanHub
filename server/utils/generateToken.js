import jwt from 'jsonwebtoken';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'dev_secret_key_123', {
    expiresIn: '15m',
  });
};

export const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret', {
    expiresIn: '7d', // 7 days
  });
};

export default generateToken;
