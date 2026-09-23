import React, { useState, useEffect } from 'react';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Heart, 
  Send, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX 
} from 'lucide-react';
import UserAvatar from '../common/UserAvatar';

export default function StoryViewerModal({ stories, initialIndex = 0, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [isLiked, setIsLiked] = useState(false);

  const currentStory = stories[currentIndex] || {};

  useEffect(() => {
    setProgress(0);
    if (isPaused) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + 1.5;
      });
    }, 75);

    return () => clearInterval(interval);
  }, [currentIndex, isPaused, stories.length]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === ' ') setIsPaused(p => !p);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, stories.length]);

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsLiked(false);
      setReplyText('');
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsLiked(false);
      setReplyText('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#1A1A1A]/95 backdrop-blur-md flex items-center justify-center select-none animate-fade-in">
      {/* HumanHub Logo in Top Left */}
      <div className="absolute top-6 left-6 text-white font-logo text-xl tracking-tight hidden sm:block">
        HumanHub
      </div>

      {/* Top Close Button */}
      <button 
        onClick={onClose}
        className="absolute top-5 right-5 text-white/90 hover:text-white p-2 rounded-full hover:bg-white/10 z-50 transition-colors"
        title="Close (Esc)"
      >
        <X className="w-7 h-7 stroke-[2]" />
      </button>

      {/* Desktop Prev Button */}
      {currentIndex > 0 && (
        <button 
          onClick={handlePrev}
          className="absolute left-8 text-white p-3 rounded-full bg-black/40 hover:bg-black/70 z-40 hidden md:flex items-center justify-center transition-colors"
          title="Previous story"
        >
          <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
        </button>
      )}

      {/* Desktop Next Button */}
      {currentIndex < stories.length - 1 && (
        <button 
          onClick={handleNext}
          className="absolute right-8 text-white p-3 rounded-full bg-black/40 hover:bg-black/70 z-40 hidden md:flex items-center justify-center transition-colors"
          title="Next story"
        >
          <ChevronRight className="w-6 h-6 stroke-[2.5]" />
        </button>
      )}

      {/* Story Card Container (Aspect 9:16) */}
      <div className="relative w-full max-w-[420px] h-[92vh] max-h-[840px] bg-black rounded-2xl overflow-hidden shadow-2xl flex flex-col justify-between">
        
        {/* Progress Bars */}
        <div className="absolute top-3.5 left-3 right-3 z-30 flex gap-1.5">
          {stories.map((_, idx) => (
            <div key={idx} className="flex-1 h-[2px] bg-white/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white transition-all duration-75"
                style={{ 
                  width: idx === currentIndex ? `${progress}%` : idx < currentIndex ? '100%' : '0%' 
                }}
              />
            </div>
          ))}
        </div>

        {/* Story Header */}
        <div className="absolute top-7 left-3.5 right-3.5 z-30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UserAvatar 
              src={currentStory.author?.avatar}
              name={currentStory.author?.displayName || currentStory.author?.username}
              size="sm"
            />
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-white">
                {currentStory.author?.username || 'user'}
              </span>
              <span className="text-[11px] text-white/60">• 3h</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-white">
            <button 
              onClick={() => setIsPaused(!isPaused)} 
              className="p-1 text-white/90 hover:text-white"
            >
              {isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4 fill-current" />}
            </button>
            <button 
              onClick={() => setIsMuted(!isMuted)} 
              className="p-1 text-white/90 hover:text-white"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Tap/Click Navigation Zones */}
        <div 
          onClick={handlePrev} 
          className="absolute inset-y-16 left-0 w-1/3 z-20 cursor-pointer" 
          title="Previous"
        />
        <div 
          onClick={handleNext} 
          className="absolute inset-y-16 right-0 w-2/3 z-20 cursor-pointer" 
          title="Next"
        />

        {/* Story Media */}
        <div className="w-full h-full relative flex items-center justify-center bg-black">
          {currentStory.mediaUrl ? (
            <img 
              src={currentStory.mediaUrl} 
              alt="story content" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="p-8 text-center text-white text-base font-medium">
              {currentStory.caption || 'Verified Human Moment'}
            </div>
          )}

          {currentStory.caption && currentStory.mediaUrl && (
            <div className="absolute bottom-20 left-4 right-4 bg-black/60 backdrop-blur-md p-3 rounded-xl text-center text-white text-xs">
              {currentStory.caption}
            </div>
          )}
        </div>

        {/* Bottom Reply Bar */}
        <div className="absolute bottom-4 left-3.5 right-3.5 z-30 flex items-center gap-3">
          <input 
            type="text"
            placeholder={`Reply to ${currentStory.author?.username || 'user'}...`}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            className="flex-1 bg-transparent border border-white/40 rounded-full px-4 py-2.5 text-xs text-white placeholder:text-white/60 outline-none focus:border-white transition-colors"
          />
          <button 
            onClick={() => setIsLiked(!isLiked)} 
            className="text-white hover:opacity-80 p-1 transition-transform active:scale-90"
          >
            <Heart className={`w-6 h-6 ${isLiked ? 'fill-[var(--ig-like)] text-[var(--ig-like)]' : ''}`} />
          </button>
          <button 
            onClick={handleNext} 
            className="text-white hover:opacity-80 p-1"
          >
            <Send className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
