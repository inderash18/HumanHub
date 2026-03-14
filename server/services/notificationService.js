import { getIO } from '../socket/socketHandler.js';

export const sendNotification = (userId, payload) => {
  const io = getIO();
  if (io) {
    io.to(`user_${userId}`).emit('notification:new', {
       type: payload.type,
       message: payload.message,
       link: payload.link,
       timestamp: new Date()
    });
  }
};
