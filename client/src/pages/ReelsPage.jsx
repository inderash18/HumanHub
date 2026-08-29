import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Heart,
  MessageSquare,
  Share2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import UserAvatar from '../components/common/UserAvatar';

export default function ReelsPage() {
  const { user } = useAuthStore();
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [likedReels, setLikedReels] = useState({});
  const [reelLikes, setReelLikes] = useState({});

  useEffect(() => {
    fetchReels();
  }, []);

  const fetchReels = async () => {
    try {
      setLoading(true);
      const res = await api.get('/posts?limit=15');
      const data = res.data?.data || res.data || [];
      const mediaPosts = data.filter(p => p.mediaUrls && p.mediaUrls.length > 0);
      const displayData = mediaPosts.length > 0 ? mediaPosts : data;
      setReels(displayData);

      const initialLiked = {};
      const initialCounts = {};
      displayData.forEach(r => {
        initialLiked[r._id] = Boolean(r.isLiked ?? r.hasLiked ?? (r.userVote === 1));
        initialCounts[r._id] = r.upvotes || 0;
      });
      setLikedReels(initialLiked);
      setReelLikes(initialCounts);
    } catch (err) {
      setReels([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleLike = async (id) => {
    const nextLiked = !likedReels[id];
    setLikedReels(prev => ({ ...prev, [id]: nextLiked }));
    setReelLikes(prev => ({
      ...prev,
      [id]: nextLiked ? (prev[id] || 0) + 1 : Math.max(0, (prev[id] || 0) - 1)
    }));

    try {
      await api.post(`/posts/${id}/vote`, { value: nextLiked ? 1 : 0 });
    } catch (err) {
      toast.error('Failed to update like');
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto py-6 px-4 select-none">
      <div className="flex flex-col gap-6">
        {loading ? (
          <div className="py-20 text-center text-xs text-hub-text-tertiary">
            Loading stories...
          </div>
        ) : reels.length > 0 ? (
          reels.map((reel) => {
            const mediaUrl = reel.mediaUrls && reel.mediaUrls.length > 0 ? reel.mediaUrls[0] : null;
            const isLiked = likedReels[reel._id];

            return (
              <div 
                key={reel._id} 
                className="relative aspect-[9/16] bg-hub-surface border border-hub-border rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between p-4"
              >
                {mediaUrl && (
                  <img 
                    src={mediaUrl} 
                    alt={reel.title} 
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none" />

                {/* Top Bar */}
                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserAvatar 
                      src={reel.author?.avatar} 
                      name={reel.author?.displayName || reel.author?.username} 
                      size="sm" 
                    />
                    <span className="text-xs font-bold text-white">@{reel.author?.username}</span>
                  </div>
                </div>

                {/* Bottom Details & Actions */}
                <div className="relative z-10 flex items-end justify-between">
                  <div className="max-w-[80%] space-y-1">
                    <p className="text-xs text-white font-bold">{reel.title}</p>
                    <p className="text-[11px] text-white/80 line-clamp-2">{reel.body}</p>
                  </div>

                  <div className="flex flex-col items-center gap-3">
                    <button 
                      onClick={() => toggleLike(reel._id)}
                      className={`p-2.5 rounded-full bg-black/60 backdrop-blur-md text-white ${isLiked ? 'text-hub-accent' : ''}`}
                    >
                      <Heart className={`w-5 h-5 ${isLiked ? 'fill-current text-hub-accent' : ''}`} />
                    </button>
                    <Link 
                      to={`/p/${reel._id}`}
                      className="p-2.5 rounded-full bg-black/60 backdrop-blur-md text-white"
                    >
                      <MessageSquare className="w-5 h-5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-20 bg-hub-surface border border-hub-border rounded-3xl p-8 shadow-xl">
            <p className="text-sm font-bold text-hub-text-primary">No Stories Yet</p>
            <p className="text-xs text-hub-text-secondary mt-1">Shared moments and stories will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
