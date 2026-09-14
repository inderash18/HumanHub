import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import { refreshAccessToken } from '../services/api';
import { toast } from 'react-hot-toast';

let socketInstance = null;

export const useSocket = () => {
  const { token, isAuthenticated } = useAuthStore();
  const addNotification = useNotificationStore(state => state.addNotification);

  useEffect(() => {
    if (!isAuthenticated || !token) return;
    const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
      auth: { token }, withCredentials: true
    });
    socketInstance = socket;
    let active = true;
    const renew = async () => {
      try { await refreshAccessToken(); }
      catch (error) {
        if (active && error.response?.status === 401) useAuthStore.getState().logout();
      }
    };
    socket.on('connect_error', error => {
      if (error.message === 'Authentication required') renew();
    });
    socket.on('disconnect', reason => {
      if (active && reason === 'io server disconnect') renew();
    });
    socket.on('notification:new', payload => {
      addNotification(payload);
      toast(payload.text || 'New notification', { icon: '🔔' });
    });
    for (const event of ['message:receive', 'message:sent', 'post:voted']) {
      socket.on(event, payload => window.dispatchEvent(new CustomEvent(event + ':event', { detail: payload })));
    }
    socket.on('post:verified', payload => {
      window.dispatchEvent(new CustomEvent('post:verified:event', { detail: payload }));
      if (payload.status === 'published') toast.success('Your post has been approved.');
      else if (payload.status === 'blocked') toast.error('Your post was blocked after review.');
    });
    return () => {
      active = false;
      socket.removeAllListeners();
      socket.disconnect();
      if (socketInstance === socket) socketInstance = null;
    };
  }, [token, isAuthenticated, addNotification]);

  return socketInstance;
};
