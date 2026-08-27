import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  IoHeartOutline, IoHeart, 
  IoChatbubbleOutline, 
  IoPaperPlaneOutline, 
  IoBookmarkOutline, IoBookmark,
  IoMusicalNotes,
  IoEllipsisHorizontal,
  IoShieldCheckmark
} from 'react-icons/io5';
import { MdVerified } from 'react-icons/md';
import { toast } from 'react-hot-toast';
import api from '../services/api';

export default function ReelsPage() {
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [likedReels, setLikedReels] = useState({});

  useEffect(() => {
    fetchReels();
  }, []);

  const fetchReels = async () => {
    try {
      setLoading(true);
      const res = await api.get('/posts?limit=15');
      setReels(res.data?.data || res.data || []);
    } catch (err) {
      setReels([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleLike = (reelId) => {
    setLikedReels((prev) => ({
      ...prev,
      [reelId]: !prev[reelId]
    }));
  };

  const handleShare = (reelId) => {
    const url = `${window.location.origin}/p/${reelId}`;
    navigator.clipboard.writeText(url);
    toast.success('Reel link copied!');
  };

  return (
    <div className="w-full flex justify-center bg-black py-4 select-none">
      <div className="w-full max-w-[440px] reels-container flex flex-col gap-6 items-center">
        {loading && (
          <div className="w-full h-[85vh] max-h-[780px] bg-[#121212] rounded-2xl animate-pulse flex items-center justify-center">
            <IoShieldCheckmark className="text-4xl text-[#262626]" />
          </div>
        )}

        {!loading && reels.length > 0 && reels.map((reel) => {
          const isLiked = !!likedReels[reel._id];
          const mediaUrl = reel.mediaUrls && reel.mediaUrls.length > 0 ? reel.mediaUrls[0] : null;

          return (
            <div 
              key={reel._id} 
              className="reel-item relative w-full h-[88vh] max-h-[780px] bg-[#121212] rounded-2xl overflow-hidden border border-[#262626] shadow-2xl flex items-center justify-center"
            >
              {/* Media Content */}
              {mediaUrl ? (
                <img 
                  src={mediaUrl} 
                  alt={reel.title} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full p-8 flex flex-col justify-center items-center text-center bg-gradient-to-br from-[#121212] to-[#222]">
                  <IoShieldCheckmark className="text-5xl text-[#0095f6] mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">{reel.title}</h3>
                  <p className="text-sm text-[#a8a8a8] line-clamp-4">{reel.body}</p>
                </div>
              )}

              {/* Verified Humanity Pill Top Left */}
              <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 flex items-center gap-1.5 z-20">
                <span className="w-2 h-2 rounded-full bg-[#00ba7c] animate-pulse" />
                <span className="text-[11px] font-semibold text-white">Verified Human Reel</span>
              </div>

              {/* Bottom Creator Overlay */}
              <div className="absolute bottom-4 left-4 right-16 z-20 flex flex-col gap-2.5 text-white">
                <div className="flex items-center gap-2.5">
                  <Link to={`/u/${reel.author?.username}`} className="story-ring-active p-[1.5px]">
                    <img 
                      src={reel.author?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} 
                      alt={reel.author?.username} 
                      className="w-8 h-8 rounded-full object-cover bg-black"
                    />
                  </Link>
                  <Link to={`/u/${reel.author?.username}`} className="text-sm font-semibold hover:underline flex items-center gap-1">
                    {reel.author?.username || 'member'}
                    <MdVerified className="text-[#0095f6] text-sm" />
                  </Link>
                  <button className="text-xs font-semibold border border-white/40 hover:border-white px-2.5 py-1 rounded-lg">
                    Follow
                  </button>
                </div>

                <p className="text-xs line-clamp-2 drop-shadow-md">
                  {reel.body || reel.title}
                </p>

                {/* Audio Track */}
                <div className="flex items-center gap-2 text-xs text-white/80">
                  <IoMusicalNotes className="text-sm" />
                  <span className="truncate max-w-[200px]">Original Audio • {reel.author?.username || 'HumanHub'}</span>
                </div>
              </div>

              {/* Right Action Bar */}
              <div className="absolute bottom-4 right-3 z-20 flex flex-col items-center gap-5 text-white">
                <button 
                  onClick={() => toggleLike(reel._id)}
                  className="flex flex-col items-center gap-1 group"
                >
                  <div className={`p-2 rounded-full bg-black/40 backdrop-blur-md group-hover:scale-110 transition-transform ${isLiked ? 'text-[#ff3040]' : ''}`}>
                    {isLiked ? <IoHeart className="text-2xl" /> : <IoHeartOutline className="text-2xl" />}
                  </div>
                  <span className="text-xs font-semibold">{(reel.upvotes || 0) + (isLiked ? 1 : 0)}</span>
                </button>

                <Link 
                  to={`/p/${reel._id}`}
                  className="flex flex-col items-center gap-1 group"
                >
                  <div className="p-2 rounded-full bg-black/40 backdrop-blur-md group-hover:scale-110 transition-transform">
                    <IoChatbubbleOutline className="text-2xl" />
                  </div>
                  <span className="text-xs font-semibold">{reel.comments?.length || 0}</span>
                </Link>

                <button 
                  onClick={() => handleShare(reel._id)}
                  className="flex flex-col items-center gap-1 group"
                >
                  <div className="p-2 rounded-full bg-black/40 backdrop-blur-md group-hover:scale-110 transition-transform">
                    <IoPaperPlaneOutline className="text-2xl" />
                  </div>
                </button>

                <button className="flex flex-col items-center gap-1 group">
                  <div className="p-2 rounded-full bg-black/40 backdrop-blur-md group-hover:scale-110 transition-transform">
                    <IoBookmarkOutline className="text-2xl" />
                  </div>
                </button>

                {/* Rotating Vinyl Audio Disc */}
                <div className="w-8 h-8 rounded-full border-2 border-white overflow-hidden animate-spin shadow-lg">
                  <img 
                    src={reel.author?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} 
                    alt="audio" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          );
        })}

        {!loading && reels.length === 0 && (
          <div className="text-center py-20 text-[#737373]">
            <IoShieldCheckmark className="text-5xl mx-auto mb-3 text-[#363636]" />
            <p className="text-base font-semibold text-white">No reels yet</p>
            <p className="text-xs mt-1">Share a verified video reel to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
