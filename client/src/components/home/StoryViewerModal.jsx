import React, { useState, useEffect } from 'react';
import { IoClose, IoChevronBack, IoChevronForward, IoHeart, IoPaperPlaneOutline } from 'react-icons/io5';
import { MdVerified } from 'react-icons/md';

export default function StoryViewerModal({ stories, initialIndex = 0, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);

  const currentStory = stories[currentIndex];

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
      setCurrentIndex((prev) => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  if (!currentStory) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center select-none">
      {/* Top Close Button */}
      <button 
        onClick={onClose}
        className="absolute top-5 right-5 text-white text-3xl hover:opacity-75 z-50"
      >
        <IoClose />
      </button>

      {/* Navigation Buttons */}
      {currentIndex > 0 && (
        <button 
          onClick={handlePrev}
          className="absolute left-6 text-white text-3xl bg-white/10 hover:bg-white/20 p-2 rounded-full z-50 hidden md:block"
        >
          <IoChevronBack />
        </button>
      )}

      {currentIndex < stories.length - 1 && (
        <button 
          onClick={handleNext}
          className="absolute right-6 text-white text-3xl bg-white/10 hover:bg-white/20 p-2 rounded-full z-50 hidden md:block"
        >
          <IoChevronForward />
        </button>
      )}

      {/* Story Window */}
      <div className="relative w-full max-w-[420px] h-[92vh] max-h-[850px] bg-[#121212] rounded-2xl overflow-hidden shadow-2xl flex flex-col justify-between border border-[#262626]">
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
            <img 
              src={currentStory.author?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} 
              alt={currentStory.author?.username} 
              className="w-8 h-8 rounded-full object-cover border border-white/40"
            />
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-white">{currentStory.author?.username}</span>
              <MdVerified className="text-[#0095f6] text-sm" />
              <span className="text-xs text-white/60">• 2h</span>
            </div>
          </div>
        </div>

        {/* Story Media */}
        <div className="w-full h-full relative">
          <img 
            src={currentStory.mediaUrl || 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800'} 
            alt="story content" 
            className="w-full h-full object-cover"
          />
          {currentStory.caption && (
            <div className="absolute bottom-20 left-4 right-4 bg-black/60 backdrop-blur-md p-3 rounded-xl text-center text-white text-sm">
              {currentStory.caption}
            </div>
          )}
        </div>

        {/* Bottom Reply Bar */}
        <div className="absolute bottom-4 left-4 right-4 z-30 flex items-center gap-3">
          <input 
            type="text"
            placeholder={`Reply to ${currentStory.author?.username}...`}
            className="flex-1 bg-transparent border border-white/40 rounded-full px-4 py-2 text-sm text-white placeholder-white/60 outline-none focus:border-white"
          />
          <button className="text-white text-2xl hover:text-[#ff3040] transition-colors">
            <IoHeart />
          </button>
          <button className="text-white text-2xl hover:text-[#0095f6] transition-colors">
            <IoPaperPlaneOutline />
          </button>
        </div>
      </div>
    </div>
  );
}
