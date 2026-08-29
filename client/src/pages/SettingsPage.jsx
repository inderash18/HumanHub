import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Settings, 
  Upload, 
  LogOut,
  Moon,
  Sun,
  Camera
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useUIStore } from '../store/uiStore';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import UserAvatar from '../components/common/UserAvatar';
import Button from '../components/ui/Button';

export default function SettingsPage() {
  const { user, updateUser, logout } = useAuthStore();
  const { theme, toggleTheme } = useUIStore();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [displayName, setDisplayName] = useState(user?.displayName || user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const handleAvatarFileUpload = async (e) => {
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
        await api.put('/users/profile', { avatar: newAvatarUrl });
        updateUser({ avatar: newAvatarUrl });
        toast.success('Profile photo updated! ✨');
      }
    } catch (err) {
      toast.error('Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSave = async (e) => {
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
      toast.success('Settings saved! ✨');
    } catch (err) {
      toast.error('Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {}
    logout();
    toast.success('Logged out');
    navigate('/?mode=signin');
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8 select-none space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-[var(--border)]">
        <Settings className="text-[var(--accent)] w-6 h-6" />
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-bold text-[var(--text-primary)]">Settings</h1>
          <p className="text-xs text-[var(--text-tertiary)]">Manage your profile details and preferences</p>
        </div>
      </div>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 sm:p-8 flex flex-col gap-6 shadow-xl">
        {/* User Card with Photo Upload */}
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-[var(--surface-elevated)] rounded-2xl border border-[var(--border)] gap-4">
          <div className="flex items-center gap-3.5">
            <UserAvatar 
              src={avatar || user?.avatar} 
              name={displayName || user?.username} 
              size="lg"
            />
            <div>
              <p className="text-sm font-bold text-[var(--text-primary)]">
                {displayName || user?.username}
              </p>
              <p className="text-xs text-[var(--text-tertiary)]">@{user?.username}</p>
            </div>
          </div>

          <div>
            <Button 
              variant="primary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingPhoto}
              icon={Camera}
            >
              {uploadingPhoto ? 'Uploading...' : 'Change Photo'}
            </Button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleAvatarFileUpload} 
              accept="image/*" 
              className="hidden" 
            />
          </div>
        </div>

        {/* Profile Settings Form */}
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-1.5">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-[var(--surface-elevated)] border border-[var(--border)] text-xs text-[var(--text-primary)] rounded-xl p-2.5 outline-none focus:border-[var(--accent)]"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-1.5">
              Bio
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full bg-[var(--surface-elevated)] border border-[var(--border)] text-xs text-[var(--text-primary)] rounded-xl p-2.5 outline-none focus:border-[var(--accent)] resize-none"
              placeholder="Tell the community about yourself..."
            />
          </div>

          <div className="pt-2">
            <Button 
              variant="primary"
              size="md"
              type="submit"
              isLoading={loading}
            >
              Save Profile
            </Button>
          </div>
        </form>

        {/* Appearance & Logout */}
        <div className="pt-6 border-t border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--accent)] transition-colors flex items-center gap-2"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-[var(--text-secondary)]" />}
              <span>{theme === 'dark' ? 'Light Theme' : 'Dark Theme'}</span>
            </button>
          </div>

          <Button
            variant="destructive"
            size="sm"
            onClick={handleLogout}
            icon={LogOut}
          >
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}
