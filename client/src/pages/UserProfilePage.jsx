import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Grid, 
  Bookmark, 
  Film, 
  Tag, 
  Settings, 
  Plus, 
  Heart, 
  MessageCircle, 
  Camera,
  X,
  Sparkles,
  Link as LinkIcon
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '../store/useAuthStore';
import api from '../services/api';
import UserAvatar from '../components/common/UserAvatar';
import EmptyState from '../components/common/EmptyState';
import { ProfileSkeleton } from '../components/common/SkeletonLoader';

export default function UserProfilePage() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, updateUser, isAuthenticated } = useAuthStore();
  const fileInputRef = useRef(null);

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [activeTab, setActiveTab] = useState('posts'); // 'posts' | 'reels' | 'saved' | 'tagged'
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
      toast.error('Only image files are allowed');
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
        toast.success('Profile photo updated');
        fetchUserProfile();
      }
    } catch (err) {
      toast.error('Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!isAuthenticated) return navigate('/login');
    if (!profile?._id || followLoading) return;

    try {
      setFollowLoading(true);
      const res = await api.post(`/users/${profile._id}/follow`);
      const nextState = res.data.isFollowing;
      setIsFollowing(nextState);
      setProfile(prev => ({
        ...prev,
        followersCount: nextState ? (prev.followersCount || 0) + 1 : Math.max(0, (prev.followersCount || 0) - 1),
        isFollowing: nextState
      }));
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
      const res = await api.put('/users/profile', {
        displayName: editForm.displayName.trim(),
        bio: editForm.bio.trim()
      });

      if (res.data?.user) {
        updateUser(res.data.user);
      }
      toast.success('Profile saved');
      setEditModalOpen(false);
      fetchUserProfile();
    } catch (err) {
      toast.error('Failed to save profile');
    } finally {
      setSavingEdit(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-[935px] mx-auto px-4 py-8">
        <ProfileSkeleton />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="w-full max-w-[935px] mx-auto px-4 py-16 text-center">
        <EmptyState 
          title="Sorry, this page isn't available."
          description="The link you followed may be broken, or the page may have been removed."
          actionLabel="Go back to HumanHub"
          onAction={() => navigate('/feed')}
        />
      </div>
    );
  }

  const displayedPosts = activeTab === 'saved' ? savedPosts : posts;

  return (
    <div className="w-full max-w-[935px] mx-auto px-4 sm:px-6 py-6 md:py-10 select-none">
      
      {/* 1. Header Profile Section */}
      <header className="flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-24 mb-10 pb-4">
        {/* Large Avatar */}
        <div className="relative flex-shrink-0">
          <div className="cursor-pointer" onClick={() => isOwnProfile && fileInputRef.current?.click()}>
            <UserAvatar 
              src={profile.avatar} 
              name={profile.displayName || profile.username} 
              size="3xl"
              hasStory={true}
            />
          </div>
          {isOwnProfile && (
            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/*" 
              onChange={handleAvatarUpload} 
              className="hidden" 
            />
          )}
        </div>

        {/* User Details & Controls */}
        <div className="flex-1 flex flex-col gap-5 text-center md:text-left w-full">
          {/* Row 1: Username & Action Buttons */}
          <div className="flex flex-col md:flex-row items-center gap-4">
            <h2 className="text-xl font-normal text-[var(--ig-text-primary)]">
              {profile.username}
            </h2>

            <div className="flex items-center gap-2">
              {isOwnProfile ? (
                <>
                  <button 
                    onClick={() => setEditModalOpen(true)}
                    className="ig-btn-secondary text-xs px-4 py-1.5"
                  >
                    Edit profile
                  </button>
                  <button 
                    onClick={() => navigate('/settings')}
                    className="ig-btn-secondary text-xs px-4 py-1.5"
                  >
                    View archive
                  </button>
                  <button 
                    onClick={() => navigate('/settings')}
                    className="p-1.5 text-[var(--ig-text-primary)] hover:opacity-70"
                    title="Settings"
                  >
                    <Settings className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={handleFollowToggle}
                    disabled={followLoading}
                    className={`text-xs px-6 py-1.5 font-semibold rounded-lg transition-colors ${
                      isFollowing 
                        ? 'ig-btn-secondary' 
                        : 'ig-btn-primary'
                    }`}
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </button>
                  <button 
                    onClick={() => navigate(`/messages?user=${profile._id}`)}
                    className="ig-btn-secondary text-xs px-4 py-1.5"
                  >
                    Message
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Row 2: Counts (Posts, Followers, Following) */}
          <ul className="flex items-center justify-center md:justify-start gap-10 text-sm">
            <li>
              <span className="font-semibold text-[var(--ig-text-primary)]">{profile.postsCount || posts.length}</span>{' '}
              <span className="text-[var(--ig-text-primary)]">posts</span>
            </li>
            <li>
              <span className="font-semibold text-[var(--ig-text-primary)]">{profile.followersCount || 0}</span>{' '}
              <span className="text-[var(--ig-text-primary)]">followers</span>
            </li>
            <li>
              <span className="font-semibold text-[var(--ig-text-primary)]">{profile.followingCount || 0}</span>{' '}
              <span className="text-[var(--ig-text-primary)]">following</span>
            </li>
          </ul>

          {/* Row 3: Bio Details */}
          <div className="text-sm text-[var(--ig-text-primary)] space-y-1">
            <p className="font-semibold">{profile.displayName || profile.username}</p>
            {profile.bio && (
              <p className="whitespace-pre-line text-[var(--ig-text-primary)] text-sm leading-relaxed max-w-lg">
                {profile.bio}
              </p>
            )}
          </div>
        </div>
      </header>

      {/* 2. Story Highlights Tray */}
      <div className="flex items-center gap-6 overflow-x-auto no-scrollbar py-2 mb-10 select-none">
        {isOwnProfile && (
          <div className="flex flex-col items-center gap-2 cursor-pointer group">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border border-[var(--ig-border)] bg-[var(--ig-elevated)] flex items-center justify-center text-[var(--ig-text-tertiary)] group-hover:text-[var(--ig-text-primary)] transition-colors">
              <Plus className="w-8 h-8 stroke-[1.5]" />
            </div>
            <span className="text-xs font-semibold text-[var(--ig-text-primary)]">New</span>
          </div>
        )}
      </div>

      {/* 3. Navigation Tabs */}
      <div className="border-t border-[var(--ig-border)] flex items-center justify-center gap-12 text-xs font-semibold uppercase tracking-widest">
        <button
          onClick={() => setActiveTab('posts')}
          className={`flex items-center gap-1.5 py-4 border-t ${
            activeTab === 'posts'
              ? 'border-[var(--ig-text-primary)] text-[var(--ig-text-primary)] -mt-[1px]'
              : 'border-transparent text-[var(--ig-text-tertiary)] hover:text-[var(--ig-text-secondary)]'
          }`}
        >
          <Grid className="w-3.5 h-3.5" /> POSTS
        </button>

        <button
          onClick={() => setActiveTab('reels')}
          className={`flex items-center gap-1.5 py-4 border-t ${
            activeTab === 'reels'
              ? 'border-[var(--ig-text-primary)] text-[var(--ig-text-primary)] -mt-[1px]'
              : 'border-transparent text-[var(--ig-text-tertiary)] hover:text-[var(--ig-text-secondary)]'
          }`}
        >
          <Film className="w-3.5 h-3.5" /> REELS
        </button>

        {isOwnProfile && (
          <button
            onClick={() => setActiveTab('saved')}
            className={`flex items-center gap-1.5 py-4 border-t ${
              activeTab === 'saved'
                ? 'border-[var(--ig-text-primary)] text-[var(--ig-text-primary)] -mt-[1px]'
                : 'border-transparent text-[var(--ig-text-tertiary)] hover:text-[var(--ig-text-secondary)]'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" /> SAVED
          </button>
        )}

        <button
          onClick={() => setActiveTab('tagged')}
          className={`flex items-center gap-1.5 py-4 border-t ${
            activeTab === 'tagged'
              ? 'border-[var(--ig-text-primary)] text-[var(--ig-text-primary)] -mt-[1px]'
              : 'border-transparent text-[var(--ig-text-tertiary)] hover:text-[var(--ig-text-secondary)]'
          }`}
        >
          <Tag className="w-3.5 h-3.5" /> TAGGED
        </button>
      </div>

      {/* 4. 3-Column Posts Media Grid */}
      {displayedPosts.length > 0 ? (
        <div className="grid grid-cols-3 gap-1 md:gap-7">
          {displayedPosts.map((post) => {
            const mediaUrls = post.mediaUrls || [];
            const primaryMedia = mediaUrls[0];
            const isVideo = primaryMedia && (primaryMedia.endsWith('.mp4') || primaryMedia.endsWith('.webm'));

            return (
              <div
                key={post._id}
                onClick={() => navigate(`/p/${post._id}`)}
                className="relative aspect-square bg-[var(--ig-elevated)] overflow-hidden cursor-pointer group"
              >
                {primaryMedia ? (
                  isVideo ? (
                    <video src={primaryMedia} className="w-full h-full object-cover" />
                  ) : (
                    <img 
                      src={primaryMedia} 
                      alt="Profile moment" 
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  )
                ) : (
                  <div className="w-full h-full flex items-center justify-center p-3 text-center text-xs text-[var(--ig-text-secondary)]">
                    {post.caption || post.body}
                  </div>
                )}

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6 text-white font-bold text-sm z-10">
                  <span className="flex items-center gap-1.5">
                    <Heart className="w-5 h-5 fill-white" />
                    {post.likesCount || 0}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MessageCircle className="w-5 h-5 fill-white" />
                    {post.commentsCount || (post.comments?.length || 0)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-16 text-center">
          <div className="w-16 h-16 rounded-full border-2 border-[var(--ig-border)] flex items-center justify-center mx-auto mb-4 text-[var(--ig-text-secondary)]">
            <Camera className="w-8 h-8 stroke-[1.5]" />
          </div>
          <h3 className="text-2xl font-bold text-[var(--ig-text-primary)] mb-1">
            {activeTab === 'saved' ? 'Save photos and videos' : 'Share Photos'}
          </h3>
          <p className="text-xs text-[var(--ig-text-secondary)] max-w-sm mx-auto">
            {activeTab === 'saved' 
              ? 'Save photos and videos that you want to see again. No one is notified, and only you can see what you’ve saved.' 
              : 'When you share photos, they will appear on your profile.'}
          </p>
        </div>
      )}

      {/* Edit Profile Modal */}
      {editModalOpen && (
        <div 
          onClick={() => setEditModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 animate-fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-[var(--ig-elevated)] border border-[var(--ig-border)] rounded-2xl p-6 max-w-md w-full shadow-2xl relative"
          >
            <div className="flex items-center justify-between pb-4 border-b border-[var(--ig-border)] mb-5">
              <h3 className="text-base font-semibold text-[var(--ig-text-primary)]">
                Edit profile
              </h3>
              <button
                onClick={() => setEditModalOpen(false)}
                className="text-[var(--ig-text-tertiary)] hover:text-[var(--ig-text-primary)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-[var(--ig-text-secondary)] block mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={editForm.displayName}
                  onChange={(e) => setEditForm(prev => ({ ...prev, displayName: e.target.value }))}
                  className="w-full bg-[var(--ig-bg)] border border-[var(--ig-border)] text-sm text-[var(--ig-text-primary)] rounded-lg p-2.5 outline-none focus:border-[var(--ig-primary-button)]"
                  placeholder="Display Name"
                />
              </div>

              <div>
                <label className="font-semibold text-[var(--ig-text-secondary)] block mb-1">
                  Bio
                </label>
                <textarea
                  rows={3}
                  value={editForm.bio}
                  maxLength={150}
                  onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                  className="w-full bg-[var(--ig-bg)] border border-[var(--ig-border)] text-sm text-[var(--ig-text-primary)] rounded-lg p-2.5 outline-none focus:border-[var(--ig-primary-button)] resize-none"
                  placeholder="Bio (up to 150 characters)"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--ig-border)]">
                <button 
                  type="button" 
                  onClick={() => setEditModalOpen(false)}
                  className="ig-btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={savingEdit}
                  className="ig-btn-primary text-xs"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
