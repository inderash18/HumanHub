import React, { useState, useEffect } from 'react';
import { IoAdd } from 'react-icons/io5';
import { useAuthStore } from '../../store/useAuthStore';
import api from '../../services/api';
import StoryViewerModal from './StoryViewerModal';
import UserAvatar from '../common/UserAvatar';

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
      setStories([]);
    } finally {
      setLoading(false);
    }
  };

  if (!stories.length && !user) return null;

  return (
    <>
      <div className="w-full bg-hub-surface py-4 border-b border-hub-border flex items-center gap-4 overflow-x-auto no-scrollbar select-none px-2 sm:px-0">
        {/* Current User Story */}
        {user && (
          <div className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer group">
            <div className="relative">
              <UserAvatar 
                src={user?.avatar} 
                name={user?.displayName || user?.username} 
                size="lg"
                verified={user?.isVerified}
              />
              <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-hub-accent text-white flex items-center justify-center border-2 border-hub-surface">
                <IoAdd className="text-sm font-bold" />
              </div>
            </div>
            <span className="text-[12px] text-hub-text-secondary max-w-[70px] truncate">Your story</span>
          </div>
        )}

        {/* Other Users' Stories */}
        {stories.map((storyGroup, idx) => (
          <div 
            key={storyGroup._id || idx}
            onClick={() => setActiveStoryIndex(idx)}
            className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer group"
          >
            <UserAvatar 
              src={storyGroup.author?.avatar}
              name={storyGroup.author?.displayName || storyGroup.author?.username}
              size="lg"
              verified={storyGroup.author?.isVerified}
            />
            <span className="text-[12px] text-hub-text-primary font-medium max-w-[74px] truncate">
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
