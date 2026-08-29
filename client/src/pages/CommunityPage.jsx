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
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';

export default function CommunityPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();

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
        api.get('/posts').catch(() => ({ data: [] }))
      ]);

      const commData = commRes.data;
      setCommunity(commData);
      if (commData) {
        setIsJoined(Boolean(commData.isJoined));
      }

      // Filter posts belonging to this community
      const allPosts = postsRes.data?.data || postsRes.data || [];
      const commPosts = allPosts.filter(p => p.community?.slug === slug || p.community?.name?.toLowerCase() === slug?.toLowerCase());
      setPosts(commPosts);
    } catch (err) {
      setCommunity(null);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinToggle = async () => {
    if (!isAuthenticated) {
      return navigate('/login');
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
      toast.success(nextJoined ? `Joined c/${slug} ✨` : `Left c/${slug}`);
    } catch (err) {
      toast.error('Failed to update membership');
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-20 flex flex-col items-center justify-center select-none">
        <Users className="w-10 h-10 text-hub-text-tertiary animate-pulse mb-3" />
        <p className="text-xs text-hub-text-tertiary">Loading community...</p>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="w-full max-w-md mx-auto px-4 py-24 select-none">
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
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 select-none">
      {/* Back link */}
      <button
        onClick={() => navigate('/communities')}
        className="flex items-center gap-1.5 text-xs text-hub-text-tertiary hover:text-hub-text-primary font-semibold mb-4 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        All Communities
      </button>

      {/* Community Banner & Header Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-hub-surface border border-hub-border shadow-xl mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-hub-surface-elevated border border-hub-border text-hub-violet flex items-center justify-center font-display font-extrabold text-2xl shadow-sm">
            {community.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-xl sm:text-2xl font-bold text-hub-text-primary tracking-tight">
                {community.name}
              </h1>
              <Badge variant="violet" size="sm">
                c/{community.slug}
              </Badge>
            </div>
            <p className="text-xs text-hub-text-secondary max-w-lg mt-1 leading-relaxed">
              {community.description || 'Welcome to this community.'}
            </p>
            <p className="text-[11px] text-hub-text-tertiary mt-1">
              {community.memberCount || 1} members
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-shrink-0">
          <Button
            variant={isJoined ? 'secondary' : 'primary'}
            size="sm"
            onClick={handleJoinToggle}
            icon={isJoined ? Check : Users}
          >
            {isJoined ? 'Joined' : 'Join Community'}
          </Button>

          {isAuthenticated && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsCreateOpen(true)}
              icon={Plus}
            >
              Create Post
            </Button>
          )}
        </div>
      </div>

      {/* Posts Section */}
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center justify-between px-1 mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-hub-text-tertiary font-mono-code">
            Posts ({posts.length})
          </span>
        </div>

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
            title={`No posts yet in c/${community.slug}`}
            description={`Be the first to share a moment or start a discussion in c/${community.slug}.`}
            actionLabel="Create Post"
            onAction={() => {
              if (!isAuthenticated) navigate('/login');
              else setIsCreateOpen(true);
            }}
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
