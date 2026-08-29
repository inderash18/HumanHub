import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  Heart, 
  MessageSquare, 
  UserPlus, 
  CheckCheck
} from 'lucide-react';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import UserAvatar from '../components/common/UserAvatar';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Real-time notification updates
  useEffect(() => {
    const handleNewNotif = (e) => {
      const data = e.detail;
      if (data?.notification) {
        setNotifications((prev) => [data.notification, ...prev]);
      } else {
        fetchNotifications();
      }
    };
    window.addEventListener('notification:new:event', handleNewNotif);
    return () => window.removeEventListener('notification:new:event', handleNewNotif);
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications');
      setNotifications(res.data || []);
    } catch (err) {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setNotifications((prev) => prev.map(n => ({ ...n, isRead: true })));
      toast.success('All notifications marked as read ✨');
    } catch (err) {
      toast.error('Failed to mark notifications as read');
    }
  };

  const formatTimestamp = (dateStr) => {
    if (!dateStr) return 'Just now';
    const date = new Date(dateStr);
    const now = new Date();
    const diffSecs = Math.floor((now - date) / 1000);
    if (diffSecs < 60) return `${diffSecs}s ago`;
    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-8 select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 mb-6 border-b border-hub-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-hub-surface-elevated border border-hub-border flex items-center justify-center text-hub-accent text-xl shadow-md">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-display text-xl sm:text-2xl font-bold text-hub-text-primary">Notifications</h1>
            <p className="text-xs text-hub-text-tertiary">Stay updated with your likes, comments, and new followers.</p>
          </div>
        </div>

        {notifications.some(n => !n.isRead) && (
          <Button
            variant="secondary"
            size="sm"
            onClick={handleMarkAllRead}
            icon={CheckCheck}
          >
            Mark all read
          </Button>
        )}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-16 text-center text-xs text-hub-text-tertiary">
            Loading notifications...
          </div>
        ) : notifications.length > 0 ? (
          notifications.map((n) => (
            <div 
              key={n._id} 
              onClick={() => {
                if (n.postId) navigate(`/p/${n.postId}`);
                else if (n.sender?.username) navigate(`/u/${n.sender.username}`);
              }}
              className={`p-3.5 rounded-2xl border transition-colors cursor-pointer flex items-center justify-between ${
                n.isRead 
                  ? 'bg-hub-surface border-hub-border hover:bg-hub-surface-elevated' 
                  : 'bg-hub-surface-elevated border-hub-accent/40 hover:border-hub-accent shadow-sm'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative flex-shrink-0">
                  <UserAvatar 
                    src={n.sender?.avatar} 
                    name={n.sender?.displayName || n.sender?.username} 
                    size="sm"
                  />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-hub-surface border border-hub-border flex items-center justify-center text-[10px]">
                    {n.type === 'like' && <Heart className="w-2.5 h-2.5 text-hub-accent fill-current" />}
                    {n.type === 'comment' && <MessageSquare className="w-2.5 h-2.5 text-hub-violet" />}
                    {n.type === 'follow' && <UserPlus className="w-2.5 h-2.5 text-hub-cyan" />}
                  </div>
                </div>

                <div className="min-w-0">
                  <p className="text-xs text-hub-text-primary leading-snug">
                    <span className="font-bold text-hub-text-primary">{n.sender?.displayName || n.sender?.username || 'someone'}</span>{' '}
                    <span className="text-hub-text-secondary">{n.body || 'interacted with your post.'}</span>
                  </p>
                  <span className="text-[10px] text-hub-text-tertiary mt-0.5 block">
                    {formatTimestamp(n.createdAt)}
                  </span>
                </div>
              </div>

              {!n.isRead && (
                <span className="w-2 h-2 rounded-full bg-hub-accent flex-shrink-0" />
              )}
            </div>
          ))
        ) : (
          <EmptyState
            icon={Bell}
            title="No notifications yet"
            description="When someone likes your posts, comments, or follows you, you'll see it here."
          />
        )}
      </div>
    </div>
  );
}
