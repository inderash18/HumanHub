import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import { toast } from 'react-hot-toast';

export const useSocket = () => {
    const { user, isAuthenticated } = useAuthStore();
    const addNotification = useNotificationStore(state => state.addNotification);
    const socketRef = useRef(null);

    useEffect(() => {
        if (!isAuthenticated || !user) {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
            return;
        }

        if (!socketRef.current) {
            socketRef.current = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
                withCredentials: true,
                autoConnect: true,
            });

            socketRef.current.on('connect', () => {
                socketRef.current.emit('join_user_channel', user._id);
            });

            socketRef.current.on('notification:new', (payload) => {
                addNotification(payload);
                toast(`New notification: ${payload.message}`, { icon: '🔔' });
            });

            socketRef.current.on('post:verified', (payload) => {
                // Allows specific page listeners to see
                window.dispatchEvent(new CustomEvent('post:verified:event', { detail: payload }));
                
                if (payload.status === 'published') {
                   toast.success('Your post passed the human verification pipeline!');
                } else if (payload.status === 'rejected') {
                   toast.error('Your post was blocked due to AI characteristics.');
                }
            });
        }

        return () => {
             // Cleanup if component fully unmounts, though usually scoped globally in App
        };
    }, [isAuthenticated, user, addNotification]);

    return socketRef.current;
};
