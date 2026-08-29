import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Plus, 
  UserPlus, 
  Users, 
  ArrowRight, 
  Sparkles,
  MessageSquare
} from 'lucide-react';
import PostCard from '../components/posts/PostCard';
import CreatePostModal from '../components/posts/CreatePostModal';
import UserAvatar from '../components/common/UserAvatar';
import EmptyState from '../components/common/EmptyState';
import { PostSkeleton } from '../components/common/SkeletonLoader';
import Button from '../components/ui/Button';
import { useAuthStore } from '../store/useAuthStore';
import api from '../services/api';
import { toast } from 'react-hot-toast';

export default function FeedPage() {
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  const [posts, setPosts] = useState([]);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

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
      toast.success(res.data.isFollowing ? 'Following!' : 'Unfollowed');
      fetchSuggestedUsers();
    } catch (err) {
      toast.error('Failed to update follow');
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 select-none">
      <div className="flex flex-col lg:flex-row justify-center gap-8">
        
        {/* Central Feed Column */}
        <div className="flex-1 max-w-[620px] flex flex-col gap-4">
          {/* Quick Composer Box */}
          {isAuthenticated && user && (
            <div 
              onClick={() => setIsCreateOpen(true)}
              className="p-4 rounded-3xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--border-subtle)] cursor-pointer transition-all flex items-center gap-3.5 shadow-xl group"
            >
              <UserAvatar 
                src={user.avatar} 
                name={user.displayName || user.username} 
                size="sm"
              />
              <div className="flex-1 px-4 py-2.5 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)] text-xs text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)] transition-colors">
                What's on your mind? Share a thought, photo, or story...
              </div>
              <div className="p-2 rounded-2xl bg-[var(--accent)] text-white group-hover:opacity-90 transition-opacity shadow-sm">
                <Plus className="w-4 h-4" />
              </div>
            </div>
          )}

          {/* Feed Posts List */}
          {loading ? (
            <div className="flex flex-col gap-4">
              <PostSkeleton />
              <PostSkeleton />
            </div>
          ) : posts.length > 0 ? (
            <div className="flex flex-col gap-4">
              {posts.map((post) => (
                <PostCard 
                  key={post._id} 
                  post={post} 
                  onUpdate={fetchFeed} 
                />
              ))}
            </div>
          ) : (
            <EmptyState 
              icon={Sparkles}
              title="Your Feed is Ready"
              description="No moments have been shared yet. Be the first to share something with the community!"
              actionLabel={isAuthenticated ? "Create First Post" : "Sign In to Post"}
              onAction={() => {
                if (!isAuthenticated) navigate('/?mode=signin');
                else setIsCreateOpen(true);
              }}
            />
          )}
        </div>

        {/* Right Rail */}
        <div className="hidden lg:flex flex-col w-[300px] gap-5 select-none flex-shrink-0">
          {/* User Status Card */}
          {isAuthenticated && user ? (
            <div className="p-4 rounded-3xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-between shadow-xl">
              <Link to={`/u/${user.username}`} className="flex items-center gap-3 min-w-0 group">
                <UserAvatar 
                  src={user.avatar} 
                  name={user.displayName || user.username} 
                  size="md"
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[var(--text-primary)] truncate group-hover:underline">
                    {user.displayName || user.username}
                  </p>
                  <p className="text-[11px] text-[var(--text-tertiary)] truncate">@{user.username}</p>
                </div>
              </Link>
              <Link to="/settings" className="text-xs font-semibold text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
                Settings
              </Link>
            </div>
          ) : (
            <div className="p-5 rounded-3xl bg-[var(--surface)] border border-[var(--border)] text-center shadow-xl space-y-3">
              <h4 className="font-display text-sm font-bold text-[var(--text-primary)]">Join HumanHub</h4>
              <p className="text-xs text-[var(--text-secondary)]">Connect with friends, discover vibrant communities, and share moments.</p>
              <Button
                variant="primary"
                size="md"
                onClick={() => navigate('/?mode=signup')}
                className="w-full"
              >
                Sign Up & Join
              </Button>
            </div>
          )}

          {/* Suggested Users */}
          {suggestedUsers.length > 0 && (
            <div className="p-5 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-xl flex flex-col gap-3.5">
              <div className="flex items-center justify-between">
                <h4 className="font-display text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
                  People to Follow
                </h4>
                <Link to="/explore" className="text-[11px] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] font-semibold">
                  Discover
                </Link>
              </div>

              <div className="space-y-2.5">
                {suggestedUsers.map((u) => (
                  <div key={u._id} className="flex items-center justify-between gap-2">
                    <Link to={`/u/${u.username}`} className="flex items-center gap-2.5 min-w-0 group">
                      <UserAvatar 
                        src={u.avatar} 
                        name={u.displayName || u.username} 
                        size="sm"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[var(--text-primary)] truncate group-hover:underline">
                          {u.displayName || u.username}
                        </p>
                        <p className="text-[10px] text-[var(--text-tertiary)] truncate">@{u.username}</p>
                      </div>
                    </Link>

                    <button 
                      onClick={() => handleFollowSuggested(u._id)}
                      className="p-1.5 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] hover:border-[var(--accent)] text-[var(--text-primary)] text-xs font-bold flex-shrink-0 transition-colors"
                      title="Follow"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Community Highlights Card */}
          <div className="p-5 rounded-3xl bg-[var(--surface)] border border-[var(--border)] flex flex-col gap-2.5 shadow-xl">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] flex items-center justify-center text-[var(--violet)]">
                <Users className="w-4 h-4" />
              </div>
              <span className="font-display text-xs font-bold text-[var(--text-primary)]">Explore Communities</span>
            </div>
            <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
              Find spaces that match your interests—photography, design, technology, stories, music, and everyday life.
            </p>
            <Link to="/communities" className="text-[11px] font-bold text-[var(--accent)] hover:underline inline-flex items-center gap-1 mt-1">
              Browse communities <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {isCreateOpen && (
        <CreatePostModal 
          isOpen={isCreateOpen} 
          onClose={() => setIsCreateOpen(false)} 
          onPostCreated={fetchFeed}
        />
      )}
    </div>
  );
}
