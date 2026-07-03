import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import { toast } from 'react-hot-toast';

let socketInstance = null;

export const useSocket = () => {
    const { user, isAuthenticated } = useAuthStore();
    const addNotification = useNotificationStore(state => state.addNotification);

    useEffect(() => {
        if (!isAuthenticated || !user) {
            if (socketInstance) {
                socketInstance.disconnect();
                socketInstance = null;
            }
            return;
        }

        if (!socketInstance) {
            socketInstance = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
                withCredentials: true,
                autoConnect: true,
            });

            socketInstance.on('connect', () => {
                socketInstance.emit('join_user_channel', user._id);
            });

            socketInstance.on('notification:new', (payload) => {
                addNotification(payload);
                toast(`New notification: ${payload.message}`, { icon: '🔔' });
            });

            socketInstance.on('post:verified', (payload) => {
                window.dispatchEvent(new CustomEvent('post:verified:event', { detail: payload }));
                
                if (payload.status === 'published') {
                   toast.success('Your post passed the human verification pipeline!');
                } else if (payload.status === 'rejected') {
                   toast.error('Your post was blocked due to AI characteristics.');
                }
            });
        }
    }, [isAuthenticated, user, addNotification]);

    return socketInstance;
};
