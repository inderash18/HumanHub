import { authenticateAccessToken } from '../services/sessionService.js';

let ioInstance = null;

export const initializeSockets = (io) => {
  io.use(async (socket, next) => {
    try {
      const { user, session } = await authenticateAccessToken(socket.handshake.auth?.token);
      socket.data.userId = String(user._id);
      socket.data.sessionId = String(session._id);
      next();
    } catch { next(new Error('Authentication required')); }
  });

  io.on('connection', (socket) => {
    // Channel identity comes exclusively from the authenticated session.
    socket.join('user_' + socket.data.userId);
    socket.join('session_' + socket.data.sessionId);
    // Disconnect as soon as the access token expires. The client refreshes and reconnects.
    const encoded = socket.handshake.auth.token.split('.')[1];
    const { exp } = JSON.parse(Buffer.from(encoded, 'base64url').toString());
    const timer = setTimeout(() => socket.disconnect(true), Math.max(0, exp * 1000 - Date.now()));
    socket.on('disconnect', () => clearTimeout(timer));
    // Messages are created through the authenticated HTTP endpoint only.
  });
  return io;
};

export const getIO = () => ioInstance;
export default function socketHandler(io) { ioInstance = initializeSockets(io); }
