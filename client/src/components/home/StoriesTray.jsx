import React, { useState, useEffect, useRef } from 'react';
import { Plus, Image as ImageIcon, X, Sparkles } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import api, { getRetryAfterSeconds } from '../../services/api';
import StoryViewerModal from './StoryViewerModal';
import UserAvatar from '../common/UserAvatar';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { toast } from 'react-hot-toast';

export default function StoriesTray() {
  const { user } = useAuthStore();
  const [stories, setStories] = useState([]);
  const [activeStoryIndex, setActiveStoryIndex] = useState(null);
  const [loading, setLoading] = useState(false);

  // Story Creation State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      setLoading(true);
      const res = await api.get('/stories');
      setStories(Array.isArray(res.data) ? res.data : []);
    } catch {
      setStories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      toast.error('Please select an image or video file');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      toast.error('File size must be under 20MB');
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleCreateStory = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error('Please select a photo or video for your story');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('media', selectedFile);

      // Upload media file
      const uploadRes = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const mediaUrl = uploadRes.data?.url || uploadRes.data?.fileUrl || uploadRes.data?.path;
      if (!mediaUrl) throw new Error('Upload failed: no media URL returned');

      // Create story
      await api.post('/stories', {
        mediaUrl,
        caption: caption.trim()
      });

      toast.success('Story posted successfully!');
      setCreateModalOpen(false);
      setSelectedFile(null);
      setPreviewUrl('');
      setCaption('');
      fetchStories();
    } catch (err) {
      if (err.response?.status === 429) {
        const retrySecs = getRetryAfterSeconds(err, 15);
        toast.error(`Too many submissions. Please wait ${retrySecs}s.`);
      } else {
        toast.error(err.response?.data?.message || 'Failed to post story');
      }
    } finally {
      setUploading(false);
    }
  };

  if (!stories.length && !user) return null;

  return (
    <>
      <div className="w-full bg-[var(--ig-bg)] py-3 sm:py-4 border-b border-[var(--ig-border)] md:border md:rounded-xl md:mb-6 flex items-center gap-4 overflow-x-auto no-scrollbar select-none px-4">
        {/* Current User Story */}
        {user && (
          <div 
            onClick={() => setCreateModalOpen(true)}
            className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer group"
          >
            <div className="relative">
              <UserAvatar 
                src={user?.avatar} 
                name={user?.displayName || user?.username} 
                size="lg"
              />
              <div className="absolute bottom-0 right-0 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[var(--ig-primary-button)] text-white flex items-center justify-center border-2 border-[var(--ig-bg)] group-hover:scale-110 transition-transform">
                <Plus className="w-3 h-3 stroke-[3]" />
              </div>
            </div>
            <span className="text-[11px] text-[var(--ig-text-secondary)] max-w-[66px] truncate text-center">
              Your story
            </span>
          </div>
        )}

        {/* Other Users' Stories */}
        {stories.map((storyGroup, idx) => (
          <div 
            key={storyGroup._id || idx}
            onClick={() => setActiveStoryIndex(idx)}
            className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer group"
          >
            <UserAvatar 
              src={storyGroup.author?.avatar}
              name={storyGroup.author?.displayName || storyGroup.author?.username}
              size="lg"
              hasStory={true}
              isStoryViewed={Boolean(storyGroup.viewed)}
            />
            <span className="text-[11px] text-[var(--ig-text-primary)] max-w-[66px] truncate text-center">
              {storyGroup.author?.username || 'user'}
            </span>
          </div>
        ))}
      </div>

      {/* Fullscreen Story Viewer Modal */}
      {activeStoryIndex !== null && stories[activeStoryIndex] && (
        <StoryViewerModal 
          stories={stories}
          initialIndex={activeStoryIndex}
          onClose={() => setActiveStoryIndex(null)}
        />
      )}

      {/* Create Story Modal */}
      {createModalOpen && (
        <Modal
          isOpen={createModalOpen}
          onClose={() => {
            if (!uploading) {
              setCreateModalOpen(false);
              setSelectedFile(null);
              setPreviewUrl('');
            }
          }}
          title="Create Story"
          maxWidth="max-w-sm"
        >
          <form onSubmit={handleCreateStory} className="space-y-4">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*,video/*" 
              className="hidden" 
            />

            {previewUrl ? (
              <div className="relative aspect-[9/16] max-h-[360px] mx-auto rounded-xl overflow-hidden bg-black flex items-center justify-center">
                {selectedFile?.type.startsWith('video/') ? (
                  <video src={previewUrl} className="w-full h-full object-cover" autoPlay loop muted />
                ) : (
                  <img src={previewUrl} alt="Story preview" className="w-full h-full object-cover" />
                )}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl('');
                  }}
                  className="absolute top-3 right-3 p-1.5 rounded-full bg-black/70 text-white hover:bg-black transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="aspect-[9/16] max-h-[300px] border-2 border-dashed border-[var(--border)] hover:border-[var(--ig-primary-button)] rounded-xl flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-colors group"
              >
                <div className="w-12 h-12 rounded-full bg-[var(--surface-elevated)] flex items-center justify-center text-[var(--text-secondary)] group-hover:text-[var(--ig-primary-button)] mb-3">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <p className="text-xs font-semibold text-[var(--text-primary)]">
                  Select photo or video
                </p>
                <p className="text-[11px] text-[var(--text-secondary)] mt-1">
                  Stories disappear after 24 hours
                </p>
              </div>
            )}

            <input
              type="text"
              placeholder="Add a caption... (optional)"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              maxLength={150}
              className="w-full bg-[var(--surface-elevated)] border border-[var(--border)] text-xs text-[var(--text-primary)] rounded-lg px-3 py-2 outline-none focus:border-[var(--ig-primary-button)]"
            />

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={() => setCreateModalOpen(false)}
                disabled={uploading}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="submit"
                isLoading={uploading}
                disabled={!selectedFile || uploading}
              >
                Share Story
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
