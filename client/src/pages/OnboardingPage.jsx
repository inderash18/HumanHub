import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Sparkles, 
  Camera, 
  Users, 
  ArrowRight, 
  Check, 
  UserPlus, 
  Compass
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import Button from '../components/ui/Button';
import UserAvatar from '../components/common/UserAvatar';

export default function OnboardingPage() {
  const { user, updateUser, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [step, setStep] = useState(1); // 1: Profile Setup, 2: Communities, 3: Suggested Users
  const [displayName, setDisplayName] = useState(user?.displayName || user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [saving, setSaving] = useState(false);

  // Real backend communities & suggestions
  const [communities, setCommunities] = useState([]);
  const [joinedCommunities, setJoinedCommunities] = useState([]);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [followedUsers, setFollowedUsers] = useState([]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/?mode=signin');
      return;
    }

    const loadMeta = async () => {
      try {
        const [commRes, usersRes] = await Promise.all([
          api.get('/communities').catch(() => ({ data: [] })),
          api.get('/users/suggestions').catch(() => ({ data: [] }))
        ]);
        setCommunities(Array.isArray(commRes.data) ? commRes.data : []);
        setSuggestedUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
      } catch (err) {}
    };
    loadMeta();
  }, [isAuthenticated]);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Only image files (JPG, PNG, WebP) are allowed');
      return;
    }

    try {
      setUploadingPhoto(true);
      const formData = new FormData();
      formData.append('files', file);

      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const newAvatarUrl = res.data.url || (res.data.urls && res.data.urls[0]);
      if (newAvatarUrl) {
        setAvatar(newAvatarUrl);
        toast.success('Avatar uploaded! ✨');
      }
    } catch (err) {
      toast.error('Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e?.preventDefault();
    try {
      setSaving(true);
      const res = await api.put('/users/profile', {
        displayName: displayName.trim() || user?.username,
        bio: bio.trim(),
        avatar: avatar.trim()
      });
      if (res.data?.user) {
        updateUser(res.data.user);
      }
      setStep(2);
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleCommunity = async (slug) => {
    try {
      await api.post(`/communities/${slug}/join`);
      setJoinedCommunities((prev) => 
        prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]
      );
    } catch (err) {
      toast.error('Failed to join community');
    }
  };

  const handleToggleFollow = async (userId) => {
    try {
      await api.post(`/users/${userId}/follow`);
      setFollowedUsers((prev) => 
        prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
      );
    } catch (err) {
      toast.error('Failed to update follow');
    }
  };

  const handleFinishOnboarding = () => {
    toast.success('Welcome to your new social space! ✨');
    navigate('/feed');
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)] flex items-center justify-center p-4 sm:p-6 select-none relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-1/4 left-1/4 w-[450px] h-[450px] bg-[var(--cyan)]/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[450px] h-[450px] bg-[var(--accent)]/10 rounded-full blur-[150px]" />
      </div>

      <div className="relative z-10 w-full max-w-lg bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[var(--accent)] text-white text-xs font-bold flex items-center justify-center">
              {step}
            </span>
            <span className="text-xs font-bold text-[var(--text-secondary)]">
              {step === 1 && 'Profile Setup'}
              {step === 2 && 'Discover Communities'}
              {step === 3 && 'Find Friends'}
            </span>
          </div>
          <span className="text-[11px] text-[var(--text-tertiary)] font-mono">Step {step} of 3</span>
        </div>

        {/* STEP 1: Profile Details */}
        {step === 1 && (
          <form onSubmit={handleSaveProfile} className="space-y-5 animate-fade-in">
            <div className="text-center space-y-1">
              <h2 className="font-display text-xl font-extrabold text-[var(--text-primary)]">
                Welcome, @{user?.username}!
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Customize how other people see you across HumanHub.
              </p>
            </div>

            {/* Avatar Upload */}
            <div className="flex flex-col items-center justify-center pt-2">
              <div className="relative group">
                <UserAvatar
                  src={avatar || user?.avatar}
                  name={displayName || user?.username}
                  size="2xl"
                  className="border-2 border-[var(--border)] shadow-lg"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="absolute bottom-0 right-0 p-2 rounded-full bg-[var(--accent)] text-white shadow-md hover:scale-105 transition-transform"
                >
                  <Camera className="w-4 h-4" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>
              <span className="text-[11px] text-[var(--text-tertiary)] mt-2">
                {uploadingPhoto ? 'Uploading photo...' : 'Tap to upload a profile photo'}
              </span>
            </div>

            {/* Display Name */}
            <div>
              <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-1.5">
                Display Name
              </label>
              <input
                type="text"
                placeholder="e.g. Alex Rivera"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-[var(--surface-elevated)] border border-[var(--border)] text-xs text-[var(--text-primary)] rounded-xl px-4 py-2.5 outline-none focus:border-[var(--accent)]"
              />
            </div>

            {/* Bio */}
            <div>
              <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-1.5">
                Bio
              </label>
              <textarea
                rows={3}
                placeholder="Tell others what you love, create, or think about..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full bg-[var(--surface-elevated)] border border-[var(--border)] text-xs text-[var(--text-primary)] rounded-xl px-4 py-2.5 outline-none focus:border-[var(--accent)] resize-none"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full mt-2 font-bold"
              isLoading={saving}
              icon={ArrowRight}
            >
              Continue to Communities
            </Button>
          </form>
        )}

        {/* STEP 2: Communities */}
        {step === 2 && (
          <div className="space-y-5 animate-fade-in">
            <div className="text-center space-y-1">
              <h2 className="font-display text-xl font-extrabold text-[var(--text-primary)]">
                Join Circles & Interests
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Pick communities that spark your curiosity to customize your feed.
              </p>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {communities.length > 0 ? (
                communities.map((c) => {
                  const isJoined = joinedCommunities.includes(c.slug);
                  return (
                    <div
                      key={c._id || c.slug}
                      className="p-3 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)] flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-[var(--text-primary)] truncate">c/{c.name}</h4>
                        <p className="text-[11px] text-[var(--text-secondary)] line-clamp-1">{c.description}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleCommunity(c.slug)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1 ${
                          isJoined
                            ? 'bg-[var(--surface-muted)] text-[var(--cyan)] border border-[var(--cyan)]/30'
                            : 'bg-[var(--accent)] text-white hover:opacity-90'
                        }`}
                      >
                        {isJoined ? <><Check className="w-3.5 h-3.5" /> Joined</> : 'Join'}
                      </button>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-[var(--text-tertiary)] text-center py-6">No communities yet. You can create one later!</p>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs font-semibold text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
              >
                Back
              </button>
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={() => setStep(3)}
                icon={ArrowRight}
              >
                Continue to People
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: Suggested Users */}
        {step === 3 && (
          <div className="space-y-5 animate-fade-in">
            <div className="text-center space-y-1">
              <h2 className="font-display text-xl font-extrabold text-[var(--text-primary)]">
                Connect with People
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Follow friends and creators to discover their moments.
              </p>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {suggestedUsers.length > 0 ? (
                suggestedUsers.map((u) => {
                  const isFollowing = followedUsers.includes(u._id);
                  return (
                    <div
                      key={u._id}
                      className="p-3 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)] flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <UserAvatar src={u.avatar} name={u.displayName || u.username} size="sm" />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[var(--text-primary)] truncate">{u.displayName || u.username}</p>
                          <p className="text-[10px] text-[var(--text-tertiary)] truncate">@{u.username}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleFollow(u._id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1 ${
                          isFollowing
                            ? 'bg-[var(--surface-muted)] text-[var(--accent)] border border-[var(--accent)]/30'
                            : 'bg-[var(--accent)] text-white hover:opacity-90'
                        }`}
                      >
                        {isFollowing ? <><Check className="w-3.5 h-3.5" /> Following</> : <><UserPlus className="w-3.5 h-3.5" /> Follow</>}
                      </button>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-[var(--text-tertiary)] text-center py-6">You're one of the earliest pioneers on HumanHub!</p>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="text-xs font-semibold text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
              >
                Back
              </button>
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleFinishOnboarding}
                icon={Sparkles}
              >
                Enter HumanHub
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
