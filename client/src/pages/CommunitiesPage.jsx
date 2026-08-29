import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Search, 
  ArrowRight
} from 'lucide-react';
import api from '../services/api';
import PageHeader from '../components/layout/PageHeader';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';

export default function CommunitiesPage() {
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchCommunities();
  }, []);

  const fetchCommunities = async () => {
    try {
      setLoading(true);
      const res = await api.get('/communities');
      setCommunities(res.data || []);
    } catch (err) {
      setCommunities([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = communities.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    (c.description || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 select-none">
      <PageHeader 
        title="Communities"
        description="Discover and join spaces centered around your passions, interests, and conversations."
        icon={Users}
        badge={
          <Badge variant="violet" size="sm">
            {communities.length} Communities
          </Badge>
        }
      />

      {/* Search Filter */}
      <div className="mb-6 max-w-md relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-hub-text-tertiary" />
        <input 
          type="text"
          placeholder="Search communities by topic..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-hub-surface border border-hub-border text-hub-text-primary text-xs rounded-xl pl-10 pr-4 py-2.5 outline-none focus:border-hub-accent placeholder:text-hub-text-tertiary shadow-xl"
        />
      </div>

      {/* Communities Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-36 bg-hub-surface border border-hub-border rounded-3xl animate-pulse p-4 shadow-xl" />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <Link 
              key={c._id || c.slug}
              to={`/c/${c.slug}`}
              className="p-5 rounded-3xl bg-hub-surface border border-hub-border hover:border-hub-border-light transition-all flex flex-col justify-between shadow-xl group"
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

              <div className="flex items-center justify-between pt-4 mt-3 border-t border-hub-border text-xs">
                <span className="text-hub-text-tertiary font-mono-code text-[11px]">
                  {c.members?.length || c.memberCount || 1} members
                </span>
                <span className="font-bold text-hub-accent flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  View Community <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState 
          icon={Users}
          title="No Communities Found"
          description={search ? `No topics matched "${search}".` : 'No communities created yet.'}
          actionLabel={search ? "Clear Filter" : undefined}
          onAction={search ? () => setSearch('') : undefined}
        />
      )}
    </div>
  );
}
