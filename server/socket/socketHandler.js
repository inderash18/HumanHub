import Message from '../models/Message.js';

export const initializeSockets = (io) => {
  io.on('connection', (socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    // Join personal notification/message channel
    socket.on('join_user_channel', (userId) => {
        socket.join(`user_${userId}`);
        console.log(`[Socket] User ${userId} joined their personal channel.`);
    });

    // Real-time Chat Messaging Event Loop
    socket.on('message:send', async (payload) => {
      const { senderId, receiverId, text } = payload;
      
      try {
        if (!senderId || !receiverId || !text) return;

        // 1. Save message to database
        const message = await Message.create({
          sender: senderId,
          receiver: receiverId,
          text
        });

        // 2. Populate user metadata
        await message.populate('sender', 'username avatar trustScore');
        await message.populate('receiver', 'username avatar trustScore');

        // 3. Emit in real-time to both recipient and sender channels
        io.to(`user_${receiverId}`).emit('message:receive', message);
        io.to(`user_${senderId}`).emit('message:sent', message);
        
        console.log(`[Socket Chat] Message sent from ${senderId} to ${receiverId}`);
      } catch (err) {
        console.error('[Socket Chat Error]', err);
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Disconnected: ${socket.id}`);
    });
  });
  
  return io;
};

// Global Store
let ioInstance = null;

const socketHandler = (io) => {
    ioInstance = initializeSockets(io);
}

export const getIO = () => ioInstance;

export default socketHandler;
