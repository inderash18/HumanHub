import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Heart,
  MessageSquare,
  Bookmark,
  Share2,
  Play,
  Pause,
  Sparkles,
  Volume2,
  VolumeX
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import UserAvatar from '../components/common/UserAvatar';
import EmptyState from '../components/common/EmptyState';

export default function ReelsPage() {
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  const [moments, setMoments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);

  const videoRefs = useRef({});

  useEffect(() => {
    fetchMediaMoments();
  }, []);

  const fetchMediaMoments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/posts?limit=30');
      const allPosts = res.data?.data || res.data?.posts || res.data || [];
      // Filter posts having media
      const mediaOnly = allPosts.filter(p => p.mediaUrls && p.mediaUrls.length > 0);
      setMoments(mediaOnly.length > 0 ? mediaOnly : allPosts);
    } catch (err) {
      setMoments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleLike = async (postId, currentLiked, currentCount) => {
    if (!isAuthenticated) {
      return navigate('/?mode=signin');
    }
    const nextLiked = !currentLiked;
    setMoments(prev => prev.map(m => m._id === postId ? {
      ...m,
      isLiked: nextLiked,
      likesCount: nextLiked ? (m.likesCount || 0) + 1 : Math.max(0, (m.likesCount || 0) - 1)
    } : m));

    try {
      const res = await api.post(`/posts/${postId}/like`);
      if (res.data && typeof res.data.likesCount === 'number') {
        setMoments(prev => prev.map(m => m._id === postId ? {
          ...m,
          likesCount: res.data.likesCount,
          isLiked: res.data.hasLiked
        } : m));
      }
    } catch (err) {
      toast.error('Failed to update like');
    }
  };

  const handleToggleSave = async (postId, currentSaved) => {
    if (!isAuthenticated) {
      return navigate('/?mode=signin');
    }
    const nextSaved = !currentSaved;
    setMoments(prev => prev.map(m => m._id === postId ? { ...m, isSaved: nextSaved } : m));

    try {
      const res = await api.post(`/posts/${postId}/save`);
      if (res.data && typeof res.data.isSaved === 'boolean') {
        setMoments(prev => prev.map(m => m._id === postId ? { ...m, isSaved: res.data.isSaved } : m));
        toast.success(res.data.isSaved ? 'Saved to bookmarks' : 'Removed from bookmarks');
      }
    } catch (err) {
      toast.error('Failed to save bookmark');
    }
  };

  const handleShare = (postId) => {
    const url = `${window.location.origin}/p/${postId}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      toast.success('Link copied! 📋');
    }
  };

  const toggleVideoPlayback = (idx) => {
    const video = videoRefs.current[idx];
    if (video) {
      if (video.paused) {
        video.play();
        setIsPlaying(true);
      } else {
        video.pause();
        setIsPlaying(false);
      }
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto py-6 px-4 select-none space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
            Visual Moments
          </h1>
          <p className="text-xs text-[var(--text-tertiary)]">Explore photography, creative art, and video moments.</p>
        </div>

        <button
          onClick={() => setIsMuted(!isMuted)}
          className="p-2 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-[var(--cyan)]" />}
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-[var(--text-tertiary)]">
          Loading visual moments...
        </div>
      ) : moments.length > 0 ? (
        <div className="space-y-8">
          {moments.map((item, idx) => {
            const mediaUrl = item.mediaUrls && item.mediaUrls[0];
            const isVideo = mediaUrl && (mediaUrl.endsWith('.mp4') || mediaUrl.endsWith('.webm'));
            const author = item.author || {};
            const isLiked = Boolean(item.isLiked ?? item.hasLiked);
            const isSaved = Boolean(item.isSaved);

            return (
              <div
                key={item._id}
                className="relative aspect-[4/5] sm:aspect-[9/16] bg-[var(--surface)] border border-[var(--border)] rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between p-5 group"
              >
                {/* Media Layer */}
                {mediaUrl ? (
                  isVideo ? (
                    <video
                      ref={(el) => (videoRefs.current[idx] = el)}
                      src={mediaUrl}
                      autoPlay
                      loop
                      muted={isMuted}
                      playsInline
                      onClick={() => toggleVideoPlayback(idx)}
                      className="absolute inset-0 w-full h-full object-cover cursor-pointer"
                    />
                  ) : (
                    <img
                      src={mediaUrl}
                      alt="Moment media"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  )
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-tr from-[var(--surface-muted)] to-[var(--surface)] flex items-center justify-center p-8 text-center">
                    <p className="text-sm font-semibold text-[var(--text-primary)] leading-relaxed">
                      {item.caption || item.body}
                    </p>
                  </div>
                )}

                {/* Ambient vignette overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/85 pointer-events-none" />

                {/* Top Bar */}
                <div className="relative z-10 flex items-center justify-between">
                  <Link
                    to={`/u/${author.username}`}
                    className="flex items-center gap-2.5 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/10 hover:border-white/20 transition-all"
                  >
                    <UserAvatar
                      src={author.avatar}
                      name={author.displayName || author.username}
                      size="xs"
                    />
                    <div>
                      <p className="text-xs font-bold text-white leading-tight">
                        {author.displayName || author.username}
                      </p>
                      <p className="text-[10px] text-white/70">@{author.username}</p>
                    </div>
                  </Link>

                  {item.community && (
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[var(--violet)]/80 text-white backdrop-blur-md">
                      c/{item.community.slug || item.community.name}
                    </span>
                  )}
                </div>

                {/* Bottom Content & Side Action Bar */}
                <div className="relative z-10 flex items-end justify-between gap-4">
                  <div className="space-y-1.5 max-w-[75%]">
                    {item.caption && (
                      <p className="text-xs text-white leading-relaxed line-clamp-3 font-medium drop-shadow-sm">
                        {item.caption}
                      </p>
                    )}
                    <span className="text-[10px] text-white/60 block font-mono">
                      {new Date(item.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </div>

                  {/* Vertical Action Column */}
                  <div className="flex flex-col items-center gap-3">
                    <button
                      onClick={() => handleToggleLike(item._id, isLiked, item.likesCount)}
                      className={`p-3 rounded-2xl backdrop-blur-md transition-transform active:scale-90 flex flex-col items-center gap-1 ${
                        isLiked ? 'bg-[var(--accent)] text-white' : 'bg-black/50 border border-white/10 text-white hover:bg-black/70'
                      }`}
                      title="Like"
                    >
                      <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                      <span className="text-[10px] font-bold font-mono">{item.likesCount || 0}</span>
                    </button>

                    <Link
                      to={`/p/${item._id}`}
                      className="p-3 rounded-2xl bg-black/50 border border-white/10 text-white hover:bg-black/70 backdrop-blur-md transition-transform active:scale-90 flex flex-col items-center gap-1"
                      title="Comments"
                    >
                      <MessageSquare className="w-5 h-5 text-[var(--cyan)]" />
                      <span className="text-[10px] font-bold font-mono">{item.commentsCount || 0}</span>
                    </Link>

                    <button
                      onClick={() => handleToggleSave(item._id, isSaved)}
                      className={`p-3 rounded-2xl backdrop-blur-md transition-transform active:scale-90 ${
                        isSaved ? 'bg-[var(--accent)] text-white' : 'bg-black/50 border border-white/10 text-white hover:bg-black/70'
                      }`}
                      title="Save"
                    >
                      <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
                    </button>

                    <button
                      onClick={() => handleShare(item._id)}
                      className="p-3 rounded-2xl bg-black/50 border border-white/10 text-white hover:bg-black/70 backdrop-blur-md transition-transform active:scale-90"
                      title="Share"
                    >
                      <Share2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Sparkles}
          title="No Visual Moments Yet"
          description="Photos and video moments shared by the community will appear here."
        />
      )}
    </div>
  );
}
