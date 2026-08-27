import React, { useState, useEffect } from 'react';
import { IoAdd } from 'react-icons/io5';
import { useAuthStore } from '../../store/useAuthStore';
import api from '../../services/api';
import StoryViewerModal from './StoryViewerModal';

export default function StoriesTray() {
  const { user } = useAuthStore();
  const [stories, setStories] = useState([]);
  const [activeStoryIndex, setActiveStoryIndex] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      setLoading(true);
      const res = await api.get('/stories');
      setStories(res.data || []);
    } catch (err) {
      console.log('No active stories found or stories endpoint idle');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="w-full bg-black py-4 border-b border-[#262626] flex items-center gap-4 overflow-x-auto no-scrollbar select-none px-2 sm:px-0">
        {/* Current User Story / Add Story */}
        <div className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer group">
          <div className="relative">
            <div className="w-16 h-16 rounded-full p-[2px] border border-[#363636]">
              <img 
                src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} 
                alt="Your story" 
                className="w-full h-full rounded-full object-cover group-hover:scale-105 transition-transform"
              />
            </div>
            <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-[#0095f6] text-white flex items-center justify-center border-2 border-black">
              <IoAdd className="text-sm font-bold" />
            </div>
          </div>
          <span className="text-[12px] text-[#a8a8a8] max-w-[70px] truncate">Your story</span>
        </div>

        {/* Other Users' Stories */}
        {stories.map((storyGroup, idx) => (
          <div 
            key={storyGroup._id || idx}
            onClick={() => setActiveStoryIndex(idx)}
            className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer group"
          >
            <div className="story-ring-active">
              <div className="w-16 h-16 rounded-full p-[2px] bg-black">
                <img 
                  src={storyGroup.author?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'} 
                  alt={storyGroup.author?.username} 
                  className="w-full h-full rounded-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>
            </div>
            <span className="text-[12px] text-white font-medium max-w-[74px] truncate">
              {storyGroup.author?.username || 'user'}
            </span>
          </div>
        ))}
      </div>

      {/* Fullscreen Story Viewer */}
      {activeStoryIndex !== null && stories[activeStoryIndex] && (
        <StoryViewerModal 
          stories={stories}
          initialIndex={activeStoryIndex}
          onClose={() => setActiveStoryIndex(null)}
        />
      )}
    </>
  );
}
