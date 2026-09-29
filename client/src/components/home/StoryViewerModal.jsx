import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Heart, 
  Send, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX,
  Trash2,
  Eye,
  Loader2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import UserAvatar from '../common/UserAvatar';
import { recordStoryView, reactToStory, replyToStory, deleteStory } from '../../services/storyService';
import { useAuthStore } from '../../store/useAuthStore';

export default function StoryViewerModal({ 
  storyGroups = [], 
  initialGroupIndex = 0, 
  initialStoryIndex = 0, 
  onClose,
  onStoryDeleted
}) {
  const { user } = useAuthStore();

  const [groupIndex, setGroupIndex] = useState(initialGroupIndex);
  const [storyIndex, setStoryIndex] = useState(initialStoryIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [mediaLoading, setMediaLoading] = useState(true);
  const [mediaError, setMediaError] = useState(false);

  const currentGroup = storyGroups[groupIndex] || null;
  const storiesInGroup = currentGroup?.stories || [];
  const currentStory = storiesInGroup[storyIndex] || null;

  const isOwner = Boolean(
    currentStory && (
      currentStory.isOwner ||
      (user && currentStory.author && (
        String(currentStory.author._id || currentStory.author) === String(user._id)
      ))
    )
  );

  const [isLiked, setIsLiked] = useState(Boolean(currentStory?.hasReacted));

  // Sync liked state when active story changes
  useEffect(() => {
    if (currentStory) {
      setIsLiked(Boolean(currentStory.hasReacted));
      setReplyText('');
      setMediaLoading(true);
      setMediaError(false);
      setProgress(0);

      // Record view idempotently
      if (currentStory._id && !isOwner) {
        recordStoryView(currentStory._id);
      }
    }
  }, [currentStory?._id, isOwner]);

  const handleNext = useCallback(() => {
    if (storyIndex < storiesInGroup.length - 1) {
      setStoryIndex(prev => prev + 1);
      setProgress(0);
    } else if (groupIndex < storyGroups.length - 1) {
      setGroupIndex(prev => prev + 1);
      setStoryIndex(0);
      setProgress(0);
    } else {
      onClose();
    }
  }, [storyIndex, storiesInGroup.length, groupIndex, storyGroups.length, onClose]);

  const handlePrev = useCallback(() => {
    if (storyIndex > 0) {
      setStoryIndex(prev => prev - 1);
      setProgress(0);
    } else if (groupIndex > 0) {
      const prevGroup = storyGroups[groupIndex - 1];
      setGroupIndex(prev => prev - 1);
      setStoryIndex(Math.max(0, (prevGroup?.stories?.length || 1) - 1));
      setProgress(0);
    }
  }, [storyIndex, groupIndex, storyGroups]);

  // Automated progress bar timer (duration ~6 seconds for image)
  useEffect(() => {
    if (isPaused || mediaLoading || mediaError || !currentStory) return;

    const stepMs = 50;
    const totalDurationMs = 6000;
    const increment = (stepMs / totalDurationMs) * 100;

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          return 100;
        }
        return prev + increment;
      });
    }, stepMs);

    return () => clearInterval(interval);
  }, [currentStory?._id, isPaused, mediaLoading, mediaError]);

  // Trigger next story when progress reaches 100%
  useEffect(() => {
    if (progress >= 100) {
      handleNext();
    }
  }, [progress, handleNext]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't intercept typing in input fields
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        if (e.key === 'Escape') onClose();
        return;
      }

      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === ' ') {
        e.preventDefault();
        setIsPaused(p => !p);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev, onClose]);

  // Delete story handler
  const handleDeleteStory = async () => {
    if (!currentStory?._id || isDeleting) return;
    if (!window.confirm('Delete this story?')) return;

    try {
      setIsDeleting(true);
      await deleteStory(currentStory._id);
      toast.success('Story deleted');
      if (onStoryDeleted) {
        onStoryDeleted(currentStory._id);
      }
      handleNext();
    } catch {
      toast.error('Failed to delete story');
    } finally {
      setIsDeleting(false);
    }
  };

  // React to story (Heart)
  const handleToggleLike = async () => {
    if (!currentStory?._id || !user) return;
    try {
      const nextLiked = !isLiked;
      setIsLiked(nextLiked);
      await reactToStory(currentStory._id, nextLiked ? 'heart' : 'none');
    } catch {
      setIsLiked(isLiked);
    }
  };

  // Send reply
  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || isSendingReply || !currentStory?._id) return;

    try {
      setIsSendingReply(true);
      await replyToStory(currentStory._id, replyText.trim());
      toast.success('Reply sent!');
      setReplyText('');
      setIsPaused(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reply');
    } finally {
      setIsSendingReply(false);
    }
  };

  if (!currentGroup || !currentStory) return null;

  const isVideo = currentStory.mediaType === 'video' || /\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(currentStory.mediaUrl || '');

  const formatStoryTime = (dateStr) => {
    if (!dateStr) return 'just now';
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
  };

  const author = currentStory.author || currentGroup.author || {};

  return (
    <div className="fixed inset-0 z-50 bg-[#121212]/95 backdrop-blur-md flex items-center justify-center select-none animate-fade-in">
      {/* Desktop Prev Button */}
      {(groupIndex > 0 || storyIndex > 0) && (
        <button 
          onClick={handlePrev} 
          className="absolute left-6 text-white/80 hover:text-white p-3 rounded-full bg-black/40 hover:bg-black/70 z-40 hidden md:flex items-center justify-center transition-all hover:scale-110"
          title="Previous (Left Arrow)"
        >
          <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
        </button>
      )}

      {/* Desktop Next Button */}
      {(groupIndex < storyGroups.length - 1 || storyIndex < storiesInGroup.length - 1) && (
        <button 
          onClick={handleNext} 
          className="absolute right-6 text-white/80 hover:text-white p-3 rounded-full bg-black/40 hover:bg-black/70 z-40 hidden md:flex items-center justify-center transition-all hover:scale-110"
          title="Next (Right Arrow)"
        >
          <ChevronRight className="w-6 h-6 stroke-[2.5]" />
        </button>
      )}

      {/* Story Card Container (Aspect 9:16) */}
      <div className="relative w-full max-w-[420px] h-[92vh] max-h-[820px] bg-black rounded-2xl overflow-hidden shadow-2xl flex flex-col justify-between border border-white/10">
        
        {/* Progress Bars (only for stories in current active group) */}
        <div className="absolute top-3 left-3 right-3 z-30 flex gap-1.5 pointer-events-none">
          {storiesInGroup.map((_, idx) => (
            <div key={idx} className="flex-1 h-[2.5px] bg-white/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white transition-all duration-75 ease-linear"
                style={{ 
                  width: idx === storyIndex ? `${progress}%` : idx < storyIndex ? '100%' : '0%' 
                }}
              />
            </div>
          ))}
        </div>

        {/* Single Author Header & Playback Controls */}
        <div className="absolute top-6 left-3.5 right-3.5 z-30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <UserAvatar 
              src={author.avatar}
              name={author.displayName || author.username}
              size="sm"
            />
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-white drop-shadow-md">
                {author.username || 'user'}
              </span>
              <span className="text-[11px] text-white/70 drop-shadow-md">
                • {formatStoryTime(currentStory.createdAt)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-white">
            {/* Play/Pause */}
            <button 
              onClick={() => setIsPaused(p => !p)} 
              className="p-1.5 text-white/90 hover:text-white rounded-full hover:bg-white/10 transition-colors"
              title={isPaused ? 'Play (Space)' : 'Pause (Space)'}
            >
              {isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4 fill-current" />}
            </button>

            {/* Mute/Unmute (for video) */}
            {isVideo && (
              <button 
                onClick={() => setIsMuted(m => !m)} 
                className="p-1.5 text-white/90 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            )}

            {/* Delete button (Owner only) */}
            {isOwner && (
              <button 
                onClick={handleDeleteStory}
                disabled={isDeleting}
                className="p-1.5 text-red-400 hover:text-red-300 rounded-full hover:bg-white/10 transition-colors"
                title="Delete story"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            {/* Close button */}
            <button 
              onClick={onClose}
              className="p-1.5 text-white/90 hover:text-white rounded-full hover:bg-white/10 transition-colors ml-1"
              title="Close (Esc)"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Tap/Click Navigation Zones */}
        <div 
          onClick={handlePrev} 
          onMouseDown={() => setIsPaused(true)}
          onMouseUp={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
          className="absolute inset-y-16 left-0 w-1/3 z-20 cursor-pointer" 
          title="Previous"
        />
        <div 
          onClick={handleNext} 
          onMouseDown={() => setIsPaused(true)}
          onMouseUp={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
          className="absolute inset-y-16 right-0 w-2/3 z-20 cursor-pointer" 
          title="Next"
        />

        {/* Story Media */}
        <div className="w-full h-full relative flex items-center justify-center bg-[#0d0d0d]">
          {mediaLoading && !mediaError && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <Loader2 className="w-8 h-8 text-white/60 animate-spin" />
            </div>
          )}

          {mediaError ? (
            <div className="p-6 text-center text-white/70 flex flex-col items-center gap-2">
              <p className="text-sm font-medium">Unable to load media</p>
              <button 
                onClick={() => { setMediaError(false); setMediaLoading(true); }}
                className="text-xs text-[var(--ig-primary-button)] hover:underline"
              >
                Retry
              </button>
            </div>
          ) : currentStory.mediaUrl ? (
            isVideo ? (
              <video
                src={currentStory.mediaUrl}
                autoPlay
                playsInline
                loop
                muted={isMuted}
                onLoadedData={() => setMediaLoading(false)}
                onError={() => { setMediaLoading(false); setMediaError(true); }}
                className="w-full h-full object-cover"
              />
            ) : (
              <img 
                src={currentStory.mediaUrl} 
                alt="story content" 
                onLoad={() => setMediaLoading(false)}
                onError={() => { setMediaLoading(false); setMediaError(true); }}
                className="w-full h-full object-cover"
              />
            )
          ) : (
            <div className="p-8 text-center text-white text-base font-medium">
              {currentStory.caption || 'Verified Human Moment'}
            </div>
          )}

          {currentStory.caption && (
            <div className="absolute bottom-20 left-4 right-4 bg-black/60 backdrop-blur-md p-3 rounded-xl text-center text-white text-xs z-20">
              {currentStory.caption}
            </div>
          )}
        </div>

        {/* Bottom Interaction Bar */}
        <div className="absolute bottom-4 left-3.5 right-3.5 z-30 flex items-center gap-2.5">
          {isOwner ? (
            <div className="w-full flex items-center justify-between px-3 py-2 bg-black/50 backdrop-blur-md rounded-full text-white text-xs border border-white/10">
              <div className="flex items-center gap-1.5 text-white/80">
                <Eye className="w-4 h-4" />
                <span>{currentStory.viewsCount || 0} {currentStory.viewsCount === 1 ? 'view' : 'views'}</span>
              </div>
              <span className="text-[11px] text-white/50">Your active story</span>
            </div>
          ) : (
            <form onSubmit={handleSendReply} className="w-full flex items-center gap-2">
              <input 
                type="text"
                placeholder={`Reply to ${author.username || 'user'}...`}
                value={replyText}
                onFocus={() => setIsPaused(true)}
                onBlur={() => { if (!replyText) setIsPaused(false); }}
                onChange={(e) => setReplyText(e.target.value)}
                maxLength={200}
                className="flex-1 bg-black/50 backdrop-blur-md border border-white/30 rounded-full px-4 py-2.5 text-xs text-white placeholder:text-white/60 outline-none focus:border-white transition-colors"
              />
              {replyText.trim() ? (
                <button 
                  type="submit"
                  disabled={isSendingReply}
                  className="text-white hover:opacity-80 p-2 bg-[var(--ig-primary-button)] rounded-full transition-transform active:scale-90"
                  title="Send reply"
                >
                  <Send className="w-4 h-4" />
                </button>
              ) : (
                <button 
                  type="button"
                  onClick={handleToggleLike} 
                  className="text-white hover:opacity-80 p-2 transition-transform active:scale-90"
                  title="Like story"
                >
                  <Heart className={`w-6 h-6 ${isLiked ? 'fill-[var(--ig-like)] text-[var(--ig-like)]' : ''}`} />
                </button>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
