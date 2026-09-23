import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  ArrowLeft,
  Image as ImageIcon, 
  Smile, 
  MapPin, 
  ChevronDown,
  Loader2,
  Sparkles
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '../../store/useAuthStore';
import api from '../../services/api';
import UserAvatar from '../common/UserAvatar';
import ImageOriginBadge from '../media/ImageOriginBadge';
import ImageOriginEvidenceModal from '../media/ImageOriginEvidenceModal';
import { useSocketStore } from '../../store/useSocketStore';

export default function CreatePostModal({ isOpen, onClose, onPostCreated, defaultCommunityId }) {
  const { user } = useAuthStore();
  const socket = useSocketStore(s => s.socket);

  const [step, setStep] = useState(1); // 1 = Select Media, 2 = Write Caption & Share
  const [mediaFiles, setMediaFiles] = useState([]);
  const [mediaPreviews, setMediaPreviews] = useState([]);
  const [activePreviewIndex, setActivePreviewIndex] = useState(0);
  const [caption, setCaption] = useState('');
  const [communityId, setCommunityId] = useState(defaultCommunityId || '');
  const [communities, setCommunities] = useState([]);
  const [isPosting, setIsPosting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Origin verification states per uploaded file
  const [uploadedMediaItems, setUploadedMediaItems] = useState([]); // [{ mediaId, url, analysisOutcome, evidence, processingState }]
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setMediaFiles([]);
      setMediaPreviews([]);
      setUploadedMediaItems([]);
      setCaption('');
      api.get('/communities').then(res => {
        setCommunities(Array.isArray(res.data) ? res.data : []);
      }).catch(() => {});
    }
  }, [isOpen]);

  // Real-time listener for origin analysis completed while composer is open
  useEffect(() => {
    if (!socket) return;
    const handleAnalysisUpdate = (data) => {
      if (data && data.mediaId) {
        setUploadedMediaItems(prev => prev.map(item => 
          item.mediaId === data.mediaId ? { ...item, ...data } : item
        ));
      }
    };
    socket.on('media:analysis:updated', handleAnalysisUpdate);
    return () => {
      socket.off('media:analysis:updated', handleAnalysisUpdate);
    };
  }, [socket]);

  if (!isOpen) return null;

  const handleFiles = async (files) => {
    const validFiles = [];
    const validPreviews = [];

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        toast.error(`${file.name} is not an image or video`);
        return;
      }
      if (file.size > 25 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 25MB limit`);
        return;
      }
      validFiles.push(file);
      validPreviews.push(URL.createObjectURL(file));
    });

    if (validFiles.length > 0) {
      setMediaFiles(validFiles);
      setMediaPreviews(validPreviews);
      setStep(2);

      // Immediately start background origin upload & analysis
      uploadAndAnalyzeFiles(validFiles);
    }
  };

  const uploadAndAnalyzeFiles = async (files) => {
    setIsUploading(true);
    const uploadedList = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const formData = new FormData();
        formData.append('file', file);
        
        // Upload to origin analysis endpoint
        const res = await api.post('/v1/media/uploads', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        if (res.data && res.data.success) {
          uploadedList.push({
            mediaId: res.data.mediaId,
            mediaVersion: res.data.mediaVersion,
            url: res.data.url,
            fileHash: res.data.fileHash,
            processingState: res.data.processingState || 'QUEUED',
            analysisOutcome: res.data.analysisOutcome || 'PENDING',
            evidence: res.data.evidence
          });
        }
      } catch (err) {
        // Fallback to regular upload if analysis fails to queue
        try {
          const formData = new FormData();
          formData.append('files', file);
          const fallbackRes = await api.post('/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          const url = fallbackRes.data.url || fallbackRes.data.urls?.[0];
          if (url) {
            uploadedList.push({
              url,
              processingState: 'COMPLETED',
              analysisOutcome: 'INCONCLUSIVE'
            });
          }
        } catch {}
      }
    }

    setUploadedMediaItems(uploadedList);
    setIsUploading(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handlePublish = async () => {
    if (mediaFiles.length === 0 && !caption.trim()) {
      toast.error('Add a photo or caption to post');
      return;
    }

    try {
      setIsPosting(true);

      const mediaUrls = uploadedMediaItems.map(item => item.url).filter(Boolean);
      const mediaIds = uploadedMediaItems.map(item => item.mediaId).filter(Boolean);

      const payload = {
        caption: caption.trim(),
        body: caption.trim(),
        communityId: communityId || undefined,
        mediaUrls,
        mediaIds
      };

      await api.post('/posts', payload);
      toast.success('Your post has been shared.');
      if (onPostCreated) onPostCreated();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to share post');
    } finally {
      setIsPosting(false);
    }
  };

  const currentUploadedItem = uploadedMediaItems[activePreviewIndex];

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 select-none animate-fade-in"
    >
      {/* Close button in top right */}
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:opacity-75 p-2 z-50"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Modal Container */}
      <div 
        onClick={(e) => e.stopPropagation()}
        className={`relative bg-[var(--ig-elevated)] border border-[var(--ig-border)] rounded-2xl overflow-hidden flex flex-col shadow-2xl transition-all duration-300 ${
          step === 1 ? 'w-full max-w-[500px] h-[500px]' : 'w-full max-w-[850px] h-[580px]'
        }`}
      >
        {/* Header */}
        <div className="h-11 border-b border-[var(--ig-border)] flex items-center justify-between px-4">
          {step === 2 ? (
            <button 
              onClick={() => setStep(1)}
              className="text-[var(--ig-text-primary)] hover:opacity-70"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : (
            <div className="w-5" />
          )}

          <h3 className="text-sm font-semibold text-[var(--ig-text-primary)]">
            Create new post
          </h3>

          {step === 2 ? (
            <button 
              onClick={handlePublish}
              disabled={isPosting || isUploading}
              className="text-sm font-semibold text-[var(--ig-primary-button)] hover:text-[var(--ig-primary-button-hover)] disabled:opacity-50 flex items-center gap-1.5"
            >
              {isPosting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Share'}
            </button>
          ) : (
            <div className="w-5" />
          )}
        </div>

        {/* Modal Body */}
        {step === 1 ? (
          /* Step 1: Drag and drop media */
          <div 
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="flex-1 flex flex-col items-center justify-center p-8 text-center"
          >
            <div className="mb-4">
              <svg aria-label="Icon to represent media such as images or videos" fill="currentColor" height="77" role="img" viewBox="0 0 97.6 77.3" width="96" className="text-[var(--ig-text-primary)]">
                <path d="M16.3 24S3 24.8 3 42.1v23.4S4 74 16.3 74h65.8s13.3-.8 13.3-18.1V32.5c0-.9-.7-1.6-1.6-1.6h-5.2c-.9 0-1.6-.7-1.6-1.6v-5.2c0-.9-.7-1.6-1.6-1.6H16.3zm-3.8 44.5V42.1c0-8.8 6.2-11.6 11.6-11.6h58.8v26.9c0 8.8-6.2 11.6-11.6 11.6H12.5z" />
                <path d="M48.8 60.5c7.4 0 13.4-6 13.4-13.4s-6-13.4-13.4-13.4-13.4 6-13.4 13.4 6 13.4 13.4 13.4zm0-20.8c4.1 0 7.4 3.3 7.4 7.4s-3.3 7.4-7.4 7.4-7.4-3.3-7.4-7.4 3.3-7.4 7.4-7.4z" />
              </svg>
            </div>
            <h4 className="text-xl font-light text-[var(--ig-text-primary)] mb-5">
              Drag photos and videos here
            </h4>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="ig-btn-primary"
            >
              Select from computer
            </button>
            <input 
              ref={fileInputRef}
              type="file" 
              multiple
              accept="image/*,video/*" 
              onChange={(e) => handleFiles(e.target.files)} 
              className="hidden" 
            />
          </div>
        ) : (
          /* Step 2: Split View (Media on Left, Details on Right) */
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Left: Media Preview */}
            <div className="w-full md:w-[60%] h-64 md:h-full bg-black flex items-center justify-center relative group">
              {mediaPreviews.length > 0 ? (
                mediaFiles[activePreviewIndex]?.type?.startsWith('video/') ? (
                  <video 
                    src={mediaPreviews[activePreviewIndex]} 
                    controls 
                    className="w-full h-full object-contain" 
                  />
                ) : (
                  <img 
                    src={mediaPreviews[activePreviewIndex]} 
                    alt="Upload preview" 
                    className="w-full h-full object-contain" 
                  />
                )
              ) : (
                <p className="text-xs text-[var(--ig-text-tertiary)]">Text post preview</p>
              )}

              {/* Real-time Image Origin Status in Composer */}
              {currentUploadedItem && (
                <div className="absolute top-3 left-3 z-20">
                  <ImageOriginBadge
                    outcome={currentUploadedItem.analysisOutcome}
                    evidence={currentUploadedItem.evidence}
                    processingState={currentUploadedItem.processingState}
                    onClick={() => {
                      setSelectedAnalysis(currentUploadedItem);
                      setIsEvidenceModalOpen(true);
                    }}
                    size="sm"
                  />
                </div>
              )}
            </div>

            {/* Right: Caption and Settings */}
            <div className="w-full md:w-[40%] flex flex-col border-t md:border-t-0 md:border-l border-[var(--ig-border)] bg-[var(--ig-surface)] overflow-y-auto">
              {/* User Bar */}
              <div className="p-4 flex items-center gap-3">
                <UserAvatar 
                  src={user?.avatar} 
                  name={user?.displayName || user?.username} 
                  size="sm"
                />
                <span className="text-sm font-semibold text-[var(--ig-text-primary)]">
                  {user?.username || 'user'}
                </span>
              </div>

              {/* Caption Textarea */}
              <div className="px-4 flex-1">
                <textarea 
                  placeholder="Write a caption..."
                  value={caption}
                  maxLength={2200}
                  onChange={(e) => setCaption(e.target.value)}
                  className="w-full h-32 bg-transparent text-sm text-[var(--ig-text-primary)] placeholder:text-[var(--ig-text-tertiary)] outline-none resize-none"
                  autoFocus
                />
                <div className="flex items-center justify-between text-[var(--ig-text-tertiary)] text-xs pb-3 border-b border-[var(--ig-border)]">
                  <Smile className="w-5 h-5 cursor-pointer hover:text-[var(--ig-text-primary)]" />
                  <span>{caption.length}/2,200</span>
                </div>
              </div>

              {/* Community Selector (Optional) */}
              {communities.length > 0 && (
                <div className="p-4 border-b border-[var(--ig-border)]">
                  <label className="block text-xs font-semibold text-[var(--ig-text-secondary)] mb-1.5">
                    Post to Community
                  </label>
                  <select
                    value={communityId}
                    onChange={(e) => setCommunityId(e.target.value)}
                    className="w-full bg-[var(--ig-elevated)] border border-[var(--ig-border)] text-xs text-[var(--ig-text-primary)] rounded-lg p-2 outline-none"
                  >
                    <option value="">Public Social Feed</option>
                    {communities.map(c => (
                      <option key={c._id} value={c._id}>c/{c.slug}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Origin Verification Notice */}
              <div className="p-4 text-xs text-[var(--ig-text-tertiary)] space-y-1">
                <p className="flex items-center gap-1.5 font-medium text-[var(--ig-text-secondary)]">
                  <Sparkles className="w-3.5 h-3.5 text-[#0095F6]" />
                  Automatic Origin Verification
                </p>
                <p>C2PA Content Credentials and UniversalFakeDetect analysis run automatically on uploaded original bytes.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Evidence Modal from composer */}
      {isEvidenceModalOpen && selectedAnalysis && (
        <ImageOriginEvidenceModal
          isOpen={isEvidenceModalOpen}
          onClose={() => setIsEvidenceModalOpen(false)}
          analysisData={selectedAnalysis}
          mediaUrl={mediaPreviews[activePreviewIndex]}
          isAuthor={true}
        />
      )}
    </div>
  );
}
