import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PostCard from '../components/posts/PostCard';
import StoriesTray from '../components/home/StoriesTray';
import UserAvatar from '../components/common/UserAvatar';
import EmptyState from '../components/common/EmptyState';
import { PostSkeleton } from '../components/common/SkeletonLoader';
import { useAuthStore } from '../store/useAuthStore';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import { Sparkles } from 'lucide-react';

export default function FeedPage() {
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  const [posts, setPosts] = useState([]);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeed();
    if (isAuthenticated) {
      fetchSuggestedUsers();
    }
  }, [isAuthenticated]);

  const fetchFeed = async () => {
    try {
      setLoading(true);
      const res = await api.get('/posts');
      const data = res.data?.data || res.data?.posts || res.data || [];
      setPosts(Array.isArray(data) ? data : []);
    } catch (err) {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuggestedUsers = async () => {
    try {
      const res = await api.get('/users/suggestions');
      setSuggestedUsers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setSuggestedUsers([]);
    }
  };

  const handleFollowSuggested = async (targetId) => {
    try {
      const res = await api.post(`/users/${targetId}/follow`);
      toast.success(res.data.isFollowing ? 'Following' : 'Unfollowed');
      fetchSuggestedUsers();
    } catch (err) {
      toast.error('Failed to update follow');
    }
  };

  return (
    <div className="w-full max-w-[1000px] mx-auto px-0 md:px-4 py-0 md:py-6 select-none">
      <div className="flex justify-center gap-16 items-start">
        
        {/* Main Feed Column (Max 630px matching Instagram) */}
        <div className="w-full max-w-[630px] flex flex-col">
          {/* Stories Tray */}
          <StoriesTray />

          {/* Posts Stream */}
          {loading ? (
            <div className="flex flex-col gap-4">
              <PostSkeleton />
              <PostSkeleton />
            </div>
          ) : posts.length > 0 ? (
            <div className="flex flex-col">
              {posts.map((post) => (
                <PostCard 
                  key={post._id} 
                  post={post} 
                  onUpdate={fetchFeed} 
                />
              ))}
            </div>
          ) : (
            <div className="p-8">
              <EmptyState 
                icon={Sparkles}
                title="Welcome to HumanHub"
                description="Follow people or share your first moment to fill your feed."
                actionLabel="Explore moments"
                onAction={() => navigate('/explore')}
              />
            </div>
          )}
        </div>

        {/* Right Suggestions Rail (320px width, desktop only) */}
        <div className="hidden lg:flex flex-col w-[320px] pt-4 select-none flex-shrink-0">
          {/* Current User Switcher Card */}
          {isAuthenticated && user && (
            <div className="flex items-center justify-between mb-6">
              <Link to={`/u/${user.username}`} className="flex items-center gap-3.5 min-w-0 group">
                <UserAvatar 
                  src={user.avatar} 
                  name={user.displayName || user.username} 
                  size="md"
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--ig-text-primary)] truncate">
                    {user.username}
                  </p>
                  <p className="text-xs text-[var(--ig-text-secondary)] truncate">
                    {user.displayName || user.username}
                  </p>
                </div>
              </Link>
              <button 
                onClick={() => navigate('/settings')}
                className="text-xs font-semibold text-[var(--ig-primary-button)] hover:text-[var(--ig-text-primary)] transition-colors"
              >
                Switch
              </button>
            </div>
          )}

          {/* Suggested For You Header */}
          {suggestedUsers.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-[var(--ig-text-secondary)]">
                  Suggested for you
                </span>
                <Link 
                  to="/explore" 
                  className="text-xs font-semibold text-[var(--ig-text-primary)] hover:opacity-60"
                >
                  See All
                </Link>
              </div>

              {/* Suggestions List */}
              <div className="space-y-3">
                {suggestedUsers.slice(0, 5).map((u) => (
                  <div key={u._id} className="flex items-center justify-between gap-2">
                    <Link to={`/u/${u.username}`} className="flex items-center gap-3 min-w-0 group">
                      <UserAvatar 
                        src={u.avatar} 
                        name={u.displayName || u.username} 
                        size="sm"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[var(--ig-text-primary)] truncate group-hover:underline">
                          {u.username}
                        </p>
                        <p className="text-[11px] text-[var(--ig-text-tertiary)] truncate">
                          Suggested for you
                        </p>
                      </div>
                    </Link>

                    <button 
                      onClick={() => handleFollowSuggested(u._id)}
                      className="text-xs font-semibold text-[var(--ig-primary-button)] hover:text-[var(--ig-text-primary)] transition-colors"
                    >
                      Follow
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer Copyright & Links */}
          <div className="mt-8 text-[11px] text-[var(--ig-text-tertiary)] leading-relaxed">
            <p className="mb-4">
              About • Help • Press • API • Jobs • Privacy • Terms • Locations • Language • Verified Humans
            </p>
            <p>© {new Date().getFullYear()} HUMANHUB FROM ORGANIC SOCIAL</p>
          </div>
        </div>

      </div>
    </div>
  );
}
