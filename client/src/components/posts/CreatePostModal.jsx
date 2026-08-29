import React, { useState, useEffect } from 'react';
import { 
  X, 
  Image as ImageIcon, 
  Send,
  Users
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '../../store/useAuthStore';
import api from '../../services/api';
import UserAvatar from '../common/UserAvatar';
import Button from '../ui/Button';
import { Input, Textarea } from '../ui/Input';

export default function CreatePostModal({ isOpen, onClose, onPostCreated, defaultCommunityId }) {
  const { user } = useAuthStore();
  const [mediaPreview, setMediaPreview] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [communityId, setCommunityId] = useState(defaultCommunityId || '');
  const [communities, setCommunities] = useState([]);
  const [isPosting, setIsPosting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      api.get('/communities').then(res => {
        setCommunities(res.data || []);
      }).catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Only image files (JPG, PNG, WebP) are allowed');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be under 5MB');
      return;
    }

    setMediaFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setMediaPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handlePublish = async (e) => {
    if (e) e.preventDefault();
    if (!caption.trim() && !mediaFile && !mediaPreview) {
      toast.error('Please write something or attach a photo to share');
      return;
    }

    try {
      setIsPosting(true);
      let mediaUrl = null;

      if (mediaFile) {
        const formData = new FormData();
        formData.append('media', mediaFile);
        const uploadRes = await api.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        mediaUrl = uploadRes.data.url;
      }

      const postPayload = {
        title: title.trim() || undefined,
        body: caption.trim() || '',
        communityId: communityId || undefined,
        type: mediaUrl ? 'media' : 'text',
        mediaUrls: mediaUrl ? [mediaUrl] : []
      };

      await api.post('/posts', postPayload);
      toast.success('Post shared successfully! ✨');
      if (onPostCreated) onPostCreated();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to share post.');
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-fade-in">
      <div className="relative w-full max-w-lg bg-hub-surface border border-hub-border rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-hub-border flex items-center justify-between bg-hub-surface-elevated/40">
          <h3 className="font-display font-bold text-base text-hub-text-primary">
            Create Post
          </h3>

          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl text-hub-text-tertiary hover:text-hub-text-primary hover:bg-hub-surface-elevated transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handlePublish} className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {/* Author Preview & Community Selector */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <UserAvatar 
                src={user?.avatar} 
                name={user?.displayName || user?.username} 
                size="sm"
              />
              <div>
                <p className="text-xs font-bold text-hub-text-primary">{user?.displayName || user?.username}</p>
                <p className="text-[10px] text-hub-text-tertiary">Posting to Feed</p>
              </div>
            </div>

            {communities.length > 0 && (
              <select
                value={communityId}
                onChange={(e) => setCommunityId(e.target.value)}
                className="bg-hub-surface-elevated border border-hub-border text-hub-text-primary text-xs rounded-xl px-3 py-1.5 outline-none focus:border-hub-accent"
              >
                <option value="">General Feed</option>
                {communities.map(c => (
                  <option key={c._id} value={c._id}>c/{c.slug}</option>
                ))}
              </select>
            )}
          </div>

          {/* Title Input */}
          <Input 
            placeholder="Title (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          {/* Caption Textarea */}
          <Textarea 
            placeholder="What's on your mind? Share a story, thought, or photo..."
            rows={4}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            autoFocus
          />

          {/* Media Preview or Dropzone */}
          {mediaPreview ? (
            <div className="relative rounded-2xl overflow-hidden border border-hub-border max-h-64 bg-black flex items-center justify-center">
              <img src={mediaPreview} alt="Upload preview" className="max-h-64 w-full object-contain" />
              <button 
                type="button"
                onClick={() => { setMediaPreview(''); setMediaFile(null); }}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-black/70 text-white hover:bg-black transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-hub-border hover:border-hub-accent/40 bg-hub-surface-elevated/40 cursor-pointer transition-colors group">
              <ImageIcon className="w-8 h-8 text-hub-text-tertiary group-hover:text-hub-text-primary mb-2 transition-colors" />
              <span className="text-xs font-semibold text-hub-text-primary">Add an image</span>
              <span className="text-[10px] text-hub-text-tertiary mt-0.5">JPG, PNG or WebP up to 5MB</span>
              <input type="file" onChange={handleFileSelect} accept="image/*" className="hidden" />
            </label>
          )}

          {/* Modal Footer */}
          <div className="pt-3 border-t border-hub-border flex items-center justify-end gap-2.5">
            <Button 
              variant="ghost"
              size="md"
              onClick={onClose}
              type="button"
            >
              Cancel
            </Button>

            <Button 
              variant="primary"
              size="md"
              type="submit"
              disabled={isPosting || (!caption.trim() && !mediaFile && !mediaPreview)}
              isLoading={isPosting}
              icon={Send}
            >
              Post
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
