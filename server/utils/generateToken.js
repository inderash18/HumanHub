import jwt from 'jsonwebtoken';
import { jwtSecret } from '../config/security.js';

export default function generateToken(user, sessionId) {
  return jwt.sign({ id: String(user._id), sid: String(sessionId) }, jwtSecret(), {
    expiresIn: '15m', algorithm: 'HS256', issuer: 'humanhub', audience: 'humanhub-client'
  });
}
