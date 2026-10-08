import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  ArrowLeft,
  Image as ImageIcon, 
  Smile, 
  MapPin, 
  ChevronDown, 
  Loader2, 
  Sparkles,
  AlertTriangle,
  RotateCw,
  Flag,
  Save,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '../../store/useAuthStore';
import api from '../../services/api';
import UserAvatar from '../common/UserAvatar';
import ImageOriginBadge from '../media/ImageOriginBadge';
import ImageOriginEvidenceModal from '../media/ImageOriginEvidenceModal';
import ReviewDisputeModal from '../media/ReviewDisputeModal';
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
  const [uploadedMediaItems, setUploadedMediaItems] = useState([]); // [{ mediaId, url, analysisOutcome, publicationDecision, decisionReason, evidence, processingState }]
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState(false);
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const [disputeMediaId, setDisputeMediaId] = useState(null);

  const fileInputRef = useRef(null);
  const uploadSessionRef = useRef(0);

  useEffect(() => {
    if (isOpen) {
      uploadSessionRef.current += 1;
      setStep(1);
      setMediaFiles([]);
      setMediaPreviews(prev => {
        prev.forEach(url => URL.revokeObjectURL(url));
        return [];
      });
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
      if (data && (data.mediaId || data.mediaUrl)) {
        setUploadedMediaItems(prev => prev.map(item => 
          (item.mediaId === data.mediaId || item.url === data.mediaUrl) ? { ...item, ...data } : item
        ));
      }
    };
    socket.on('media:analysis:updated', handleAnalysisUpdate);
    return () => {
      socket.off('media:analysis:updated', handleAnalysisUpdate);
    };
  }, [socket]);

  // Active polling while any item is QUEUED or RUNNING in composer
  useEffect(() => {
    const hasPending = uploadedMediaItems.some(
      item => item.processingState === 'QUEUED' || item.processingState === 'RUNNING' || item.publicationDecision === 'PENDING'
    );
    if (!hasPending) return;

    const interval = setInterval(async () => {
      for (const item of uploadedMediaItems) {
        if (item.mediaId && (item.processingState === 'QUEUED' || item.processingState === 'RUNNING' || item.publicationDecision === 'PENDING')) {
          try {
            const res = await api.get(`/v1/media/${item.mediaId}/analysis`);
            if (res.data?.success && res.data.data) {
              const latest = res.data.data;
              setUploadedMediaItems(prev => prev.map(p => p.mediaId === latest.mediaId ? { ...p, ...latest } : p));
            }
          } catch {}
        }
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [uploadedMediaItems]);

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
      const currentSession = ++uploadSessionRef.current;
      setMediaPreviews(prev => {
        prev.forEach(url => URL.revokeObjectURL(url));
        return validPreviews;
      });
      setMediaFiles(validFiles);
      setUploadedMediaItems([]);
      setStep(2);

      // Immediately start background origin upload & analysis
      uploadAndAnalyzeFiles(validFiles, currentSession);
    }
  };

  const uploadAndAnalyzeFiles = async (files, sessionId) => {
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

        if (uploadSessionRef.current !== sessionId) return;

        if (res.data && res.data.success) {
          uploadedList.push({
            mediaId: res.data.mediaId,
            mediaVersion: res.data.mediaVersion,
            url: res.data.url,
            fileHash: res.data.fileHash,
            processingState: res.data.processingState || 'QUEUED',
            analysisOutcome: res.data.analysisOutcome || 'PENDING',
            publicationDecision: res.data.publicationDecision || 'PENDING',
            decisionReason: res.data.decisionReason || 'Checking image before publishing...',
            evidence: res.data.evidence
          });
        }
      } catch (err) {
        if (uploadSessionRef.current !== sessionId) return;
        toast.error(`Upload error for ${file.name}`);
      }
    }

    if (uploadSessionRef.current === sessionId) {
      setUploadedMediaItems(uploadedList);
      setIsUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleRetryAnalysis = async (mediaId) => {
    try {
      toast.loading('Retrying analysis...', { id: 'retry-toast' });
      await api.post(`/v1/media/${mediaId}/analysis/retry`);
      toast.success('Analysis re-enqueued', { id: 'retry-toast' });
      setUploadedMediaItems(prev => prev.map(item => 
        item.mediaId === mediaId ? { ...item, processingState: 'QUEUED', publicationDecision: 'PENDING', decisionReason: 'Checking image before publishing...' } : item
      ));
    } catch (err) {
      toast.error('Failed to retry analysis', { id: 'retry-toast' });
    }
  };

  const handleSaveDraft = () => {
    handlePublish(true);
  };

  const blockedItem = uploadedMediaItems.find(item => item.publicationDecision === 'BLOCKED');
  const heldItem = uploadedMediaItems.find(
    item => item.publicationDecision === 'HELD_FOR_REVIEW' || item.analysisOutcome === 'CHECK_UNAVAILABLE'
  );

  const canSubmit = !isPosting && !isUploading && !blockedItem && (mediaFiles.length > 0 || caption.trim().length > 0);

  const handlePublish = async (isDraft = false) => {
    if (mediaFiles.length === 0 && !caption.trim()) {
      toast.error('Add a photo or caption to post');
      return;
    }

    if (blockedItem) {
      toast.error(`Publication blocked: ${blockedItem.decisionReason || 'AI-generated media detected.'}`);
      return;
    }

    try {
      setIsPosting(true);

      const mediaUrls = uploadedMediaItems.map(item => item.url).filter(Boolean);
      const mediaIds = uploadedMediaItems.map(item => item.mediaId).filter(Boolean);
      const mediaPayload = uploadedMediaItems.map(item => ({
        url: item.url,
        publicId: item.publicId || item.public_id || '',
        provider: item.provider || (item.url.includes('cloudinary') ? 'cloudinary' : 'local'),
        resourceType: item.resourceType || 'image',
        format: item.format || '',
        bytes: item.bytes || 0,
        width: item.width || 0,
        height: item.height || 0
      }));

      const isHeldForReview = Boolean(heldItem) || uploadedMediaItems.some(
        item => item.publicationDecision === 'HELD_FOR_REVIEW' || item.analysisOutcome === 'CHECK_UNAVAILABLE'
      );

      const payload = {
        caption: caption.trim(),
        body: caption.trim(),
        communityId: communityId || undefined,
        mediaUrls,
        mediaIds,
        media: mediaPayload,
        status: isDraft ? 'draft' : (isHeldForReview ? 'pending_review' : 'published')
      };

      await api.post('/posts', payload);
      if (isDraft) {
        toast.success('Your post draft has been saved.');
      } else if (isHeldForReview) {
        toast.success('Automated AI check is currently unavailable. Your post is held for manual review.', { duration: 5000 });
      } else {
        toast.success('Your post has been published.');
      }
      if (onPostCreated) onPostCreated();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to publish post');
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
          step === 1 ? 'w-full max-w-[500px] h-[500px]' : 'w-full max-w-[880px] h-[600px]'
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
              onClick={() => handlePublish(false)}
              disabled={!canSubmit}
              className="text-sm font-semibold text-[var(--ig-primary-button)] hover:text-[var(--ig-primary-button-hover)] disabled:opacity-40 flex items-center gap-1.5 cursor-pointer"
            >
              {isPosting ? <Loader2 className="w-4 h-4 animate-spin" /> : (heldItem ? 'Submit' : 'Share')}
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
              <svg aria-label="Media icon" fill="currentColor" height="77" role="img" viewBox="0 0 97.6 77.3" width="96" className="text-[var(--ig-text-primary)]">
                <path d="M16.3 24S3 24.8 3 42.1v23.4S4 74 16.3 74h65.8s13.3-.8 13.3-18.1V32.5c0-.9-.7-1.6-1.6-1.6h-5.2c-.9 0-1.6-.7-1.6-1.6v-5.2c0-.9-.7-1.6-1.6-1.6H16.3zm-3.8 44.5V42.1c0-8.8 6.2-11.6 11.6-11.6h58.8v26.9c0 8.8-6.2 11.6-11.6 11.6H12.5z" />
                <path d="M48.8 60.5c7.4 0 13.4-6 13.4-13.4s-6-13.4-13.4-13.4-13.4 6-13.4 13.4 6 13.4 13.4 13.4zm0-20.8c4.1 0 7.4 3.3 7.4 7.4s-3.3 7.4-7.4 7.4-7.4-3.3-7.4-7.4 3.3-7.4 7.4-7.4z" />
              </svg>
            </div>
            <h4 className="text-xl font-light text-[var(--ig-text-primary)] mb-5">
              Drag photos and videos here
            </h4>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="ig-btn-primary cursor-pointer"
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
          /* Step 2: Split View */
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Left: Media Preview */}
            <div className="w-full md:w-[58%] h-64 md:h-full bg-black flex items-center justify-center relative group">
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

              {/* Real-time Origin Badge in Composer */}
              {currentUploadedItem && (
                <div className="absolute top-3 left-3 z-20">
                  <ImageOriginBadge
                    outcome={currentUploadedItem.analysisOutcome}
                    evidence={currentUploadedItem.evidence}
                    processingState={currentUploadedItem.processingState}
                    publicationDecision={currentUploadedItem.publicationDecision}
                    onClick={() => {
                      setSelectedAnalysis(currentUploadedItem);
                      setIsEvidenceModalOpen(true);
                    }}
                    size="sm"
                  />
                </div>
              )}

              {/* Thumbnail carousel selector for multi-image uploads */}
              {mediaPreviews.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-1.5 bg-black/60 p-1.5 rounded-full backdrop-blur-sm">
                  {mediaPreviews.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActivePreviewIndex(idx)}
                      className={`w-3 h-3 rounded-full transition-all ${
                        activePreviewIndex === idx ? 'bg-white scale-110' : 'bg-white/40'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Right: Caption, Verification Gate Status, and Settings */}
            <div className="w-full md:w-[42%] flex flex-col border-t md:border-t-0 md:border-l border-[var(--ig-border)] bg-[var(--ig-surface)] overflow-y-auto">
              {/* User Bar */}
              <div className="p-3.5 flex items-center gap-3">
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
              <div className="px-3.5 flex-1">
                <textarea 
                  placeholder="Write a caption..."
                  value={caption}
                  maxLength={2200}
                  onChange={(e) => setCaption(e.target.value)}
                  className="w-full h-28 bg-transparent text-sm text-[var(--ig-text-primary)] placeholder:text-[var(--ig-text-tertiary)] outline-none resize-none"
                  autoFocus
                />
                <div className="flex items-center justify-between text-[var(--ig-text-tertiary)] text-xs pb-2 border-b border-[var(--ig-border)]">
                  <Smile className="w-4 h-4 cursor-pointer hover:text-[var(--ig-text-primary)]" />
                  <span>{caption.length}/2,200</span>
                </div>
              </div>

              {/* Publication Gate Banner */}
              {currentUploadedItem && (
                <div className="p-3.5 border-b border-[var(--ig-border)]">
                  {currentUploadedItem.publicationDecision === 'BLOCKED' && (
                    <div className="bg-rose-500/10 border border-rose-500/25 rounded-xl p-3 text-xs space-y-2">
                      <div className="flex items-center gap-1.5 text-rose-400 font-semibold">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>Gemini detected this image as AI-generated. Publishing is blocked.</span>
                      </div>
                      <p className="text-[var(--text-secondary)] text-[11px] leading-relaxed">
                        {currentUploadedItem.decisionReason || 'Gemini detected this image as AI-generated. Publishing is blocked.'}
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setDisputeMediaId(currentUploadedItem.mediaId);
                            setIsDisputeModalOpen(true);
                          }}
                          className="px-2.5 py-1 bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 rounded-lg text-[11px] font-medium transition-colors"
                        >
                          Request Review
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveDraft}
                          className="px-2.5 py-1 bg-white/10 text-white/80 hover:bg-white/15 rounded-lg text-[11px] font-medium transition-colors"
                        >
                          Save Draft
                        </button>
                      </div>
                    </div>
                  )}

                  {currentUploadedItem.publicationDecision === 'HELD_FOR_REVIEW' && (
                    <div className="bg-amber-500/10 border border-amber-500/25 rounded-xl p-3 text-xs space-y-2">
                      <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>This image needs review before publishing.</span>
                      </div>
                      <p className="text-[var(--text-secondary)] text-[11px] leading-relaxed">
                        {currentUploadedItem.decisionReason || 'Verification could not establish an automated approval.'}
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleRetryAnalysis(currentUploadedItem.mediaId)}
                          className="px-2.5 py-1 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 rounded-lg text-[11px] font-medium transition-colors flex items-center gap-1"
                        >
                          <RotateCw className="w-3 h-3" />
                          Retry
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePublish(false)}
                          disabled={isPosting}
                          className="px-2.5 py-1 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 rounded-lg text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1"
                        >
                          {isPosting ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Request Review'}
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveDraft}
                          disabled={isPosting}
                          className="px-2.5 py-1 bg-white/10 text-white/80 hover:bg-white/15 rounded-lg text-[11px] font-medium transition-colors cursor-pointer"
                        >
                          Save Draft
                        </button>
                      </div>
                    </div>
                  )}

                  {currentUploadedItem.publicationDecision === 'PENDING' && (
                    <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-xs space-y-1">
                      <div className="flex items-center gap-2 text-white/80 font-medium">
                        <Loader2 className="w-4 h-4 animate-spin text-[var(--ig-primary-button)]" />
                        <span>Checking image before publishing…</span>
                      </div>
                      <p className="text-[11px] text-[var(--text-tertiary)]">
                        Analyzing Content Credentials and image origin. Share button will activate once approved.
                      </p>
                    </div>
                  )}

                  {currentUploadedItem.publicationDecision === 'ALLOWED' && (
                    <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-xl p-2.5 text-xs flex items-center justify-between text-emerald-400">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span className="font-semibold text-[11px]">Approved for publishing.</span>
                      </div>
                      {currentUploadedItem.evidence?.badgeLabel === 'Content Credentials detected AI provenance' && (
                        <span className="text-[10px] text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-full">
                          Advisory C2PA provenance
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Community Selector */}
              {communities.length > 0 && (
                <div className="p-3.5 border-b border-[var(--ig-border)]">
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
              <div className="p-3.5 text-xs text-[var(--ig-text-tertiary)] space-y-1 mt-auto">
                <p className="flex items-center gap-1.5 font-medium text-[var(--ig-text-secondary)]">
                  <Sparkles className="w-3.5 h-3.5 text-[#0095F6]" />
                  Server-Enforced Origin Policy
                </p>
                <p className="text-[11px]">Server validates media approval, C2PA credentials, and Google AI provenance before publishing.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Evidence Modal */}
      {isEvidenceModalOpen && selectedAnalysis && (
        <ImageOriginEvidenceModal
          isOpen={isEvidenceModalOpen}
          onClose={() => setIsEvidenceModalOpen(false)}
          analysisData={selectedAnalysis}
          mediaUrl={mediaPreviews[activePreviewIndex]}
          isAuthor={true}
        />
      )}

      {/* Review Dispute Modal */}
      {isDisputeModalOpen && disputeMediaId && (
        <ReviewDisputeModal
          isOpen={isDisputeModalOpen}
          onClose={() => setIsDisputeModalOpen(false)}
          mediaId={disputeMediaId}
          onSuccess={() => {
            setIsDisputeModalOpen(false);
            toast.success('Review request submitted to moderation team.');
          }}
        />
      )}
    </div>
  );
}
