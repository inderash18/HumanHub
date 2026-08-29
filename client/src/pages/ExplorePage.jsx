import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Compass, 
  Search, 
  Heart, 
  MessageSquare,
  Users,
  UserPlus,
  Sparkles
} from 'lucide-react';
import api from '../services/api';
import UserAvatar from '../components/common/UserAvatar';
import EmptyState from '../components/common/EmptyState';
import { PostSkeleton } from '../components/common/SkeletonLoader';
import { toast } from 'react-hot-toast';

export default function ExplorePage() {
  const [posts, setPosts] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // all, photos, communities, people
  const navigate = useNavigate();

  useEffect(() => {
    fetchExploreData();
  }, []);

  const fetchExploreData = async () => {
    try {
      setLoading(true);
      const [postsRes, commRes] = await Promise.all([
        api.get('/posts?limit=40'),
        api.get('/communities')
      ]);
      const postData = postsRes.data?.data || postsRes.data?.posts || postsRes.data || [];
      setPosts(Array.isArray(postData) ? postData : []);
      setCommunities(Array.isArray(commRes.data) ? commRes.data : []);
    } catch (err) {
      setPosts([]);
      setCommunities([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!searchTerm.trim()) {
      setUsers([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await api.get(`/users/search/query?q=${encodeURIComponent(searchTerm.trim())}`);
        setUsers(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        setUsers([]);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleFollowUser = async (targetId) => {
    try {
      const res = await api.post(`/users/${targetId}/follow`);
      toast.success(res.data.isFollowing ? 'Following!' : 'Unfollowed');
    } catch (err) {
      toast.error('Failed to update follow');
    }
  };

  const filteredPosts = posts.filter((p) => {
    const text = `${p.caption || ''} ${p.body || ''} ${p.author?.username || ''}`.toLowerCase();
    const matchesSearch = !searchTerm.trim() || text.includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;
    if (activeTab === 'photos') return p.mediaUrls && p.mediaUrls.length > 0;
    return true;
  });

  const filteredCommunities = communities.filter((c) => {
    const text = `${c.name} ${c.slug} ${c.description || ''}`.toLowerCase();
    return !searchTerm.trim() || text.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 select-none space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Compass className="w-5 h-5 text-[var(--cyan)]" />
            <h1 className="font-display text-xl sm:text-2xl font-extrabold text-[var(--text-primary)]">
              Discover
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
            Explore moments, active communities, and people from across HumanHub.
          </p>
        </div>
      </div>

      {/* Search Input & Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="max-w-md w-full relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
          <input 
            type="text"
            placeholder="Search moments, topics, or people..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] text-xs rounded-xl pl-10 pr-4 py-2.5 outline-none focus:border-[var(--accent)] placeholder:text-[var(--text-tertiary)] shadow-xl"
          />
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-1.5 p-1 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-xl">
          {[
            { id: 'all', label: 'Moments' },
            { id: 'photos', label: 'Media' },
            { id: 'communities', label: 'Communities' },
            { id: 'people', label: 'People' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === tab.id
                  ? 'bg-[var(--accent)] text-white shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* People Results Tab */}
      {activeTab === 'people' && (
        <div className="space-y-3">
          {users.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {users.map(u => (
                <div key={u._id} className="p-4 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-xl flex items-center justify-between">
                  <Link to={`/u/${u.username}`} className="flex items-center gap-3 min-w-0">
                    <UserAvatar src={u.avatar} name={u.displayName || u.username} size="sm" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[var(--text-primary)] truncate">{u.displayName || u.username}</p>
                      <p className="text-[10px] text-[var(--text-tertiary)] truncate">@{u.username}</p>
                    </div>
                  </Link>
                  <button 
                    onClick={() => handleFollowUser(u._id)}
                    className="p-2 rounded-xl bg-[var(--surface-elevated)] hover:bg-[var(--accent)] hover:text-white text-[var(--text-secondary)] transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState 
              icon={Users}
              title={searchTerm ? `No users matching "${searchTerm}"` : "Search for people"}
              description="Find creators and friends across HumanHub."
            />
          )}
        </div>
      )}

      {/* Communities Tab */}
      {activeTab === 'communities' && (
        <div>
          {filteredCommunities.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCommunities.map((c) => (
                <Link
                  key={c._id}
                  to={`/c/${c.slug}`}
                  className="p-5 rounded-3xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--border-subtle)] transition-all shadow-xl flex flex-col justify-between group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)] flex items-center justify-center text-[var(--violet)] font-bold text-sm">
                        {c.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-xs sm:text-sm text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                          c/{c.name}
                        </h3>
                        <span className="text-[10px] text-[var(--text-tertiary)]">{c.memberCount || 1} members</span>
                      </div>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] line-clamp-2">
                      {c.description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState 
              icon={Users}
              title="No communities found"
              description="Explore new topics or create your own community circle."
            />
          )}
        </div>
      )}

      {/* Moments / Photos Grid */}
      {(activeTab === 'all' || activeTab === 'photos') && (
        <div>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <PostSkeleton />
              <PostSkeleton />
              <PostSkeleton />
            </div>
          ) : filteredPosts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {filteredPosts.map((post) => {
                const mediaUrl = post.mediaUrls && post.mediaUrls[0];
                return (
                  <div
                    key={post._id}
                    onClick={() => navigate(`/p/${post._id}`)}
                    className="p-4 rounded-3xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--border-subtle)] cursor-pointer transition-all shadow-xl flex flex-col justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-2.5">
                      <UserAvatar 
                        src={post.author?.avatar} 
                        name={post.author?.displayName || post.author?.username} 
                        size="xs" 
                      />
                      <span className="font-bold text-xs text-[var(--text-primary)] truncate">
                        @{post.author?.username || 'member'}
                      </span>
                    </div>

                    {mediaUrl ? (
                      <div className="w-full aspect-square rounded-2xl overflow-hidden bg-[var(--surface-elevated)]">
                        <img 
                          src={mediaUrl} 
                          alt="Moment thumbnail" 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ) : (
                      <p className="text-xs text-[var(--text-secondary)] line-clamp-4 leading-relaxed my-2">
                        {post.caption || post.body}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-[var(--text-tertiary)] pt-1 border-t border-[var(--border)]">
                      <span className="flex items-center gap-1">
                        <Heart className="w-3.5 h-3.5 text-[var(--accent)]" /> {post.likesCount || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5 text-[var(--cyan)]" /> {post.commentsCount || 0}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState 
              icon={Sparkles}
              title="No moments discovered yet"
              description="Be the first to share your creative moments with HumanHub."
            />
          )}
        </div>
      )}
    </div>
  );
}
