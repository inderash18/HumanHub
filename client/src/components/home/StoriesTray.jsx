import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
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
      setStories(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setStories([]);
    } finally {
      setLoading(false);
    }
  };

  if (!stories.length && !user) return null;

  return (
    <>
      <div className="w-full bg-[var(--ig-bg)] py-3 sm:py-4 border-b border-[var(--ig-border)] md:border md:rounded-xl md:mb-6 flex items-center gap-4 overflow-x-auto no-scrollbar select-none px-4">
        {/* Current User Story */}
        {user && (
          <div className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer group">
            <div className="relative">
              <UserAvatar 
                src={user?.avatar} 
                name={user?.displayName || user?.username} 
                size="lg"
              />
              <div className="absolute bottom-0 right-0 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[var(--ig-primary-button)] text-white flex items-center justify-center border-2 border-[var(--ig-bg)]">
                <Plus className="w-3 h-3 stroke-[3]" />
              </div>
            </div>
            <span className="text-[11px] text-[var(--ig-text-secondary)] max-w-[66px] truncate text-center">
              Your story
            </span>
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
              hasStory={true}
              isStoryViewed={Boolean(storyGroup.viewed)}
            />
            <span className="text-[11px] text-[var(--ig-text-primary)] max-w-[66px] truncate text-center">
              {storyGroup.author?.username || 'user'}
            </span>
          </div>
        ))}
      </div>

      {/* Fullscreen Story Viewer Modal */}
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
