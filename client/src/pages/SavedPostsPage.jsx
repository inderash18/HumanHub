import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark } from 'lucide-react';
import api from '../services/api';
import PageHeader from '../components/layout/PageHeader';
import PostCard from '../components/posts/PostCard';
import EmptyState from '../components/ui/EmptyState';
import { PostCardSkeleton } from '../components/ui/LoadingSkeleton';

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
      setSavedPosts(res.data || []);
    } catch (err) {
      setSavedPosts([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-6 select-none">
      <PageHeader 
        title="Saved Posts"
        description="Your private collection of bookmarked posts, photos, and discussions."
        icon={Bookmark}
      />

      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            <PostCardSkeleton />
            <PostCardSkeleton />
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
            title="No Saved Posts"
            description="Save interesting posts from your feed to easily revisit them later."
            actionLabel="Explore Feed"
            onAction={() => navigate('/feed')}
          />
        )}
      </div>
    </div>
  );
}
