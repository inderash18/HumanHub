import { create } from 'zustand';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin;

let socketInstance = null;

try {
  socketInstance = io(SOCKET_URL, {
    autoConnect: true,
    withCredentials: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
  });
} catch (err) {
  console.warn('[Socket] Failed to initialize Socket.io client:', err);
}

export const useSocketStore = create((set) => ({
  socket: socketInstance,
  connected: false,
  setConnected: (connected) => set({ connected })
}));

if (socketInstance) {
  socketInstance.on('connect', () => {
    useSocketStore.getState().setConnected(true);
  });

  socketInstance.on('disconnect', () => {
    useSocketStore.getState().setConnected(false);
  });
}

export default useSocketStore;
