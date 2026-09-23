import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Search, 
  Plus,
  ArrowRight,
  X
} from 'lucide-react';
import api from '../services/api';
import EmptyState from '../components/common/EmptyState';
import Button from '../components/ui/Button';
import { useAuthStore } from '../store/useAuthStore';
import { toast } from 'react-hot-toast';

export default function CommunitiesPage() {
  const { isAuthenticated } = useAuthStore();
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', description: '', category: 'General' });
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchCommunities();
  }, []);

  const fetchCommunities = async () => {
    try {
      setLoading(true);
      const res = await api.get('/communities');
      setCommunities(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setCommunities([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCommunity = async (e) => {
    e.preventDefault();
    if (!createForm.name.trim() || !createForm.description.trim()) {
      return toast.error('Please enter name and description');
    }

    try {
      setIsCreating(true);
      await api.post('/communities', {
        name: createForm.name.trim(),
        description: createForm.description.trim(),
        category: createForm.category
      });
      toast.success('Community created successfully!');
      setCreateModalOpen(false);
      setCreateForm({ name: '', description: '', category: 'General' });
      fetchCommunities();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create community');
    } finally {
      setIsCreating(false);
    }
  };

  const filtered = communities.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    (c.description || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 select-none space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">
            Communities
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Discover and join interest-based spaces on HumanHub
          </p>
        </div>

        {isAuthenticated && (
          <Button 
            variant="primary" 
            size="sm" 
            onClick={() => setCreateModalOpen(true)}
            icon={Plus}
          >
            Create Community
          </Button>
        )}
      </div>

      {/* Search Filter */}
      <div className="max-w-md relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
        <input 
          type="text"
          placeholder="Search communities..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--text-primary)] text-xs rounded-lg pl-9 pr-4 py-2 outline-none focus:border-[var(--text-secondary)] placeholder:text-[var(--text-tertiary)]"
        />
      </div>

      {/* Communities Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-36 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl animate-pulse p-4" />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <Link 
              key={c._id || c.slug}
              to={`/c/${c.slug}`}
              className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--border-subtle)] transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--surface-elevated)] border border-[var(--border)] flex items-center justify-center text-[var(--text-primary)] font-bold text-sm">
                    {c.name.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-[var(--surface-elevated)] text-[var(--text-secondary)] border border-[var(--border)]">
                    c/{c.slug}
                  </span>
                </div>

                <h3 className="font-semibold text-sm text-[var(--text-primary)] group-hover:text-[#0095F6] transition-colors">
                  {c.name}
                </h3>
                <p className="text-xs text-[var(--text-secondary)] line-clamp-2 mt-1 leading-relaxed">
                  {c.description || 'A community space on HumanHub.'}
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 mt-3 border-t border-[var(--border)] text-xs">
                <span className="text-[var(--text-tertiary)] text-[11px]">
                  {c.memberCount || 1} members
                </span>
                <span className="font-semibold text-[#0095F6] flex items-center gap-1 text-xs">
                  View <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState 
          icon={Users}
          title="No Communities Found"
          description={search ? `No spaces matched "${search}".` : 'No communities created yet. Create the first one!'}
          actionLabel={isAuthenticated ? "Create Community" : undefined}
          onAction={() => setCreateModalOpen(true)}
        />
      )}

      {/* Create Community Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-[2px] animate-fade-in">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 max-w-md w-full shadow-2xl relative">
            <button
              onClick={() => setCreateModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-full text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)]"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-semibold text-base text-[var(--text-primary)] mb-4">
              Create New Community
            </h3>

            <form onSubmit={handleCreateCommunity} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1">
                  Community Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Photography Masters"
                  value={createForm.name}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-[var(--surface-elevated)] border border-[var(--border)] text-xs text-[var(--text-primary)] rounded-lg p-2.5 outline-none focus:border-[var(--text-secondary)]"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="What is this community about?"
                  value={createForm.description}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-[var(--surface-elevated)] border border-[var(--border)] text-xs text-[var(--text-primary)] rounded-lg p-2.5 outline-none focus:border-[var(--text-secondary)] resize-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  type="button" 
                  onClick={() => setCreateModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  variant="primary" 
                  size="sm" 
                  type="submit" 
                  isLoading={isCreating}
                >
                  Create
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
