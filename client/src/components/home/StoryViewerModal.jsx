import React, { useState, useEffect } from 'react';
import { IoClose, IoChevronBack, IoChevronForward, IoSend, IoHeartOutline } from 'react-icons/io5';
import { MdVerified } from 'react-icons/md';
import UserAvatar from '../common/UserAvatar';

export default function StoryViewerModal({ stories, initialIndex = 0, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);

  const currentStory = stories[currentIndex] || {};

  useEffect(() => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + 2;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [currentIndex]);

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center select-none animate-fade-in">
      {/* Top Close */}
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 text-white text-3xl hover:opacity-75 z-50"
      >
        <IoClose />
      </button>

      {/* Navigation Arrows */}
      {currentIndex > 0 && (
        <button 
          onClick={handlePrev}
          className="absolute left-6 text-white text-3xl bg-hub-surface-elevated/40 p-2 rounded-full hover:bg-hub-surface-elevated z-40 hidden sm:block"
        >
          <IoChevronBack />
        </button>
      )}

      {currentIndex < stories.length - 1 && (
        <button 
          onClick={handleNext}
          className="absolute right-6 text-white text-3xl bg-hub-surface-elevated/40 p-2 rounded-full hover:bg-hub-surface-elevated z-40 hidden sm:block"
        >
          <IoChevronForward />
        </button>
      )}

      {/* Story Window */}
      <div className="relative w-full max-w-[420px] h-[92vh] max-h-[850px] bg-hub-surface rounded-2xl overflow-hidden shadow-2xl flex flex-col justify-between border border-hub-border">
        {/* Progress Bars */}
        <div className="absolute top-3 left-3 right-3 z-30 flex gap-1.5">
          {stories.map((_, idx) => (
            <div key={idx} className="flex-1 h-[2px] bg-white/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white transition-all duration-100"
                style={{ 
                  width: idx === currentIndex ? `${progress}%` : idx < currentIndex ? '100%' : '0%' 
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-6 left-4 right-4 z-30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UserAvatar 
              src={currentStory.author?.avatar}
              name={currentStory.author?.displayName || currentStory.author?.username}
              size="sm"
              verified={currentStory.author?.isVerified}
            />
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-white">{currentStory.author?.username}</span>
              <span className="text-xs text-white/60">• Active</span>
            </div>
          </div>
        </div>

        {/* Story Media */}
        <div className="w-full h-full relative flex items-center justify-center bg-black">
          {currentStory.mediaUrl ? (
            <img 
              src={currentStory.mediaUrl} 
              alt="story content" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="p-8 text-center text-white text-sm">
              {currentStory.caption || 'Verified Human Reflection'}
            </div>
          )}
          {currentStory.caption && currentStory.mediaUrl && (
            <div className="absolute bottom-20 left-4 right-4 bg-black/60 backdrop-blur-md p-3 rounded-xl text-center text-white text-sm">
              {currentStory.caption}
            </div>
          )}
        </div>

        {/* Bottom Reply Bar */}
        <div className="absolute bottom-4 left-4 right-4 z-30 flex items-center gap-3">
          <input 
            type="text"
            placeholder={`Reply to ${currentStory.author?.username || 'user'}...`}
            className="flex-1 bg-black/50 backdrop-blur-md border border-white/30 rounded-full px-4 py-2.5 text-xs text-white placeholder-white/60 outline-none focus:border-hub-trust"
          />
          <button className="text-white text-2xl hover:text-hub-accent transition-colors">
            <IoHeartOutline />
          </button>
        </div>
      </div>
    </div>
  );
}
