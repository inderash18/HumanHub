import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Lock, 
  Bell, 
  Shield, 
  Sun, 
  Moon, 
  HelpCircle, 
  LogOut 
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

  const [activeSection, setActiveSection] = useState('profile'); // 'profile' | 'password' | 'appearance' | 'privacy'
  const [displayName, setDisplayName] = useState(user?.displayName || user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Password change state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

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

      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const newAvatarUrl = res.data.url || (res.data.urls && res.data.urls[0]);
      if (newAvatarUrl) {
        setAvatar(newAvatarUrl);
        await api.put('/users/profile', { avatar: newAvatarUrl });
        updateUser({ avatar: newAvatarUrl });
        toast.success('Profile photo updated');
      }
    } catch (err) {
      toast.error('Failed to upload photo');
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
    } catch (err) {
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

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {}
    logout();
    navigate('/login');
  };

  const navItems = [
    { id: 'profile', label: 'Edit profile', icon: User },
    { id: 'password', label: 'Change password', icon: Lock },
    { id: 'appearance', label: 'Appearance', icon: theme === 'dark' ? Moon : Sun },
    { id: 'privacy', label: 'Privacy and security', icon: Shield },
    { id: 'help', label: 'Help', icon: HelpCircle },
  ];

  return (
    <div className="w-full max-w-[935px] mx-auto min-h-[600px] my-4 md:my-8 px-4 select-none">
      <div className="bg-[var(--ig-bg)] border border-[var(--ig-border)] rounded-sm overflow-hidden flex flex-col md:flex-row min-h-[560px]">
        
        {/* Left Navigation Tabs */}
        <div className="w-full md:w-60 border-b md:border-b-0 md:border-r border-[var(--ig-border)] py-4 flex flex-col justify-between">
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
                  <Icon className="w-4 h-4 text-[var(--ig-text-primary)]" />
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
        <div className="flex-1 p-6 sm:p-12 overflow-y-auto">
          {activeSection === 'profile' && (
            <div className="max-w-md space-y-6">
              {/* Photo Change Banner */}
              <div className="flex items-center gap-5 p-4 bg-[var(--ig-elevated)] rounded-2xl">
                <UserAvatar src={avatar || user?.avatar} name={user?.displayName || user?.username} size="lg" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[var(--ig-text-primary)]">{user?.username}</p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPhoto}
                    className="text-xs font-semibold text-[var(--ig-primary-button)] hover:text-[var(--ig-text-primary)] mt-0.5"
                  >
                    {uploadingPhoto ? 'Uploading...' : 'Change profile photo'}
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarFileUpload} className="hidden" />
                </div>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-5 text-sm">
                <div>
                  <label className="font-semibold text-[var(--ig-text-primary)] block mb-1.5">
                    Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-[var(--ig-bg)] border border-[var(--ig-border)] text-[var(--ig-text-primary)] text-sm rounded-lg p-2.5 outline-none focus:border-[var(--ig-text-tertiary)]"
                  />
                  <p className="text-[11px] text-[var(--ig-text-tertiary)] mt-1">
                    Help people discover your account by using the name you're known by.
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
                  {loading ? 'Saving...' : 'Submit'}
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
                    className="w-full bg-[var(--ig-bg)] border border-[var(--ig-border)] text-sm text-[var(--ig-text-primary)] rounded-lg p-2.5 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="font-semibold text-[var(--ig-text-primary)] block mb-1">New password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-[var(--ig-bg)] border border-[var(--ig-border)] text-sm text-[var(--ig-text-primary)] rounded-lg p-2.5 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="font-semibold text-[var(--ig-text-primary)] block mb-1">Confirm new password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-[var(--ig-bg)] border border-[var(--ig-border)] text-sm text-[var(--ig-text-primary)] rounded-lg p-2.5 outline-none"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !oldPassword || !newPassword || !confirmPassword}
                  className="ig-btn-primary"
                >
                  Change Password
                </button>
              </form>
            </div>
          )}

          {activeSection === 'appearance' && (
            <div className="max-w-md space-y-6">
              <h3 className="text-lg font-bold text-[var(--ig-text-primary)]">Switch Appearance</h3>
              <p className="text-xs text-[var(--ig-text-secondary)]">
                Choose between Instagram Dark Mode and Light Mode.
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

          {activeSection === 'privacy' && (
            <div className="max-w-md space-y-6">
              <h3 className="text-lg font-bold text-[var(--ig-text-primary)]">Account Privacy</h3>
              <p className="text-xs text-[var(--ig-text-secondary)]">
                Manage your profile visibility and active sessions.
              </p>
              <div className="flex items-center justify-between p-4 bg-[var(--ig-elevated)] rounded-xl">
                <div>
                  <p className="text-sm font-semibold text-[var(--ig-text-primary)]">Private Account</p>
                  <p className="text-xs text-[var(--ig-text-tertiary)]">When your account is public, your profile and posts can be seen by anyone.</p>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'help' && (
            <div className="max-w-md space-y-4 text-sm text-[var(--ig-text-secondary)]">
              <h3 className="text-lg font-bold text-[var(--ig-text-primary)]">Help Center</h3>
              <p>HumanHub is an authentic social platform powered by Proof-of-Human verification.</p>
              <p>For technical support or inquiries, visit our community guidelines or reach out to support.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
