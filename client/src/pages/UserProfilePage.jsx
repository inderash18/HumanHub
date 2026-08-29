import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Bookmark, 
  Activity, 
  Settings, 
  MessageSquare, 
  UserPlus, 
  UserMinus, 
  Lock, 
  Upload, 
  Camera
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '../store/useAuthStore';
import api from '../services/api';
import PostCard from '../components/posts/PostCard';
import UserAvatar from '../components/common/UserAvatar';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import { Input, Textarea } from '../components/ui/Input';

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
  const [followersModalOpen, setFollowersModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalUsersList, setModalUsersList] = useState([]);

  const [editForm, setEditForm] = useState({
    displayName: '',
    bio: '',
    avatar: '',
    isPrivate: false
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
      const res = await api.get(`/users/${targetUsername}`);
      const data = res.data?.profile || res.data?.user || res.data || {};
      setProfile(data);
      setPosts(res.data?.posts || []);
      setIsFollowing(data.isFollowing || false);

      setEditForm({
        displayName: data.displayName || data.username || '',
        bio: data.bio || '',
        avatar: data.avatar || '',
        isPrivate: data.privacySettings?.isPrivate || false
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
      setSavedPosts(res.data || []);
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

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Profile photo must be smaller than 5MB');
      return;
    }

    try {
      setUploadingAvatar(true);
      const formData = new FormData();
      formData.append('avatar', file);

      const res = await api.post('/users/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success('Profile photo updated! ✨');
      if (res.data?.user) {
        updateUser(res.data.user);
      }
      fetchUserProfile();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload photo');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!isAuthenticated) {
      navigate('/login');
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
      toast.error('Failed to update follow');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      setSavingEdit(true);
      const res = await api.put('/users/me', {
        displayName: editForm.displayName.trim(),
        bio: editForm.bio.trim(),
        avatar: editForm.avatar.trim(),
        privacySettings: {
          isPrivate: editForm.isPrivate
        }
      });

      updateUser(res.data);
      setProfile(prev => ({ ...prev, ...res.data }));
      setEditModalOpen(false);
      toast.success('Profile updated! ✨');
    } catch (err) {
      toast.error('Failed to save profile changes');
    } finally {
      setSavingEdit(false);
    }
  };

  const showFollowers = async () => {
    if (!profile?._id) return;
    try {
      const res = await api.get(`/users/${profile._id}/followers`);
      setModalTitle(`Followers of @${profile.username}`);
      setModalUsersList(res.data || []);
      setFollowersModalOpen(true);
    } catch (err) {
      toast.error('Failed to load followers list');
    }
  };

  const showFollowing = async () => {
    if (!profile?._id) return;
    try {
      const res = await api.get(`/users/${profile._id}/following`);
      setModalTitle(`People followed by @${profile.username}`);
      setModalUsersList(res.data || []);
      setFollowersModalOpen(true);
    } catch (err) {
      toast.error('Failed to load following list');
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-20 flex flex-col items-center justify-center select-none">
        <p className="text-xs text-hub-text-tertiary">Loading profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="w-full max-w-md mx-auto px-4 py-24 select-none">
        <EmptyState
          title="User Not Found"
          description={`The requested username @${targetUsername} does not exist.`}
          actionLabel="Go to Feed"
          onAction={() => navigate('/feed')}
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 select-none">
      {/* Profile Header Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-hub-surface border border-hub-border shadow-xl mb-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar with Upload Hover */}
          <div className="relative flex-shrink-0 group">
            <UserAvatar 
              src={profile.avatar} 
              name={profile.displayName || profile.username} 
              size="2xl"
            />

            {isOwnProfile && (
              <>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-xs font-bold"
                  title="Upload profile photo"
                >
                  <Camera className="w-5 h-5 mb-1" />
                  <span>{uploadingAvatar ? 'Uploading...' : 'Change'}</span>
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleAvatarUpload} 
                  accept="image/*" 
                  className="hidden" 
                />
              </>
            )}
          </div>

          {/* User Info & Stats */}
          <div className="flex-1 flex flex-col items-center sm:items-start text-center sm:text-left gap-3">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
              <div>
                <h1 className="font-display text-2xl font-bold text-hub-text-primary tracking-tight">
                  {profile.displayName || profile.username}
                </h1>
                <p className="text-xs text-hub-text-tertiary">
                  @{profile.username}
                </p>
              </div>
            </div>

            {/* Bio */}
            <p className="text-xs sm:text-sm text-hub-text-secondary max-w-lg leading-relaxed">
              {profile.bio || "Connecting and sharing on HumanHub."}
            </p>

            {/* Stats */}
            <div className="flex items-center gap-6 sm:gap-8 pt-1">
              <div className="flex flex-col items-center sm:items-start">
                <span className="font-display text-base sm:text-lg font-bold text-hub-text-primary">
                  {profile.postsCount ?? posts.length}
                </span>
                <span className="text-[10px] text-hub-text-tertiary uppercase tracking-wider font-semibold">Posts</span>
              </div>

              <div 
                onClick={showFollowers}
                className="flex flex-col items-center sm:items-start cursor-pointer group"
              >
                <span className="font-display text-base sm:text-lg font-bold text-hub-text-primary group-hover:underline">
                  {profile.followersCount ?? 0}
                </span>
                <span className="text-[10px] text-hub-text-tertiary uppercase tracking-wider font-semibold group-hover:text-hub-text-primary">Followers</span>
              </div>

              <div 
                onClick={showFollowing}
                className="flex flex-col items-center sm:items-start cursor-pointer group"
              >
                <span className="font-display text-base sm:text-lg font-bold text-hub-text-primary group-hover:underline">
                  {profile.followingCount ?? 0}
                </span>
                <span className="text-[10px] text-hub-text-tertiary uppercase tracking-wider font-semibold group-hover:text-hub-text-primary">Following</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              {isOwnProfile ? (
                <>
                  <Button 
                    variant="secondary"
                    size="sm"
                    onClick={() => setEditModalOpen(true)}
                    icon={Settings}
                  >
                    Edit Profile
                  </Button>

                  <Button 
                    variant="primary"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    icon={Upload}
                  >
                    {profile.avatar ? 'Change Photo' : 'Upload Photo'}
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    variant={isFollowing ? 'secondary' : 'primary'}
                    size="sm"
                    onClick={handleFollowToggle}
                    disabled={followLoading}
                    icon={isFollowing ? UserMinus : UserPlus}
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </Button>

                  <Button 
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate('/messages')}
                    icon={MessageSquare}
                  >
                    Message
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-hub-border pb-px mb-6">
        <button 
          onClick={() => setActiveTab('posts')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 -mb-px ${
            activeTab === 'posts' 
              ? 'border-hub-accent text-hub-accent' 
              : 'border-transparent text-hub-text-tertiary hover:text-hub-text-primary'
          }`}
        >
          <Activity className="w-4 h-4" />
          Posts ({posts.length})
        </button>

        {isOwnProfile && (
          <button 
            onClick={() => setActiveTab('saved')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 -mb-px ${
              activeTab === 'saved' 
                ? 'border-hub-accent text-hub-accent' 
                : 'border-transparent text-hub-text-tertiary hover:text-hub-text-primary'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            Saved ({savedPosts.length})
          </button>
        )}
      </div>

      {/* Tab Contents */}
      {activeTab === 'posts' && (
        <div className="space-y-4 max-w-xl mx-auto">
          {posts.length > 0 ? (
            posts.map((post) => (
              <PostCard 
                key={post._id} 
                post={{
                  ...post,
                  author: {
                    _id: profile._id,
                    username: profile.username,
                    displayName: profile.displayName,
                    avatar: profile.avatar
                  }
                }} 
                onUpdate={fetchUserProfile}
              />
            ))
          ) : (
            <EmptyState 
              icon={Activity}
              title="No Posts Yet"
              description={isOwnProfile 
                ? 'You have not shared any posts yet.'
                : `@${profile.username} has not posted anything yet.`}
              actionLabel={isOwnProfile ? "Share Your First Post" : undefined}
              onAction={isOwnProfile ? () => navigate('/feed') : undefined}
            />
          )}
        </div>
      )}

      {activeTab === 'saved' && isOwnProfile && (
        <div className="space-y-4 max-w-xl mx-auto">
          {savedPosts.length > 0 ? (
            savedPosts.map((post) => (
              <PostCard 
                key={post._id} 
                post={post} 
                onUpdate={() => {
                  fetchSavedPosts();
                  fetchUserProfile();
                }}
              />
            ))
          ) : (
            <EmptyState 
              icon={Bookmark}
              title="No Saved Posts"
              description="Click the bookmark icon on any post to save it to your private library."
              actionLabel="Explore Feed"
              onAction={() => navigate('/feed')}
            />
          )}
        </div>
      )}

      {/* Edit Profile Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Profile"
        description="Update your public profile details."
      >
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <Input 
            label="Display Name"
            value={editForm.displayName}
            onChange={(e) => setEditForm(prev => ({ ...prev, displayName: e.target.value }))}
            placeholder="Your name"
          />

          <Textarea 
            label="Bio"
            rows={3}
            value={editForm.bio}
            onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
            placeholder="Tell people about yourself..."
          />

          <Input 
            label="Avatar URL (or upload photo above)"
            value={editForm.avatar}
            onChange={(e) => setEditForm(prev => ({ ...prev, avatar: e.target.value }))}
            placeholder="/api/uploads/... or image URL"
          />

          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-hub-surface-elevated border border-hub-border">
            <div className="flex items-center gap-2.5">
              <Lock className="w-4 h-4 text-hub-accent" />
              <div>
                <p className="text-xs font-bold text-hub-text-primary">Private Account</p>
                <p className="text-[11px] text-hub-text-tertiary">Require approval before people can follow you</p>
              </div>
            </div>
            <input 
              type="checkbox"
              checked={editForm.isPrivate}
              onChange={(e) => setEditForm(prev => ({ ...prev, isPrivate: e.target.checked }))}
              className="w-4 h-4 accent-hub-accent rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-hub-border">
            <Button 
              type="button" 
              variant="ghost"
              size="md"
              onClick={() => setEditModalOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              variant="primary"
              size="md"
              isLoading={savingEdit}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Followers / Following Modal */}
      <Modal
        isOpen={followersModalOpen}
        onClose={() => setFollowersModalOpen(false)}
        title={modalTitle}
      >
        <div className="max-h-80 overflow-y-auto space-y-1.5 divide-y divide-hub-border">
          {modalUsersList.length > 0 ? (
            modalUsersList.map(u => (
              <div 
                key={u._id}
                onClick={() => {
                  setFollowersModalOpen(false);
                  navigate(`/u/${u.username}`);
                }}
                className="flex items-center justify-between p-2 rounded-2xl hover:bg-hub-surface-elevated cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <UserAvatar 
                    src={u.avatar} 
                    name={u.displayName || u.username} 
                    size="sm" 
                  />
                  <div>
                    <p className="text-xs font-bold text-hub-text-primary">{u.displayName || u.username}</p>
                    <p className="text-[11px] text-hub-text-tertiary">@{u.username}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-hub-text-tertiary text-center py-6">No users in this list yet.</p>
          )}
        </div>
      </Modal>
    </div>
  );
}
