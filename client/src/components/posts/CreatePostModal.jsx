import React, { useState, useEffect } from 'react';
import { 
  X, 
  Image as ImageIcon, 
  Video,
  Send,
  Sparkles
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '../../store/useAuthStore';
import api from '../../services/api';
import UserAvatar from '../common/UserAvatar';
import Button from '../ui/Button';

export default function CreatePostModal({ isOpen, onClose, onPostCreated, defaultCommunityId }) {
  const { user } = useAuthStore();
  const [mediaPreview, setMediaPreview] = useState('');
  const [mediaType, setMediaType] = useState('image');
  const [mediaFile, setMediaFile] = useState(null);
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

    const isImg = file.type.startsWith('image/');
    const isVid = file.type.startsWith('video/');

    if (!isImg && !isVid) {
      toast.error('Only image and video files are supported');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      toast.error('File size must be under 25MB');
      return;
    }

    setMediaFile(file);
    setMediaType(isVid ? 'video' : 'image');

    const reader = new FileReader();
    reader.onloadend = () => {
      setMediaPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handlePublish = async (e) => {
    if (e) e.preventDefault();
    if (!caption.trim() && !mediaFile) {
      toast.error('Please write something or attach a photo/video to share');
      return;
    }

    try {
      setIsPosting(true);
      let mediaUrl = null;

      if (mediaFile) {
        const formData = new FormData();
        formData.append('files', mediaFile);
        const uploadRes = await api.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        mediaUrl = uploadRes.data.url || (uploadRes.data.urls && uploadRes.data.urls[0]);
      }

      const postPayload = {
        caption: caption.trim(),
        body: caption.trim(),
        communityId: communityId || undefined,
        mediaUrls: mediaUrl ? [mediaUrl] : []
      };

      await api.post('/posts', postPayload);
      toast.success('Moment shared successfully! ✨');
      if (onPostCreated) onPostCreated();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to share moment.');
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-fade-in">
      <div className="relative w-full max-w-lg bg-[var(--surface)] border border-[var(--border)] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[var(--border)] flex items-center justify-between bg-[var(--surface-elevated)]/40">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[var(--accent)]" />
            <h3 className="font-display font-bold text-base text-[var(--text-primary)]">
              Share a Moment
            </h3>
          </div>

          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handlePublish} className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {/* Author & Community Selector */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <UserAvatar 
                src={user?.avatar} 
                name={user?.displayName || user?.username} 
                size="sm"
              />
              <div>
                <p className="text-xs font-bold text-[var(--text-primary)]">{user?.displayName || user?.username}</p>
                <p className="text-[10px] text-[var(--text-tertiary)]">@{user?.username}</p>
              </div>
            </div>

            {communities.length > 0 && (
              <select
                value={communityId}
                onChange={(e) => setCommunityId(e.target.value)}
                className="bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--text-primary)] text-xs rounded-xl px-3 py-1.5 outline-none focus:border-[var(--accent)]"
              >
                <option value="">Public Social Feed</option>
                {communities.map(c => (
                  <option key={c._id} value={c._id}>c/{c.slug}</option>
                ))}
              </select>
            )}
          </div>

          {/* Caption Textarea */}
          <textarea 
            placeholder="What's happening? Share a thought, story, or moment..."
            rows={4}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="w-full bg-[var(--surface-elevated)] border border-[var(--border)] text-xs sm:text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] rounded-2xl p-4 outline-none focus:border-[var(--accent)] resize-none"
            autoFocus
          />

          {/* Media Preview or Dropzone */}
          {mediaPreview ? (
            <div className="relative rounded-2xl overflow-hidden border border-[var(--border)] max-h-64 bg-black flex items-center justify-center">
              {mediaType === 'video' ? (
                <video src={mediaPreview} controls className="max-h-64 w-full object-contain" />
              ) : (
                <img src={mediaPreview} alt="Upload preview" className="max-h-64 w-full object-contain" />
              )}
              <button 
                type="button"
                onClick={() => { setMediaPreview(''); setMediaFile(null); }}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-black/70 text-white hover:bg-black transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-[var(--border)] hover:border-[var(--accent)]/40 bg-[var(--surface-elevated)]/40 cursor-pointer transition-colors group">
              <div className="flex items-center gap-2 text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)] mb-2">
                <ImageIcon className="w-6 h-6" />
                <Video className="w-6 h-6" />
              </div>
              <span className="text-xs font-semibold text-[var(--text-primary)]">Add a photo or video</span>
              <span className="text-[10px] text-[var(--text-tertiary)] mt-0.5">JPG, PNG, WebP, MP4 up to 25MB</span>
              <input type="file" onChange={handleFileSelect} accept="image/*,video/*" className="hidden" />
            </label>
          )}

          {/* Modal Footer */}
          <div className="pt-3 border-t border-[var(--border)] flex items-center justify-end gap-2.5">
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
              disabled={isPosting || (!caption.trim() && !mediaFile)}
              isLoading={isPosting}
              icon={Send}
            >
              Share Moment
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
