import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Settings, 
  Lock, 
  EyeOff, 
  MessageSquare, 
  Trash2, 
  Upload, 
  Sun, 
  Moon 
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useUIStore } from '../store/uiStore';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import UserAvatar from '../components/common/UserAvatar';
import Button from '../components/ui/Button';
import { Input, Textarea } from '../components/ui/Input';

export default function SettingsPage() {
  const { user, updateUser, logout } = useAuthStore();
  const { theme, setTheme } = useUIStore();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [displayName, setDisplayName] = useState(user?.displayName || user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [isPrivate, setIsPrivate] = useState(user?.privacySettings?.isPrivate || false);
  const [hideActivity, setHideActivity] = useState(user?.privacySettings?.hideActivity || false);
  const [allowDirectMessages, setAllowDirectMessages] = useState(user?.privacySettings?.allowDirectMessages !== false);
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const handleAvatarFileUpload = async (e) => {
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
      setUploadingPhoto(true);
      const formData = new FormData();
      formData.append('avatar', file);

      const res = await api.post('/users/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success('Profile photo updated! ✨');
      if (res.data?.user) {
        updateUser(res.data.user);
        setAvatar(res.data.avatar || res.data.user.avatar);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await api.put('/users/me', {
        displayName: displayName.trim(),
        bio: bio.trim(),
        avatar: avatar.trim(),
        privacySettings: {
          isPrivate,
          hideActivity,
          allowDirectMessages
        }
      });
      updateUser(res.data);
      toast.success('Settings saved! ✨');
    } catch (err) {
      toast.error('Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to permanently delete your account? This action cannot be undone.')) {
      return;
    }
    try {
      await api.delete('/users/me');
      logout();
      toast.success('Account deleted successfully');
      navigate('/');
    } catch (err) {
      toast.error('Failed to delete account');
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8 select-none">
      <div className="flex items-center gap-3 mb-6 pb-6 border-b border-hub-border">
        <Settings className="text-hub-accent w-6 h-6" />
        <div>
          <h1 className="font-display text-2xl font-bold text-hub-text-primary">Account & Privacy Settings</h1>
          <p className="text-xs text-hub-text-tertiary">Manage your profile details, privacy preferences, and appearance</p>
        </div>
      </div>

      <div className="bg-hub-surface border border-hub-border rounded-3xl p-6 sm:p-8 flex flex-col gap-6 shadow-2xl">
        {/* User Card with Photo Upload */}
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-hub-surface-elevated rounded-2xl border border-hub-border gap-4">
          <div className="flex items-center gap-3.5">
            <UserAvatar 
              src={avatar || user?.avatar} 
              name={displayName || user?.username} 
              size="lg"
            />
            <div>
              <p className="text-sm font-bold text-hub-text-primary flex items-center gap-1.5">
                {displayName || user?.username}
              </p>
              <p className="text-xs text-hub-text-tertiary">@{user?.username}</p>
            </div>
          </div>

          <div>
            <Button 
              variant="primary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingPhoto}
              icon={Upload}
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

        {/* Form */}
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <Input 
            label="Display Name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />

          <Input 
            label="Profile Photo URL"
            value={avatar}
            onChange={(e) => setAvatar(e.target.value)}
            placeholder="https://... or upload photo above"
          />

          <Textarea 
            label="Bio"
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell people a bit about yourself..."
          />

          {/* Privacy Flags */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold text-hub-text-primary uppercase tracking-wider">Privacy & Safety</h3>

            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-hub-surface-elevated border border-hub-border">
              <div className="flex items-center gap-3">
                <Lock className="w-4 h-4 text-hub-accent" />
                <div>
                  <p className="text-xs font-bold text-hub-text-primary">Private Account</p>
                  <p className="text-[11px] text-hub-text-tertiary">Require approval before people can follow you and see your posts</p>
                </div>
              </div>
              <input 
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="w-4 h-4 accent-hub-accent rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-hub-surface-elevated border border-hub-border">
              <div className="flex items-center gap-3">
                <EyeOff className="w-4 h-4 text-hub-violet" />
                <div>
                  <p className="text-xs font-bold text-hub-text-primary">Activity Status</p>
                  <p className="text-[11px] text-hub-text-tertiary">Hide when you were last active from other people</p>
                </div>
              </div>
              <input 
                type="checkbox"
                checked={hideActivity}
                onChange={(e) => setHideActivity(e.target.checked)}
                className="w-4 h-4 accent-hub-violet rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-hub-surface-elevated border border-hub-border">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-4 h-4 text-hub-cyan" />
                <div>
                  <p className="text-xs font-bold text-hub-text-primary">Direct Messages</p>
                  <p className="text-[11px] text-hub-text-tertiary">Allow people to send you direct messages</p>
                </div>
              </div>
              <input 
                type="checkbox"
                checked={allowDirectMessages}
                onChange={(e) => setAllowDirectMessages(e.target.checked)}
                className="w-4 h-4 accent-hub-cyan rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Interface Appearance */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold text-hub-text-primary uppercase tracking-wider">Appearance</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${
                  theme === 'light'
                    ? 'border-hub-accent bg-hub-surface-elevated text-hub-text-primary ring-2 ring-hub-accent/20 shadow-md font-bold'
                    : 'border-hub-border bg-hub-surface text-hub-text-secondary hover:text-hub-text-primary hover:border-hub-border-light'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500">
                  <Sun className="w-4 h-4" />
                </div>
                <span className="text-xs">Light Mode</span>
                <span className="text-[10px] text-hub-text-tertiary font-normal">Clean bright interface</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${
                  theme === 'dark'
                    ? 'border-hub-accent bg-hub-surface-elevated text-hub-text-primary ring-2 ring-hub-accent/20 shadow-md font-bold'
                    : 'border-hub-border bg-hub-surface text-hub-text-secondary hover:text-hub-text-primary hover:border-hub-border-light'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-hub-surface-muted border border-hub-border flex items-center justify-center text-hub-text-primary">
                  <Moon className="w-4 h-4" />
                </div>
                <span className="text-xs">Dark Mode</span>
                <span className="text-[10px] text-hub-text-tertiary font-normal">Sleek dark interface</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-hub-border">
            <Button 
              type="submit"
              variant="primary"
              size="md"
              isLoading={loading}
            >
              Save Changes
            </Button>
          </div>
        </form>

        {/* Danger Zone */}
        <div className="pt-5 border-t border-hub-border flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-hub-danger">Delete Account</p>
            <p className="text-[11px] text-hub-text-tertiary">Permanently remove your account, posts, and data</p>
          </div>
          <Button 
            variant="destructive"
            size="sm"
            onClick={handleDeleteAccount}
            icon={Trash2}
          >
            Delete Account
          </Button>
        </div>
      </div>
    </div>
  );
}
