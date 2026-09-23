import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Users, 
  Plus, 
  ArrowLeft,
  Check
} from 'lucide-react';
import api from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { toast } from 'react-hot-toast';
import PostCard from '../components/posts/PostCard';
import CreatePostModal from '../components/posts/CreatePostModal';
import Button from '../components/ui/Button';
import EmptyState from '../components/common/EmptyState';

export default function CommunityPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  const [community, setCommunity] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isJoined, setIsJoined] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  useEffect(() => {
    fetchCommunityData();
  }, [slug]);

  const fetchCommunityData = async () => {
    try {
      setLoading(true);
      const [commRes, postsRes] = await Promise.all([
        api.get(`/communities/${slug}`).catch(() => ({ data: null })),
        api.get(`/posts?community=${slug}`).catch(() => ({ data: [] }))
      ]);

      const commData = commRes.data;
      setCommunity(commData);
      if (commData) {
        setIsJoined(Boolean(commData.isJoined));
      }

      const postData = postsRes.data?.data || postsRes.data?.posts || postsRes.data || [];
      setPosts(Array.isArray(postData) ? postData : []);
    } catch (err) {
      setCommunity(null);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinToggle = async () => {
    if (!isAuthenticated) {
      return navigate('/?mode=signin');
    }
    try {
      const res = await api.post(`/communities/${slug}/join`);
      const nextJoined = res.data?.isJoined ?? !isJoined;
      setIsJoined(nextJoined);
      if (community) {
        setCommunity({
          ...community,
          memberCount: res.data?.memberCount ?? community.memberCount,
          isJoined: nextJoined
        });
      }
      toast.success(nextJoined ? `Joined c/${slug}` : `Left c/${slug}`);
    } catch (err) {
      toast.error('Failed to update membership');
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-lg mx-auto px-4 py-20 flex flex-col items-center justify-center select-none">
        <Users className="w-8 h-8 text-[var(--text-tertiary)] animate-pulse mb-3" />
        <p className="text-xs text-[var(--text-tertiary)]">Loading community...</p>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="w-full max-w-md mx-auto px-4 py-20 select-none">
        <EmptyState
          icon={Users}
          title="Community Not Found"
          description={`The space c/${slug} does not exist.`}
          actionLabel="Explore All Communities"
          onAction={() => navigate('/communities')}
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-6 select-none space-y-6">
      {/* Back link */}
      <button
        onClick={() => navigate('/communities')}
        className="flex items-center gap-1.5 text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)] font-semibold transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        All Communities
      </button>

      {/* Community Header */}
      <div className="p-4 sm:p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-full bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--text-primary)] flex items-center justify-center font-bold text-lg">
            {community.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
                {community.name}
              </h1>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-[var(--surface-elevated)] text-[var(--text-secondary)] border border-[var(--border)]">
                c/{community.slug}
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] max-w-md mt-0.5 leading-relaxed">
              {community.description || 'Welcome to this community.'}
            </p>
            <p className="text-[11px] text-[var(--text-tertiary)] mt-1">
              {community.memberCount || 1} members
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto justify-end">
          <Button
            variant={isJoined ? 'secondary' : 'primary'}
            size="sm"
            onClick={handleJoinToggle}
            icon={isJoined ? Check : undefined}
          >
            {isJoined ? 'Joined' : 'Join'}
          </Button>

          {isAuthenticated && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCreateOpen(true)}
              icon={Plus}
            >
              Post
            </Button>
          )}
        </div>
      </div>

      {/* Community Feed */}
      <div className="space-y-4">
        {posts.length > 0 ? (
          posts.map(post => (
            <PostCard 
              key={post._id} 
              post={post} 
              onUpdate={fetchCommunityData}
            />
          ))
        ) : (
          <EmptyState
            icon={Users}
            title="No posts in this community yet"
            description="Be the first to share a post in this space!"
            actionLabel={isAuthenticated ? "Create Post" : undefined}
            onAction={() => setIsCreateOpen(true)}
          />
        )}
      </div>

      {isCreateOpen && (
        <CreatePostModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          onPostCreated={fetchCommunityData}
          defaultCommunityId={community._id}
        />
      )}
    </div>
  );
}
