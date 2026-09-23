import { create } from 'zustand';
import { io } from 'socket.io-client';
import { useAuthStore } from './authStore';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin;

let socketInstance = null;

function createSocketConnection(token) {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
  if (!token) return null;

  try {
    socketInstance = io(SOCKET_URL, {
      autoConnect: true,
      auth: { token },
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socketInstance.on('connect', () => {
      useSocketStore.getState().setConnected(true);
    });

    socketInstance.on('disconnect', () => {
      useSocketStore.getState().setConnected(false);
    });

    socketInstance.on('connect_error', (err) => {
      // Avoid spamming error console on expired/unauthorized tokens
      useSocketStore.getState().setConnected(false);
    });

    return socketInstance;
  } catch (err) {
    return null;
  }
}

export const useSocketStore = create((set) => ({
  socket: null,
  connected: false,
  setConnected: (connected) => set({ connected }),
  initSocket: (token) => {
    const s = createSocketConnection(token);
    set({ socket: s });
  },
  disconnectSocket: () => {
    if (socketInstance) {
      socketInstance.disconnect();
      socketInstance = null;
    }
    set({ socket: null, connected: false });
  }
}));

// Automatically sync with auth store
useAuthStore.subscribe((state) => {
  if (state.token && state.isAuthenticated) {
    if (!socketInstance) {
      useSocketStore.getState().initSocket(state.token);
    }
  } else {
    useSocketStore.getState().disconnectSocket();
  }
});

// Initialize if token is already present
const initialToken = useAuthStore.getState().token;
if (initialToken) {
  useSocketStore.getState().initSocket(initialToken);
}

export default useSocketStore;
