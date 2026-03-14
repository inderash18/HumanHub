export const initializeSockets = (io) => {
  io.on('connection', (socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    socket.on('join_user_channel', (userId) => {
        socket.join(`user_${userId}`);
        console.log(`[Socket] User ${userId} joined their personal channel.`);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Disconnected: ${socket.id}`);
    });
  });
  
  // Expose emit logic for services to use
  return io;
};

// Global Store
let ioInstance = null;

const socketHandler = (io) => {
    ioInstance = initializeSockets(io);
}

export const getIO = () => ioInstance;

export default socketHandler;
