import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Compass, 
  Search, 
  Heart, 
  MessageSquare,
  Users,
  UserPlus
} from 'lucide-react';
import api from '../services/api';
import UserAvatar from '../components/common/UserAvatar';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import PageHeader from '../components/layout/PageHeader';
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
      setPosts(postsRes.data?.data || postsRes.data || []);
      setCommunities(commRes.data || []);
    } catch (err) {
      setPosts([]);
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
        setUsers(res.data || []);
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
      toast.error('Failed to follow');
    }
  };

  const filteredPosts = posts.filter((p) => {
    const text = `${p.title || ''} ${p.body || ''} ${p.author?.username || ''}`.toLowerCase();
    const matchesSearch = text.includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;
    if (activeTab === 'photos') return p.mediaUrls && p.mediaUrls.length > 0;
    return true;
  });

  const filteredCommunities = communities.filter((c) => {
    const text = `${c.name} ${c.slug} ${c.description || ''}`.toLowerCase();
    return text.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 select-none">
      <PageHeader 
        title="Discover"
        description="Explore moments, creative ideas, and conversations from across the community."
        icon={Compass}
        badge={
          <Badge variant="cyan" size="sm">
            {posts.length} Posts
          </Badge>
        }
      />

      {/* Search Input & Filter Tabs */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="max-w-md w-full relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-hub-text-tertiary" />
          <input 
            type="text"
            placeholder="Search posts, topics, or people..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-hub-surface border border-hub-border text-hub-text-primary text-xs rounded-xl pl-10 pr-4 py-2.5 outline-none focus:border-hub-accent placeholder:text-hub-text-tertiary shadow-xl"
          />
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-1.5 p-1 bg-hub-surface border border-hub-border rounded-xl shadow-xl">
          {[
            { id: 'all', label: 'All' },
            { id: 'photos', label: 'Photos' },
            { id: 'communities', label: 'Communities' },
            { id: 'people', label: 'People' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === tab.id
                  ? 'bg-hub-accent text-white shadow-sm'
                  : 'text-hub-text-secondary hover:text-hub-text-primary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* People Results Tab */}
      {activeTab === 'people' && (
        <div className="space-y-3 mb-6">
          {users.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {users.map(u => (
                <div key={u._id} className="p-4 rounded-3xl bg-hub-surface border border-hub-border shadow-xl flex items-center justify-between">
                  <Link to={`/u/${u.username}`} className="flex items-center gap-3 min-w-0">
                    <UserAvatar src={u.avatar} name={u.displayName || u.username} size="sm" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-hub-text-primary truncate">{u.displayName || u.username}</p>
                      <p className="text-[10px] text-hub-text-tertiary truncate">@{u.username}</p>
                    </div>
                  </Link>
                  <button 
                    onClick={() => handleFollowUser(u._id)}
                    className="p-2 rounded-xl bg-hub-surface-elevated hover:bg-hub-accent hover:text-white text-hub-text-secondary transition-colors"
                    title="Follow"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState 
              icon={Users}
              title="Search for People"
              description="Type a name or username in the search bar above to discover people on HumanHub."
            />
          )}
        </div>
      )}

      {/* Communities Results Tab */}
      {activeTab === 'communities' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          {filteredCommunities.length > 0 ? (
            filteredCommunities.map(c => (
              <Link 
                key={c._id || c.slug}
                to={`/c/${c.slug}`}
                className="p-5 rounded-3xl bg-hub-surface border border-hub-border hover:border-hub-border-light shadow-xl transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-9 h-9 rounded-xl bg-hub-surface-elevated border border-hub-border flex items-center justify-center text-hub-violet font-bold text-sm">
                      {c.name.charAt(0)}
                    </div>
                    <Badge variant="violet" size="sm">
                      c/{c.slug}
                    </Badge>
                  </div>
                  <h3 className="font-display font-bold text-sm text-hub-text-primary group-hover:underline mt-1">
                    {c.name}
                  </h3>
                  <p className="text-xs text-hub-text-secondary line-clamp-2 mt-1 leading-relaxed">
                    {c.description || 'A community space on HumanHub.'}
                  </p>
                </div>
                <div className="pt-3 mt-3 border-t border-hub-border text-xs text-hub-text-tertiary">
                  {c.memberCount || 1} members
                </div>
              </Link>
            ))
          ) : (
            <EmptyState 
              icon={Users}
              title="No Communities Found"
              description="No community spaces matched your search."
            />
          )}
        </div>
      )}

      {/* Posts Grid for All & Photos Tabs */}
      {(activeTab === 'all' || activeTab === 'photos') && (
        <>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 bg-hub-surface border border-hub-border rounded-3xl animate-pulse p-4 shadow-xl" />
              ))}
            </div>
          ) : filteredPosts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {filteredPosts.map((post) => (
                <Link 
                  key={post._id}
                  to={`/p/${post._id}`}
                  className="p-5 rounded-3xl bg-hub-surface border border-hub-border hover:border-hub-border-light transition-all flex flex-col justify-between shadow-xl group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <UserAvatar 
                          src={post.author?.avatar} 
                          name={post.author?.displayName || post.author?.username} 
                          size="xs"
                        />
                        <span className="font-bold text-xs text-hub-text-primary truncate max-w-[150px]">
                          {post.author?.displayName || post.author?.username || 'member'}
                        </span>
                      </div>
                    </div>

                    <h3 className="font-display font-bold text-sm text-hub-text-primary group-hover:underline line-clamp-1 mb-1">
                      {post.title || post.body?.slice(0, 40)}
                    </h3>
                    <p className="text-xs text-hub-text-secondary line-clamp-3 leading-relaxed">
                      {post.body}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-hub-border text-[11px] text-hub-text-tertiary">
                    <span className="flex items-center gap-1 font-mono-code text-hub-text-secondary">
                      <Heart className="w-3 h-3 text-hub-accent" /> {post.upvotes || 0}
                    </span>
                    <span className="flex items-center gap-1 font-mono-code text-hub-text-secondary">
                      <MessageSquare className="w-3 h-3 text-hub-cyan" /> {post.comments?.length || 0}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState 
              icon={Compass}
              title="No Posts Found"
              description={searchTerm ? `No posts matched "${searchTerm}".` : 'No posts published in the community yet.'}
              actionLabel={searchTerm ? "Clear Search" : undefined}
              onAction={searchTerm ? () => setSearchTerm('') : undefined}
            />
          )}
        </>
      )}
    </div>
  );
}
