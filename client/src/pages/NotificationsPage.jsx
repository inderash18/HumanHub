import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { IoHeart, IoPersonAdd, IoShieldCheckmark, IoChatbubble } from 'react-icons/io5';
import { MdVerified } from 'react-icons/md';
import api from '../services/api';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
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

  return (
    <div className="w-full max-w-[600px] mx-auto px-4 py-8 select-none">
      <h2 className="text-2xl font-bold text-white mb-6">Notifications</h2>

      <div className="flex flex-col gap-3">
        {/* System Proof-of-Humanity Alert */}
        <div className="p-4 bg-[#121212] border border-[#262626] rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#00ba7c]/10 text-[#00ba7c] flex items-center justify-center text-xl">
              <IoShieldCheckmark />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Proof of Humanity Active</p>
              <p className="text-xs text-[#737373]">Your account is verified as an authentic human contributor.</p>
            </div>
          </div>
          <span className="text-xs text-[#00ba7c] font-bold">100%</span>
        </div>

        {notifications.length > 0 ? (
          notifications.map((n) => (
            <div key={n._id} className="p-3 hover:bg-[#121212] rounded-xl flex items-center justify-between transition-colors">
              <div className="flex items-center gap-3">
                <img 
                  src={n.sender?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} 
                  alt="avatar" 
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <p className="text-sm text-[#f5f5f5]">
                    <span className="font-semibold text-white">{n.sender?.username || 'member'}</span>{' '}
                    {n.type === 'like' && 'liked your post.'}
                    {n.type === 'comment' && 'commented on your photo.'}
                    {n.type === 'follow' && 'started following you.'}
                  </p>
                  <span className="text-xs text-[#737373]">2h</span>
                </div>
              </div>

              {n.type === 'follow' ? (
                <button className="bg-[#0095f6] hover:bg-[#1877f2] text-white px-4 py-1.5 rounded-lg text-xs font-semibold">
                  Follow Back
                </button>
              ) : (
                <div className="w-10 h-10 bg-[#262626] rounded-md overflow-hidden flex items-center justify-center">
                  <IoHeart className="text-[#ff3040]" />
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-16 text-[#737373]">
            <p className="text-sm">No new notifications</p>
          </div>
        )}
      </div>
    </div>
  );
}
