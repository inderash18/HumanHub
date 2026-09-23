import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Heart, 
  MessageCircle, 
  Send, 
  Bookmark, 
  MoreHorizontal,
  Volume2, 
  VolumeX,
  Music,
  Play,
  Sparkles
} from 'lucide-react';
import api from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import UserAvatar from '../components/common/UserAvatar';
import EmptyState from '../components/common/EmptyState';
import { toast } from 'react-hot-toast';

export default function ReelsPage() {
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeReelIndex, setActiveReelIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [likesState, setLikesState] = useState({});
  const [savedState, setSavedState] = useState({});

  const containerRef = useRef(null);

  useEffect(() => {
    fetchReels();
  }, []);

  const fetchReels = async () => {
    try {
      setLoading(true);
      const res = await api.get('/posts?limit=30');
      const allPosts = res.data?.data || res.data?.posts || res.data || [];
      // Filter posts with video or images
      const videoPosts = Array.isArray(allPosts) 
        ? allPosts.filter(p => p.mediaUrls && p.mediaUrls.length > 0)
        : [];
      setReels(videoPosts.length > 0 ? videoPosts : allPosts);

      // Initialize like and save states
      const initialLikes = {};
      const initialSaves = {};
      videoPosts.forEach(p => {
        initialLikes[p._id] = { liked: Boolean(p.isLiked ?? p.hasLiked), count: p.likesCount || 0 };
        initialSaves[p._id] = Boolean(p.isSaved);
      });
      setLikesState(initialLikes);
      setSavedState(initialSaves);
    } catch (err) {
      setReels([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (reelId) => {
    if (!isAuthenticated) return navigate('/login');
    const current = likesState[reelId] || { liked: false, count: 0 };
    const nextLiked = !current.liked;
    const nextCount = nextLiked ? current.count + 1 : Math.max(0, current.count - 1);

    setLikesState(prev => ({
      ...prev,
      [reelId]: { liked: nextLiked, count: nextCount }
    }));

    try {
      const res = await api.post(`/posts/${reelId}/like`);
      if (res.data && typeof res.data.likesCount === 'number') {
        setLikesState(prev => ({
          ...prev,
          [reelId]: { liked: res.data.hasLiked, count: res.data.likesCount }
        }));
      }
    } catch (err) {}
  };

  const handleSave = async (reelId) => {
    if (!isAuthenticated) return navigate('/login');
    const nextSaved = !savedState[reelId];
    setSavedState(prev => ({ ...prev, [reelId]: nextSaved }));
    try {
      await api.post(`/posts/${reelId}/save`);
    } catch (err) {}
  };

  const handleShare = (reelId) => {
    const url = `${window.location.origin}/p/${reelId}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      toast.success('Link copied');
    }
  };

  return (
    <div className="w-full h-[calc(100vh-50px)] md:h-screen flex justify-center bg-[var(--ig-bg)] select-none overflow-hidden">
      {loading ? (
        <div className="flex items-center justify-center h-full">
          <div className="w-10 h-10 rounded-full border-2 border-[var(--ig-primary-button)] border-t-transparent animate-spin" />
        </div>
      ) : reels.length > 0 ? (
        <div 
          ref={containerRef}
          className="reels-container w-full max-w-[420px] h-full no-scrollbar"
        >
          {reels.map((reel, idx) => {
            const author = reel.author || {};
            const mediaUrl = reel.mediaUrls && reel.mediaUrls[0];
            const isVideo = mediaUrl && (mediaUrl.endsWith('.mp4') || mediaUrl.endsWith('.webm'));
            const likeData = likesState[reel._id] || { liked: false, count: reel.likesCount || 0 };
            const isSaved = savedState[reel._id] || false;

            return (
              <div 
                key={reel._id || idx}
                className="reel-item relative w-full h-[calc(100vh-50px)] md:h-screen flex items-center justify-center bg-black overflow-hidden"
              >
                {/* Reel Media Player */}
                {mediaUrl ? (
                  isVideo ? (
                    <video 
                      src={mediaUrl} 
                      autoPlay={idx === activeReelIndex}
                      loop 
                      muted={isMuted}
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img 
                      src={mediaUrl} 
                      alt="Reel frame" 
                      className="w-full h-full object-cover"
                    />
                  )
                ) : (
                  <div className="p-8 text-center text-white text-lg font-medium">
                    {reel.caption || reel.body}
                  </div>
                )}

                {/* Sound toggle in top right */}
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 z-30 transition-colors"
                >
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>

                {/* Right Action Column */}
                <div className="absolute right-3 bottom-20 z-30 flex flex-col items-center gap-5 text-white">
                  {/* Like */}
                  <div className="flex flex-col items-center gap-1">
                    <button 
                      onClick={() => handleLike(reel._id)}
                      className="p-1 hover:opacity-80 transition-transform active:scale-90"
                    >
                      <Heart className={`w-7 h-7 stroke-[2] ${likeData.liked ? 'fill-[var(--ig-like)] text-[var(--ig-like)]' : ''}`} />
                    </button>
                    <span className="text-xs font-semibold">{likeData.count}</span>
                  </div>

                  {/* Comment */}
                  <div className="flex flex-col items-center gap-1">
                    <button 
                      onClick={() => navigate(`/p/${reel._id}`)}
                      className="p-1 hover:opacity-80 transition-transform active:scale-90"
                    >
                      <MessageCircle className="w-7 h-7 stroke-[2]" />
                    </button>
                    <span className="text-xs font-semibold">{reel.commentsCount || (reel.comments?.length || 0)}</span>
                  </div>

                  {/* Share */}
                  <button 
                    onClick={() => handleShare(reel._id)}
                    className="p-1 hover:opacity-80 transition-transform active:scale-90"
                  >
                    <Send className="w-7 h-7 stroke-[2]" />
                  </button>

                  {/* Save */}
                  <button 
                    onClick={() => handleSave(reel._id)}
                    className="p-1 hover:opacity-80 transition-transform active:scale-90"
                  >
                    <Bookmark className={`w-7 h-7 stroke-[2] ${isSaved ? 'fill-white' : ''}`} />
                  </button>

                  {/* More */}
                  <button 
                    onClick={() => navigate(`/p/${reel._id}`)}
                    className="p-1 hover:opacity-80"
                  >
                    <MoreHorizontal className="w-6 h-6" />
                  </button>
                </div>

                {/* Bottom Overlay: Creator, Caption, Audio */}
                <div className="absolute left-3 right-16 bottom-6 z-30 text-white space-y-2.5">
                  <div className="flex items-center gap-3">
                    <Link to={`/u/${author.username}`}>
                      <UserAvatar 
                        src={author.avatar} 
                        name={author.displayName || author.username} 
                        size="sm"
                        hasStory={true}
                      />
                    </Link>
                    <Link to={`/u/${author.username}`} className="text-sm font-semibold hover:underline">
                      {author.username || 'user'}
                    </Link>
                    <button className="border border-white/40 text-xs font-semibold px-3 py-1 rounded-lg hover:bg-white/10 transition-colors">
                      Follow
                    </button>
                  </div>

                  {reel.caption && (
                    <p className="text-xs sm:text-sm text-white/90 line-clamp-2 leading-relaxed">
                      {reel.caption}
                    </p>
                  )}

                  {/* Audio Track Tag */}
                  <div className="flex items-center gap-2 text-xs text-white/80 bg-black/30 backdrop-blur-sm px-2.5 py-1 rounded-full w-fit">
                    <Music className="w-3.5 h-3.5" />
                    <span className="truncate max-w-[200px]">Original audio • {author.username || 'HumanHub'}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex items-center justify-center h-full">
          <EmptyState 
            icon={Sparkles}
            title="No Reels yet"
            description="Moments in full vertical format will appear here."
          />
        </div>
      )}
    </div>
  );
}
