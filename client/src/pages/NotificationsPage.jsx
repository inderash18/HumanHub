import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Heart, 
  MessageCircle, 
  UserPlus, 
  Sparkles,
  Check
} from 'lucide-react';
import api from '../services/api';
import UserAvatar from '../components/common/UserAvatar';
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
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffSecs = Math.floor((now - date) / 1000);
    if (diffSecs < 60) return `${Math.max(1, diffSecs)}s`;
    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) return `${diffMins}m`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d`;
    return `${Math.floor(diffDays / 7)}w`;
  };

  return (
    <div className="w-full max-w-[600px] mx-auto px-4 py-6 md:py-10 select-none">
      <h1 className="text-2xl font-bold text-[var(--ig-text-primary)] mb-6">
        Notifications
      </h1>

      <div className="space-y-1">
        {loading ? (
          <div className="py-20 text-center text-xs text-[var(--ig-text-tertiary)]">
            Loading notifications...
          </div>
        ) : notifications.length > 0 ? (
          notifications.map((n) => (
            <div 
              key={n._id}
              onClick={() => handleNotificationClick(n)}
              className="flex items-center justify-between gap-3 p-3 hover:bg-[var(--ig-hover)] rounded-xl cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <UserAvatar 
                  src={n.sender?.avatar} 
                  name={n.sender?.username} 
                  size="md"
                  hasStory={true}
                />
                <div className="text-sm text-[var(--ig-text-primary)] leading-snug">
                  <span className="font-semibold mr-1">{n.sender?.username || 'someone'}</span>
                  <span className="font-normal text-[var(--ig-text-primary)]">
                    {n.message || (n.type === 'like' ? 'liked your photo.' : n.type === 'comment' ? 'commented on your post.' : 'started following you.')}
                  </span>
                  <span className="text-xs text-[var(--ig-text-tertiary)] ml-1.5">
                    {formatTimestamp(n.createdAt)}
                  </span>
                </div>
              </div>

              {n.post?.mediaUrls?.[0] ? (
                <img 
                  src={n.post.mediaUrls[0]} 
                  alt="Post thumbnail" 
                  className="w-11 h-11 object-cover rounded-md flex-shrink-0"
                />
              ) : n.type === 'follow' ? (
                <button className="ig-btn-secondary text-xs px-4 py-1.5 flex-shrink-0">
                  Following
                </button>
              ) : (
                <div className="w-2 h-2 rounded-full bg-[var(--ig-primary-button)] flex-shrink-0" />
              )}
            </div>
          ))
        ) : (
          <div className="py-20">
            <EmptyState
              icon={Sparkles}
              title="Activity On Your Posts"
              description="When someone likes or comments on one of your posts, you'll see it here."
            />
          </div>
        )}
      </div>
    </div>
  );
}
