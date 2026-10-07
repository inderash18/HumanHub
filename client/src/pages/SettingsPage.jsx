import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Lock, 
  Shield, 
  Sun, 
  Moon, 
  HelpCircle, 
  LogOut,
  Smartphone,
  UserX,
  Trash2,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useUIStore } from '../store/uiStore';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import UserAvatar from '../components/common/UserAvatar';

export default function SettingsPage() {
  const { user, updateUser, logout } = useAuthStore();
  const { theme, toggleTheme } = useUIStore();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [activeSection, setActiveSection] = useState('profile'); // 'profile' | 'password' | 'appearance' | 'privacy' | 'sessions' | 'blocked' | 'help'
  const [displayName, setDisplayName] = useState(user?.displayName || user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [isPrivate, setIsPrivate] = useState(Boolean(user?.privacySettings?.isPrivate));
  const [allowDMs, setAllowDMs] = useState(user?.privacySettings?.allowDirectMessages !== false);

  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Password change state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Sessions state
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  // Blocked users state
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loadingBlocked, setLoadingBlocked] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || user.username || '');
      setBio(user.bio || '');
      setAvatar(user.avatar || '');
      setIsPrivate(Boolean(user.privacySettings?.isPrivate));
      setAllowDMs(user.privacySettings?.allowDirectMessages !== false);
    }
  }, [user]);

  useEffect(() => {
    if (activeSection === 'sessions') {
      fetchSessions();
    } else if (activeSection === 'blocked') {
      fetchBlockedUsers();
    }
  }, [activeSection]);

  const fetchSessions = async () => {
    try {
      setLoadingSessions(true);
      const res = await api.get('/auth/sessions');
      setSessions(res.data?.sessions || []);
    } catch {
      setSessions([]);
    } finally {
      setLoadingSessions(false);
    }
  };

  const fetchBlockedUsers = async () => {
    try {
      setLoadingBlocked(true);
      const res = await api.get('/users/blocked');
      setBlockedUsers(Array.isArray(res.data) ? res.data : []);
    } catch {
      setBlockedUsers([]);
    } finally {
      setLoadingBlocked(false);
    }
  };

  const handleAvatarFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Only image files are allowed');
      return;
    }

    try {
      setUploadingPhoto(true);
      const formData = new FormData();
      formData.append('files', file);
      formData.append('folder', 'avatars');

      const res = await api.post('/upload?folder=avatars', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const newAvatarUrl = res.data.secure_url || res.data.url || (res.data.urls && res.data.urls[0]);
      const avatarMedia = res.data.media?.[0];
      if (newAvatarUrl) {
        setAvatar(newAvatarUrl);
        await api.put('/users/profile', { avatar: newAvatarUrl, avatarMedia });
        updateUser({ avatar: newAvatarUrl, avatarMedia });
        toast.success('Profile photo updated');
      }
    } catch {
      toast.error('Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      setUploadingPhoto(true);
      await api.put('/users/profile', { avatar: '' });
      setAvatar('');
      updateUser({ avatar: '' });
      toast.success('Profile photo removed');
    } catch {
      toast.error('Failed to remove photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await api.put('/users/profile', {
        displayName: displayName.trim(),
        bio: bio.trim(),
        avatar: avatar.trim()
      });
      if (res.data?.user) {
        updateUser(res.data.user);
      }
      toast.success('Profile saved');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    try {
      setLoading(true);
      await api.put('/auth/password', {
        oldPassword,
        newPassword
      });
      toast.success('Password updated successfully');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handlePrivacyToggle = async (key, val) => {
    try {
      const nextPrivacy = {
        isPrivate: key === 'isPrivate' ? val : isPrivate,
        allowDirectMessages: key === 'allowDMs' ? val : allowDMs
      };
      if (key === 'isPrivate') setIsPrivate(val);
      if (key === 'allowDMs') setAllowDMs(val);

      const res = await api.put('/users/profile', { privacySettings: nextPrivacy });
      if (res.data?.user) {
        updateUser(res.data.user);
      }
      toast.success('Privacy settings saved');
    } catch {
      toast.error('Failed to update privacy settings');
    }
  };

  const handleRevokeSession = async (sessionId) => {
    try {
      await api.delete(`/auth/sessions/${sessionId}`);
      toast.success('Session revoked');
      fetchSessions();
    } catch {
      toast.error('Failed to revoke session');
    }
  };

  const handleRevokeOtherSessions = async () => {
    try {
      await api.post('/auth/sessions/revoke-others');
      toast.success('Logged out of all other sessions');
      fetchSessions();
    } catch {
      toast.error('Failed to revoke sessions');
    }
  };

  const handleUnblockUser = async (targetId) => {
    try {
      await api.post(`/users/${targetId}/unblock`);
      toast.success('User unblocked');
      fetchBlockedUsers();
    } catch {
      toast.error('Failed to unblock user');
    }
  };

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {}
    logout();
    navigate('/login');
  };

  const navItems = [
    { id: 'profile', label: 'Edit profile', icon: User },
    { id: 'password', label: 'Change password', icon: Lock },
    { id: 'privacy', label: 'Privacy & Permissions', icon: Shield },
    { id: 'sessions', label: 'Active Sessions', icon: Smartphone },
    { id: 'blocked', label: 'Blocked Accounts', icon: UserX },
    { id: 'appearance', label: 'Appearance', icon: theme === 'dark' ? Moon : Sun },
    { id: 'help', label: 'Help & Safety', icon: HelpCircle },
  ];

  return (
    <div className="w-full max-w-[935px] mx-auto min-h-[600px] my-4 md:my-8 px-4 select-none">
      <div className="bg-[var(--ig-bg)] border border-[var(--ig-border)] rounded-xl overflow-hidden flex flex-col md:flex-row min-h-[560px]">
        
        {/* Left Navigation Tabs */}
        <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-[var(--ig-border)] py-4 flex flex-col justify-between">
          <div className="space-y-1">
            <h2 className="px-6 py-2 text-xl font-bold text-[var(--ig-text-primary)]">Settings</h2>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center gap-3.5 px-6 py-3 text-sm text-left transition-colors ${
                    activeSection === item.id
                      ? 'font-semibold text-[var(--ig-text-primary)] bg-[var(--ig-elevated)] border-l-2 border-[var(--ig-text-primary)]'
                      : 'text-[var(--ig-text-primary)] hover:bg-[var(--ig-hover)]'
                  }`}
                >
                  <Icon className="w-4 h-4 text-[var(--ig-text-primary)] flex-shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="px-6 pt-4 border-t border-[var(--ig-border)]">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 text-sm font-semibold text-red-500 hover:opacity-75"
            >
              <LogOut className="w-4 h-4" />
              Log out
            </button>
          </div>
        </div>

        {/* Right Settings Content */}
        <div className="flex-1 p-6 sm:p-10 overflow-y-auto">
          {activeSection === 'profile' && (
            <div className="max-w-md space-y-6">
              {/* Photo Change Banner */}
              <div className="flex items-center gap-5 p-4 bg-[var(--ig-elevated)] rounded-2xl">
                <UserAvatar src={avatar || user?.avatar} name={user?.displayName || user?.username} size="lg" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[var(--ig-text-primary)]">{user?.username}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingPhoto}
                      className="text-xs font-semibold text-[var(--ig-primary-button)] hover:text-[var(--ig-text-primary)]"
                    >
                      {uploadingPhoto ? 'Uploading...' : 'Change photo'}
                    </button>
                    {avatar && (
                      <button
                        onClick={handleRemoveAvatar}
                        disabled={uploadingPhoto}
                        className="text-xs font-semibold text-red-500 hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarFileUpload} className="hidden" />
                </div>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-5 text-sm">
                <div>
                  <label className="font-semibold text-[var(--ig-text-primary)] block mb-1.5">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-[var(--ig-bg)] border border-[var(--ig-border)] text-[var(--ig-text-primary)] text-sm rounded-lg p-2.5 outline-none focus:border-[var(--ig-text-tertiary)]"
                  />
                  <p className="text-[11px] text-[var(--ig-text-tertiary)] mt-1">
                    Your public name shown across posts and your profile.
                  </p>
                </div>

                <div>
                  <label className="font-semibold text-[var(--ig-text-primary)] block mb-1.5">
                    Username
                  </label>
                  <input
                    type="text"
                    value={user?.username || ''}
                    disabled
                    className="w-full bg-[var(--ig-elevated)] border border-[var(--ig-border)] text-[var(--ig-text-tertiary)] text-sm rounded-lg p-2.5 outline-none cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="font-semibold text-[var(--ig-text-primary)] block mb-1.5">
                    Bio
                  </label>
                  <textarea
                    rows={3}
                    value={bio}
                    maxLength={150}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full bg-[var(--ig-bg)] border border-[var(--ig-border)] text-[var(--ig-text-primary)] text-sm rounded-lg p-2.5 outline-none focus:border-[var(--ig-text-tertiary)] resize-none"
                  />
                  <p className="text-[11px] text-[var(--ig-text-tertiary)] text-right mt-1">
                    {bio.length}/150
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="ig-btn-primary !px-6"
                >
                  {loading ? 'Saving...' : 'Save Profile'}
                </button>
              </form>
            </div>
          )}

          {activeSection === 'password' && (
            <div className="max-w-md space-y-6">
              <h3 className="text-lg font-bold text-[var(--ig-text-primary)]">Change Password</h3>
              <form onSubmit={handleChangePassword} className="space-y-4 text-sm">
                <div>
                  <label className="font-semibold text-[var(--ig-text-primary)] block mb-1">Old password</label>
                  <input
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full bg-[var(--ig-bg)] border border-[var(--ig-border)] text-sm text-[var(--ig-text-primary)] rounded-lg p-2.5 outline-none focus:border-[var(--ig-text-tertiary)]"
                    required
                  />
                </div>

                <div>
                  <label className="font-semibold text-[var(--ig-text-primary)] block mb-1">New password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-[var(--ig-bg)] border border-[var(--ig-border)] text-sm text-[var(--ig-text-primary)] rounded-lg p-2.5 outline-none focus:border-[var(--ig-text-tertiary)]"
                    required
                  />
                </div>

                <div>
                  <label className="font-semibold text-[var(--ig-text-primary)] block mb-1">Confirm new password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-[var(--ig-bg)] border border-[var(--ig-border)] text-sm text-[var(--ig-text-primary)] rounded-lg p-2.5 outline-none focus:border-[var(--ig-text-tertiary)]"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !oldPassword || !newPassword || !confirmPassword}
                  className="ig-btn-primary"
                >
                  {loading ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </div>
          )}

          {activeSection === 'privacy' && (
            <div className="max-w-md space-y-6">
              <h3 className="text-lg font-bold text-[var(--ig-text-primary)]">Privacy & Permissions</h3>
              <p className="text-xs text-[var(--ig-text-secondary)]">
                Control your profile visibility and communication preferences.
              </p>

              <div className="space-y-4">
                {/* Private Account Toggle */}
                <div className="flex items-center justify-between p-4 bg-[var(--ig-elevated)] rounded-xl">
                  <div className="pr-4">
                    <p className="text-sm font-semibold text-[var(--ig-text-primary)]">Private Account</p>
                    <p className="text-xs text-[var(--ig-text-tertiary)] mt-0.5">
                      When private, only approved followers can view your posts and stories.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handlePrivacyToggle('isPrivate', !isPrivate)}
                    className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 ${isPrivate ? 'bg-[var(--ig-primary-button)]' : 'bg-[var(--ig-border)]'}`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${isPrivate ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>

                {/* Direct Messages Toggle */}
                <div className="flex items-center justify-between p-4 bg-[var(--ig-elevated)] rounded-xl">
                  <div className="pr-4">
                    <p className="text-sm font-semibold text-[var(--ig-text-primary)]">Allow Direct Messages</p>
                    <p className="text-xs text-[var(--ig-text-tertiary)] mt-0.5">
                      Allow other human members on HumanHub to message you directly.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handlePrivacyToggle('allowDMs', !allowDMs)}
                    className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 ${allowDMs ? 'bg-[var(--ig-primary-button)]' : 'bg-[var(--ig-border)]'}`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${allowDMs ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'sessions' && (
            <div className="max-w-lg space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-[var(--ig-text-primary)]">Active Login Sessions</h3>
                  <p className="text-xs text-[var(--ig-text-secondary)] mt-0.5">
                    Devices currently signed into your account.
                  </p>
                </div>
                <button 
                  onClick={fetchSessions}
                  className="p-1.5 text-[var(--ig-text-tertiary)] hover:text-[var(--ig-text-primary)]"
                  title="Refresh"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingSessions ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {sessions.length > 1 && (
                <button
                  onClick={handleRevokeOtherSessions}
                  className="ig-btn-secondary text-xs text-red-500 font-semibold"
                >
                  Log out of all other sessions
                </button>
              )}

              <div className="space-y-3">
                {loadingSessions ? (
                  <p className="text-xs text-[var(--ig-text-tertiary)] py-4 text-center">Loading sessions...</p>
                ) : sessions.length > 0 ? (
                  sessions.map((s) => (
                    <div 
                      key={s._id} 
                      className="p-3.5 bg-[var(--ig-elevated)] border border-[var(--ig-border)] rounded-xl flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <Smartphone className="w-5 h-5 text-[var(--ig-text-tertiary)]" />
                        <div>
                          <p className="font-semibold text-[var(--ig-text-primary)]">
                            {s.userAgent || 'Web Browser Session'} {s.isCurrent && <span className="ml-1 text-[10px] text-green-500 font-bold bg-green-500/10 px-1.5 py-0.5 rounded">Current</span>}
                          </p>
                          <p className="text-[11px] text-[var(--ig-text-tertiary)]">
                            IP: {s.ipAddress || 'Protected'} • Last active: {new Date(s.lastActiveAt || s.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {!s.isCurrent && (
                        <button
                          onClick={() => handleRevokeSession(s._id)}
                          className="text-red-500 hover:text-red-600 text-xs font-semibold"
                        >
                          Revoke
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-[var(--ig-text-tertiary)] py-4 text-center">No other active sessions.</p>
                )}
              </div>
            </div>
          )}

          {activeSection === 'blocked' && (
            <div className="max-w-lg space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-[var(--ig-text-primary)]">Blocked Accounts</h3>
                  <p className="text-xs text-[var(--ig-text-secondary)] mt-0.5">
                    People you have blocked cannot message you or see your content.
                  </p>
                </div>
                <button 
                  onClick={fetchBlockedUsers}
                  className="p-1.5 text-[var(--ig-text-tertiary)] hover:text-[var(--ig-text-primary)]"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingBlocked ? 'animate-spin' : ''}`} />
                </button>
              </div>

              <div className="space-y-3">
                {loadingBlocked ? (
                  <p className="text-xs text-[var(--ig-text-tertiary)] py-4 text-center">Loading blocked accounts...</p>
                ) : blockedUsers.length > 0 ? (
                  blockedUsers.map((u) => (
                    <div key={u._id} className="flex items-center justify-between p-3 bg-[var(--ig-elevated)] rounded-xl">
                      <div className="flex items-center gap-3">
                        <UserAvatar src={u.avatar} name={u.displayName || u.username} size="sm" />
                        <div>
                          <p className="text-xs font-semibold text-[var(--ig-text-primary)]">{u.username}</p>
                          <p className="text-[11px] text-[var(--ig-text-tertiary)]">{u.displayName || u.username}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleUnblockUser(u._id)}
                        className="ig-btn-secondary text-xs px-3 py-1 font-semibold"
                      >
                        Unblock
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-[var(--ig-text-tertiary)] py-8 text-center">You have not blocked any accounts.</p>
                )}
              </div>
            </div>
          )}

          {activeSection === 'appearance' && (
            <div className="max-w-md space-y-6">
              <h3 className="text-lg font-bold text-[var(--ig-text-primary)]">Switch Appearance</h3>
              <p className="text-xs text-[var(--ig-text-secondary)]">
                Choose between Dark Mode and Light Mode.
              </p>
              <div className="flex items-center justify-between p-4 bg-[var(--ig-elevated)] rounded-xl">
                <span className="text-sm font-semibold text-[var(--ig-text-primary)]">Dark theme</span>
                <button
                  onClick={toggleTheme}
                  className={`w-12 h-6 rounded-full transition-colors relative ${theme === 'dark' ? 'bg-[var(--ig-primary-button)]' : 'bg-[var(--ig-border)]'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${theme === 'dark' ? 'left-6' : 'left-1'}`} />
                </button>
              </div>
            </div>
          )}

          {activeSection === 'help' && (
            <div className="max-w-md space-y-4 text-sm text-[var(--ig-text-secondary)]">
              <h3 className="text-lg font-bold text-[var(--ig-text-primary)]">Help & Safety</h3>
              <div className="space-y-2 text-xs leading-relaxed">
                <p><strong className="text-[var(--ig-text-primary)]">Proof-of-Human Verification:</strong> HumanHub automatically verifies authentic human creation via C2PA digital credentials and ML origin detection.</p>
                <p><strong className="text-[var(--ig-text-primary)]">Community Guidelines:</strong> Authentic expression, no deceptive bot automation, respectful human discussions.</p>
                <p><strong className="text-[var(--ig-text-primary)]">Disputed Origins:</strong> If an AI badge is marked in error, submit an appeal review directly from the post evidence modal.</p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
