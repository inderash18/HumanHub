import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Bookmark, 
  Grid, 
  Settings, 
  MessageSquare, 
  UserPlus, 
  UserMinus, 
  Camera,
  X,
  Sparkles
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '../store/useAuthStore';
import api from '../services/api';
import PostCard from '../components/posts/PostCard';
import UserAvatar from '../components/common/UserAvatar';
import EmptyState from '../components/common/EmptyState';
import { ProfileSkeleton } from '../components/common/SkeletonLoader';
import Button from '../components/ui/Button';

export default function UserProfilePage() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, updateUser, isAuthenticated } = useAuthStore();
  const fileInputRef = useRef(null);

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [activeTab, setActiveTab] = useState('posts');
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const [editForm, setEditForm] = useState({
    displayName: '',
    bio: ''
  });
  const [savingEdit, setSavingEdit] = useState(false);

  const targetUsername = username || currentUser?.username;
  const isOwnProfile = currentUser && (currentUser.username?.toLowerCase() === targetUsername?.toLowerCase());

  useEffect(() => {
    if (targetUsername) {
      fetchUserProfile();
    }
  }, [targetUsername]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/users/profile/${targetUsername}`);
      const data = res.data?.profile || res.data?.user || res.data || {};
      setProfile(data);
      setPosts(res.data?.posts || []);
      setIsFollowing(data.isFollowing || false);

      setEditForm({
        displayName: data.displayName || data.username || '',
        bio: data.bio || ''
      });

      if (isOwnProfile) {
        fetchSavedPosts();
      }
    } catch (err) {
      setProfile(null);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedPosts = async () => {
    try {
      const res = await api.get('/posts/saved');
      setSavedPosts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setSavedPosts([]);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Only image files (JPG, PNG, WebP) are allowed');
      return;
    }

    try {
      setUploadingAvatar(true);
      const formData = new FormData();
      formData.append('files', file);

      const uploadRes = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const avatarUrl = uploadRes.data.url || (uploadRes.data.urls && uploadRes.data.urls[0]);

      if (avatarUrl) {
        await api.put('/users/profile', { avatar: avatarUrl });
        updateUser({ avatar: avatarUrl });
        toast.success('Avatar updated successfully! ✨');
        fetchUserProfile();
      }
    } catch (err) {
      toast.error('Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!isAuthenticated) {
      navigate('/?mode=signin');
      return;
    }
    if (!profile?._id || followLoading) return;

    try {
      setFollowLoading(true);
      const res = await api.post(`/users/${profile._id}/follow`);
      const nextFollowingState = res.data.isFollowing;
      setIsFollowing(nextFollowingState);
      setProfile(prev => ({
        ...prev,
        followersCount: nextFollowingState ? (prev.followersCount || 0) + 1 : Math.max(0, (prev.followersCount || 0) - 1),
        isFollowing: nextFollowingState
      }));
      toast.success(nextFollowingState ? `Following @${profile.username}` : `Unfollowed @${profile.username}`);
    } catch (err) {
      toast.error('Failed to update follow status');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      setSavingEdit(true);
      const res = await api.put('/users/profile', {
        displayName: editForm.displayName.trim(),
        bio: editForm.bio.trim()
      });

      if (res.data?.user) {
        updateUser(res.data.user);
      }
      toast.success('Profile updated ✨');
      setEditModalOpen(false);
      fetchUserProfile();
    } catch (err) {
      toast.error('Failed to save profile changes');
    } finally {
      setSavingEdit(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-10 select-none">
        <ProfileSkeleton />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-16 text-center select-none">
        <EmptyState 
          title="User not found"
          description="The profile you are looking for does not exist or has been removed."
          actionLabel="Back to Feed"
          onAction={() => navigate('/feed')}
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 select-none space-y-8">
      {/* Profile Header Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8">
          {/* Avatar with Upload Action */}
          <div className="relative group">
            <UserAvatar 
              src={profile.avatar} 
              name={profile.displayName || profile.username} 
              size="2xl"
              className="border-2 border-[var(--border)] shadow-md"
            />
            {isOwnProfile && (
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute bottom-0 right-0 p-2 rounded-full bg-[var(--accent)] text-white shadow-lg hover:scale-105 transition-transform"
                title="Change Avatar"
              >
                <Camera className="w-4 h-4" />
              </button>
            )}
            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/*" 
              onChange={handleAvatarUpload} 
              className="hidden" 
            />
          </div>

          {/* User Details */}
          <div className="flex-1 text-center sm:text-left space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="font-display text-xl sm:text-2xl font-extrabold text-[var(--text-primary)]">
                  {profile.displayName || profile.username}
                </h1>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-mono">
                  @{profile.username}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-center sm:justify-end gap-2">
                {isOwnProfile ? (
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    onClick={() => setEditModalOpen(true)}
                    icon={Settings}
                  >
                    Edit Profile
                  </Button>
                ) : (
                  <>
                    <Button 
                      variant={isFollowing ? 'secondary' : 'primary'} 
                      size="sm" 
                      onClick={handleFollowToggle}
                      isLoading={followLoading}
                      icon={isFollowing ? UserMinus : UserPlus}
                    >
                      {isFollowing ? 'Following' : 'Follow'}
                    </Button>
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      onClick={() => navigate(`/messages?user=${profile._id}`)}
                      icon={MessageSquare}
                    >
                      Message
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Bio */}
            {profile.bio && (
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed max-w-xl">
                {profile.bio}
              </p>
            )}

            {/* Statistics */}
            <div className="flex items-center justify-center sm:justify-start gap-6 pt-2 border-t border-[var(--border)]/60 text-xs">
              <div>
                <span className="font-bold text-[var(--text-primary)] text-sm">{profile.postsCount || posts.length}</span>
                <span className="text-[var(--text-tertiary)] ml-1.5">Moments</span>
              </div>
              <div>
                <span className="font-bold text-[var(--text-primary)] text-sm">{profile.followersCount || 0}</span>
                <span className="text-[var(--text-tertiary)] ml-1.5">Followers</span>
              </div>
              <div>
                <span className="font-bold text-[var(--text-primary)] text-sm">{profile.followingCount || 0}</span>
                <span className="text-[var(--text-tertiary)] ml-1.5">Following</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Tabs */}
      <div className="flex items-center justify-center border-b border-[var(--border)]">
        <button
          onClick={() => setActiveTab('posts')}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 text-xs font-bold transition-all ${
            activeTab === 'posts'
              ? 'border-[var(--accent)] text-[var(--accent)]'
              : 'border-transparent text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
          }`}
        >
          <Grid className="w-4 h-4" /> Moments ({posts.length})
        </button>

        {isOwnProfile && (
          <button
            onClick={() => setActiveTab('saved')}
            className={`flex items-center gap-2 px-6 py-3 border-b-2 text-xs font-bold transition-all ${
              activeTab === 'saved'
                ? 'border-[var(--accent)] text-[var(--accent)]'
                : 'border-transparent text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
            }`}
          >
            <Bookmark className="w-4 h-4" /> Bookmarks ({savedPosts.length})
          </button>
        )}
      </div>

      {/* Tab Content */}
      {activeTab === 'posts' && (
        <div>
          {posts.length > 0 ? (
            <div className="max-w-xl mx-auto space-y-4">
              {posts.map(post => (
                <PostCard 
                  key={post._id} 
                  post={post} 
                  onUpdate={fetchUserProfile}
                />
              ))}
            </div>
          ) : (
            <EmptyState 
              icon={Sparkles}
              title="No Moments Yet"
              description={isOwnProfile ? "You haven't shared any moments yet. Capture and share your first moment!" : `@${profile.username} hasn't shared any moments yet.`}
            />
          )}
        </div>
      )}

      {activeTab === 'saved' && (
        <div>
          {savedPosts.length > 0 ? (
            <div className="max-w-xl mx-auto space-y-4">
              {savedPosts.map(post => (
                <PostCard 
                  key={post._id} 
                  post={post} 
                  onUpdate={fetchSavedPosts}
                />
              ))}
            </div>
          ) : (
            <EmptyState 
              icon={Bookmark}
              title="No Saved Moments"
              description="Tap the bookmark button on any post to save it for later."
            />
          )}
        </div>
      )}

      {/* Edit Profile Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl relative">
            <button
              onClick={() => setEditModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-xl text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)]"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-display text-lg font-bold text-[var(--text-primary)] mb-4">
              Edit Profile
            </h3>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-1.5">
                  Display Name
                </label>
                <input
                  type="text"
                  value={editForm.displayName}
                  onChange={(e) => setEditForm(prev => ({ ...prev, displayName: e.target.value }))}
                  className="w-full bg-[var(--surface-elevated)] border border-[var(--border)] text-xs text-[var(--text-primary)] rounded-xl p-2.5 outline-none focus:border-[var(--accent)]"
                  placeholder="Your Name"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-1.5">
                  Bio
                </label>
                <textarea
                  rows={3}
                  value={editForm.bio}
                  onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                  className="w-full bg-[var(--surface-elevated)] border border-[var(--border)] text-xs text-[var(--text-primary)] rounded-xl p-2.5 outline-none focus:border-[var(--accent)] resize-none"
                  placeholder="Write a short bio about yourself..."
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
                <Button 
                  variant="ghost" 
                  size="md" 
                  type="button" 
                  onClick={() => setEditModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  variant="primary" 
                  size="md" 
                  type="submit" 
                  isLoading={savingEdit}
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
