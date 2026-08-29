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
import EmptyState from '../components/common/EmptyState';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications');
      setNotifications(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications((prev) => prev.map(n => ({ ...n, read: true })));
      toast.success('All notifications marked as read ✨');
    } catch (err) {
      toast.error('Failed to mark notifications as read');
    }
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.read) {
      try {
        await api.put(`/notifications/${notif._id}/read`);
        setNotifications((prev) => prev.map(n => n._id === notif._id ? { ...n, read: true } : n));
      } catch (err) {}
    }

    if (notif.post?._id || notif.post) {
      navigate(`/p/${notif.post._id || notif.post}`);
    } else if (notif.sender?.username) {
      navigate(`/u/${notif.sender.username}`);
    }
  };

  const formatTimestamp = (dateStr) => {
    if (!dateStr) return 'Just now';
    const date = new Date(dateStr);
    const now = new Date();
    const diffSecs = Math.floor((now - date) / 1000);
    if (diffSecs < 60) return `${Math.max(1, diffSecs)}s ago`;
    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-8 select-none space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)] flex items-center justify-center text-[var(--accent)] text-xl shadow-md">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-display text-xl sm:text-2xl font-bold text-[var(--text-primary)]">Notifications</h1>
            <p className="text-xs text-[var(--text-tertiary)]">Stay updated with your likes, comments, and new followers.</p>
          </div>
        </div>

        {notifications.some(n => !n.read) && (
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
          <div className="py-16 text-center text-xs text-[var(--text-tertiary)]">
            Loading notifications...
          </div>
        ) : notifications.length > 0 ? (
          notifications.map((n) => (
            <div 
              key={n._id} 
              onClick={() => handleNotificationClick(n)}
              className={`p-3.5 rounded-2xl border transition-colors cursor-pointer flex items-center justify-between ${
                n.read 
                  ? 'bg-[var(--surface)] border-[var(--border)] hover:bg-[var(--surface-elevated)]' 
                  : 'bg-[var(--surface-elevated)] border-[var(--accent)]/40 hover:border-[var(--accent)] shadow-sm'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative flex-shrink-0">
                  <UserAvatar 
                    src={n.sender?.avatar} 
                    name={n.sender?.displayName || n.sender?.username} 
                    size="sm"
                  />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[10px]">
                    {n.type === 'like' && <Heart className="w-2.5 h-2.5 text-[var(--accent)] fill-current" />}
                    {n.type === 'comment' && <MessageSquare className="w-2.5 h-2.5 text-[var(--violet)]" />}
                    {n.type === 'follow' && <UserPlus className="w-2.5 h-2.5 text-[var(--cyan)]" />}
                  </div>
                </div>

                <div className="min-w-0">
                  <p className="text-xs text-[var(--text-primary)] leading-snug">
                    <span className="font-bold text-[var(--text-primary)]">{n.sender?.displayName || n.sender?.username || 'someone'}</span>{' '}
                    <span className="text-[var(--text-secondary)]">{n.text || n.body || 'interacted with your post.'}</span>
                  </p>
                  <span className="text-[10px] text-[var(--text-tertiary)] mt-0.5 block">
                    {formatTimestamp(n.createdAt)}
                  </span>
                </div>
              </div>

              {!n.read && (
                <span className="w-2 h-2 rounded-full bg-[var(--accent)] flex-shrink-0" />
              )}
            </div>
          ))
        ) : (
          <EmptyState
            icon={Bell}
            title="All Caught Up"
            description="You don't have any notifications right now."
          />
        )}
      </div>
    </div>
  );
}
