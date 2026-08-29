import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark } from 'lucide-react';
import api from '../services/api';
import PostCard from '../components/posts/PostCard';
import EmptyState from '../components/common/EmptyState';
import { PostSkeleton } from '../components/common/SkeletonLoader';

export default function SavedPostsPage() {
  const [savedPosts, setSavedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSaved();
  }, []);

  const fetchSaved = async () => {
    try {
      setLoading(true);
      const res = await api.get('/posts/saved');
      setSavedPosts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setSavedPosts([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto px-4 sm:px-6 py-8 select-none space-y-6">
      <div className="flex items-center gap-2 pb-3 border-b border-[var(--border)]">
        <Bookmark className="w-5 h-5 text-[var(--accent)]" />
        <h1 className="font-display text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
          Saved Moments
        </h1>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            <PostSkeleton />
            <PostSkeleton />
          </div>
        ) : savedPosts.length > 0 ? (
          savedPosts.map((post) => (
            <PostCard 
              key={post._id}
              post={post}
              onUpdate={fetchSaved}
            />
          ))
        ) : (
          <EmptyState 
            icon={Bookmark}
            title="No Saved Moments"
            description="Bookmark moments from your feed to easily revisit them here anytime."
            actionLabel="Explore Feed"
            onAction={() => navigate('/feed')}
          />
        )}
      </div>
    </div>
  );
}
