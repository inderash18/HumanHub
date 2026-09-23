import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
  Smile,
  Trash2,
  Share2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '../../store/useAuthStore';
import api, { getRetryAfterSeconds } from '../../services/api';
import UserAvatar from '../common/UserAvatar';
import ImageOriginBadge from '../media/ImageOriginBadge';
import ImageOriginEvidenceModal from '../media/ImageOriginEvidenceModal';
import { useSocketStore } from '../../store/useSocketStore';

export default function PostCard({ post, onUpdate }) {
  const { user, isAuthenticated } = useAuthStore();
  const socket = useSocketStore(s => s.socket);
  const navigate = useNavigate();

  const [isLiked, setIsLiked] = useState(Boolean(post.isLiked ?? post.hasLiked));
  const [likesCount, setLikesCount] = useState(post.likesCount || 0);
  const [isLiking, setIsLiking] = useState(false);
  const [likeCooldownUntil, setLikeCooldownUntil] = useState(0);

  const [isSaved, setIsSaved] = useState(Boolean(post.isSaved));
  const [isSaving, setIsSaving] = useState(false);
  const [saveCooldownUntil, setSaveCooldownUntil] = useState(0);

  const [showHeartAnim, setShowHeartAnim] = useState(false);
  
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [comments, setComments] = useState(post.comments || []);
  const [commentsCount, setCommentsCount] = useState(post.commentsCount || (post.comments?.length || 0));
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [loadedComments, setLoadedComments] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);

  const [isExpandedCaption, setIsExpandedCaption] = useState(false);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);

  // Media Origin Analysis State
  const [mediaAnalysisMap, setMediaAnalysisMap] = useState({});
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState(false);

  useEffect(() => {
    setIsLiked(Boolean(post.isLiked ?? post.hasLiked));
    setLikesCount(post.likesCount || 0);
    setIsSaved(Boolean(post.isSaved));
    setComments(post.comments || []);
    setCommentsCount(post.commentsCount || (post.comments?.length || 0));

    // Initialize media analysis from populated post data
    if (Array.isArray(post.mediaAnalysis) && post.mediaAnalysis.length > 0) {
      const map = {};
      post.mediaAnalysis.forEach(item => {
        if (item && item.mediaUrl) {
          map[item.mediaUrl] = item;
        }
      });
      setMediaAnalysisMap(map);
    }
  }, [post._id, post.isLiked, post.hasLiked, post.likesCount, post.isSaved, post.commentsCount, post.mediaAnalysis]);

  // Listen for real-time origin analysis updates via Socket.io
  useEffect(() => {
    if (!socket) return;
    const handleAnalysisUpdate = (data) => {
      if (data && data.mediaId) {
        setMediaAnalysisMap(prev => {
          const updated = { ...prev };
          // Find matching key by mediaId or update all matching
          Object.keys(updated).forEach(url => {
            if (updated[url].mediaId === data.mediaId) {
              updated[url] = { ...updated[url], ...data };
            }
          });
          return updated;
        });
      }
    };

    socket.on('media:analysis:updated', handleAnalysisUpdate);
    return () => {
      socket.off('media:analysis:updated', handleAnalysisUpdate);
    };
  }, [socket]);

  const author = post.author || {};
  const mediaUrls = post.mediaUrls || [];
  const hasMultipleMedia = mediaUrls.length > 1;
  const currentMedia = mediaUrls[activeMediaIndex] || mediaUrls[0];
  const isVideo = currentMedia && (currentMedia.endsWith('.mp4') || currentMedia.endsWith('.webm'));
  const isOwner = user && author && (author._id === user._id || author === user._id);

  // Get current media analysis record
  const currentAnalysis = currentMedia ? (mediaAnalysisMap[currentMedia] || post.mediaAnalysis?.[activeMediaIndex]) : null;

  const formatTimestamp = (dateStr) => {
    if (!dateStr) return 'JUST NOW';
    const date = new Date(dateStr);
    const now = new Date();
    const diffSecs = Math.floor((now - date) / 1000);
    if (diffSecs < 60) return `${Math.max(1, diffSecs)}s AGO`;
    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) return `${diffMins}m AGO`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h AGO`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d AGO`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
  };

  const handleLike = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to like posts');
      return navigate('/login');
    }

    if (Date.now() < likeCooldownUntil) {
      const waitSecs = Math.ceil((likeCooldownUntil - Date.now()) / 1000);
      toast.error(`Please wait ${waitSecs}s before trying again.`);
      return;
    }

    if (isLiking) return;

    const nextLiked = !isLiked;
    setIsLiked(nextLiked);
    setLikesCount((prev) => nextLiked ? prev + 1 : Math.max(0, prev - 1));
    setIsLiking(true);

    try {
      const res = await api.post(`/posts/${post._id}/like`, { action: nextLiked ? 'like' : 'unlike' });
      if (res.data && typeof res.data.likesCount === 'number') {
        setLikesCount(res.data.likesCount);
        setIsLiked(Boolean(res.data.hasLiked ?? res.data.isLiked));
      }
    } catch (err) {
      // Revert optimistic UI
      setIsLiked(!nextLiked);
      setLikesCount((prev) => !nextLiked ? prev + 1 : Math.max(0, prev - 1));

      if (err.response?.status === 429) {
        const retrySecs = getRetryAfterSeconds(err, 10);
        setLikeCooldownUntil(Date.now() + retrySecs * 1000);
        toast.error(`You're doing that too fast. Please wait ${retrySecs}s.`);
      } else if (err.response?.status !== 401) {
        toast.error(err.response?.data?.message || 'Failed to update like');
      }
    } finally {
      setIsLiking(false);
    }
  };

  const handleDoubleTap = () => {
    if (!isLiked) handleLike();
    setShowHeartAnim(true);
    setTimeout(() => setShowHeartAnim(false), 800);
  };

  const handleSaveToggle = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to save posts');
      return navigate('/login');
    }

    if (Date.now() < saveCooldownUntil) {
      const waitSecs = Math.ceil((saveCooldownUntil - Date.now()) / 1000);
      toast.error(`Please wait ${waitSecs}s before trying again.`);
      return;
    }

    if (isSaving) return;

    const nextSaved = !isSaved;
    setIsSaved(nextSaved);
    setIsSaving(true);

    try {
      const res = await api.post(`/posts/${post._id}/save`, { action: nextSaved ? 'save' : 'unsave' });
      if (res.data && typeof res.data.isSaved === 'boolean') {
        setIsSaved(res.data.isSaved);
      }
    } catch (err) {
      setIsSaved(!nextSaved);

      if (err.response?.status === 429) {
        const retrySecs = getRetryAfterSeconds(err, 10);
        setSaveCooldownUntil(Date.now() + retrySecs * 1000);
        toast.error(`You're doing that too fast. Please wait ${retrySecs}s.`);
      } else if (err.response?.status !== 401) {
        toast.error(err.response?.data?.message || 'Failed to update saved post');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const fetchComments = async () => {
    if (loadedComments || isLoadingComments) return;
    try {
      setIsLoadingComments(true);
      const res = await api.get(`/comments/${post._id}`);
      setComments(Array.isArray(res.data) ? res.data : []);
      setLoadedComments(true);
    } catch (err) {
      if (err.response?.status === 429) {
        const retrySecs = getRetryAfterSeconds(err, 10);
        toast.error(`Comments temporarily busy. Please wait ${retrySecs}s.`);
      }
    } finally {
      setIsLoadingComments(false);
    }
  };

  const toggleComments = () => {
    const nextState = !isCommentsOpen;
    setIsCommentsOpen(nextState);
    if (nextState) fetchComments();
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    const textToSubmit = commentText.trim();
    if (!textToSubmit || !isAuthenticated || isSubmittingComment) return;

    try {
      setIsSubmittingComment(true);
      const res = await api.post('/comments', {
        postId: post._id,
        text: textToSubmit
      });

      setComments((prev) => [...prev, res.data]);
      setCommentsCount((prev) => prev + 1);
      setCommentText('');
    } catch (err) {
      if (err.response?.status === 429) {
        const retrySecs = getRetryAfterSeconds(err, 10);
        toast.error(`Too many comments submitted. Please wait ${retrySecs}s.`);
      } else {
        toast.error(err.response?.data?.message || 'Failed to post comment');
      }
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm('Delete post?')) return;
    try {
      await api.delete(`/posts/${post._id}`);
      toast.success('Post deleted');
      setShowOptionsModal(false);
      if (onUpdate) onUpdate();
    } catch (err) {
      toast.error('Failed to delete post');
    }
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/p/${post._id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard');
      setShowOptionsModal(false);
    }
  };

  const handleOpenEvidence = () => {
    if (currentAnalysis) {
      setSelectedAnalysis(currentAnalysis);
      setIsEvidenceModalOpen(true);
    }
  };

  const postText = post.caption || post.body || '';
  const shouldTruncateCaption = postText.length > 90 && !isExpandedCaption;

  return (
    <article className="w-full bg-[var(--ig-bg)] border-b border-[var(--ig-border)] md:border md:rounded-xl md:mb-5 pb-2 select-none">
      
      {/* 1. Post Header */}
      <div className="flex items-center justify-between px-3 py-2.5 sm:px-4">
        <div className="flex items-center gap-3">
          <Link to={`/u/${author.username}`}>
            <UserAvatar 
              src={author.avatar}
              name={author.displayName || author.username}
              size="sm"
              hasStory={true}
            />
          </Link>
          <div className="flex items-center gap-1.5 text-xs sm:text-sm">
            <Link to={`/u/${author.username}`} className="font-semibold text-[var(--ig-text-primary)] hover:opacity-80">
              {author.username || 'user'}
            </Link>
            <span className="text-[var(--ig-text-tertiary)]">•</span>
            <span className="text-[var(--ig-text-tertiary)] text-xs">
              {formatTimestamp(post.createdAt).toLowerCase().replace(' ago', '')}
            </span>
            {post.community && (
              <>
                <span className="text-[var(--ig-text-tertiary)]">•</span>
                <Link to={`/c/${post.community.slug}`} className="text-xs font-semibold text-[var(--ig-text-secondary)] hover:underline">
                  c/{post.community.name}
                </Link>
              </>
            )}
          </div>
        </div>

        <button 
          onClick={() => setShowOptionsModal(true)} 
          className="text-[var(--ig-text-primary)] hover:opacity-60 p-1.5"
          title="More options"
        >
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* 2. Media Area (Square 1:1 or 4:5) */}
      {currentMedia ? (
        <div 
          onDoubleClick={handleDoubleTap}
          className="relative w-full aspect-square sm:aspect-[4/5] bg-black overflow-hidden flex items-center justify-center cursor-pointer group"
        >
          {isVideo ? (
            <video 
              src={currentMedia} 
              controls 
              className="w-full h-full object-cover" 
            />
          ) : (
            <img 
              src={currentMedia} 
              alt={postText || 'Post photo'} 
              className="w-full h-full object-cover"
              loading="lazy"
            />
          )}

          {/* Image Origin & Provenance Status Badge */}
          {currentAnalysis && (
            <div className="absolute top-3 left-3 z-20">
              <ImageOriginBadge
                outcome={currentAnalysis.analysisOutcome}
                evidence={currentAnalysis.evidence}
                processingState={currentAnalysis.processingState}
                onClick={handleOpenEvidence}
                size="sm"
              />
            </div>
          )}

          {/* Carousel Arrows */}
          {hasMultipleMedia && activeMediaIndex > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); setActiveMediaIndex(activeMediaIndex - 1); }}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors z-10"
            >
              <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
            </button>
          )}

          {hasMultipleMedia && activeMediaIndex < mediaUrls.length - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setActiveMediaIndex(activeMediaIndex + 1); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors z-10"
            >
              <ChevronRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          )}

          {/* Double Tap Heart Overlay */}
          {showHeartAnim && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
              <Heart className="w-24 h-24 fill-[var(--ig-like)] text-[var(--ig-like)] drop-shadow-2xl animate-heart-pop" />
            </div>
          )}
        </div>
      ) : postText ? (
        <div className="px-4 py-6 bg-[var(--ig-elevated)] border-y border-[var(--ig-border)]">
          <p className="text-base text-[var(--ig-text-primary)] font-normal leading-relaxed">
            {postText}
          </p>
        </div>
      ) : null}

      {/* 3. Action Toolbar */}
      <div className="px-3 pt-3 pb-1 sm:px-4 flex items-center justify-between">
        <div className="flex items-center gap-4 text-[var(--ig-text-primary)]">
          {/* Like */}
          <button 
            onClick={handleLike} 
            className="hover:opacity-60 transition-transform active:scale-90"
            title={isLiked ? 'Unlike' : 'Like'}
          >
            <Heart 
              className={`w-6 h-6 stroke-[1.8] ${isLiked ? 'fill-[var(--ig-like)] text-[var(--ig-like)]' : ''}`} 
            />
          </button>

          {/* Comment */}
          <button 
            onClick={toggleComments} 
            className="hover:opacity-60 transition-transform active:scale-90"
            title="Comment"
          >
            <MessageCircle className="w-6 h-6 stroke-[1.8]" />
          </button>

          {/* Share */}
          <button 
            onClick={handleCopyLink} 
            className="hover:opacity-60 transition-transform active:scale-90"
            title="Share"
          >
            <Send className="w-6 h-6 stroke-[1.8]" />
          </button>
        </div>

        {/* Carousel Pagination Dots */}
        {hasMultipleMedia && (
          <div className="flex items-center gap-1">
            {mediaUrls.map((_, idx) => (
              <div 
                key={idx}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  idx === activeMediaIndex ? 'bg-[var(--ig-primary-button)]' : 'bg-[var(--ig-text-tertiary)]'
                }`}
              />
            ))}
          </div>
        )}

        {/* Bookmark */}
        <button 
          onClick={handleSaveToggle} 
          className="hover:opacity-60 text-[var(--ig-text-primary)] transition-transform active:scale-90"
          title={isSaved ? 'Remove from saved' : 'Save'}
        >
          <Bookmark 
            className={`w-6 h-6 stroke-[1.8] ${isSaved ? 'fill-current' : ''}`} 
          />
        </button>
      </div>

      {/* 4. Likes Count */}
      <div className="px-3 pt-1.5 sm:px-4">
        <span className="text-sm font-semibold text-[var(--ig-text-primary)]">
          {likesCount.toLocaleString()} {likesCount === 1 ? 'like' : 'likes'}
        </span>
      </div>

      {/* 5. Caption */}
      {postText && currentMedia && (
        <div className="px-3 pt-1 text-sm sm:px-4 leading-normal">
          <Link to={`/u/${author.username}`} className="font-semibold text-[var(--ig-text-primary)] mr-2">
            {author.username || 'user'}
          </Link>
          <span className="text-[var(--ig-text-primary)] whitespace-pre-line">
            {shouldTruncateCaption ? `${postText.slice(0, 90)}...` : postText}
          </span>
          {shouldTruncateCaption && (
            <button 
              onClick={() => setIsExpandedCaption(true)}
              className="text-xs text-[var(--ig-text-tertiary)] ml-1 hover:underline font-normal"
            >
              more
            </button>
          )}

          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {post.tags.map((tag) => (
                <Link key={tag} to={`/explore?tag=${tag}`} className="text-xs text-[var(--ig-text-link)] hover:underline">
                  #{tag}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 6. Comments Summary Link */}
      {commentsCount > 0 && (
        <div className="px-3 pt-1 sm:px-4">
          <button 
            onClick={toggleComments}
            className="text-xs sm:text-sm text-[var(--ig-text-tertiary)] hover:underline"
          >
            View all {commentsCount} comments
          </button>
        </div>
      )}

      {/* 7. Inline Comments Drawer (if expanded) */}
      {isCommentsOpen && (
        <div className="px-3 sm:px-4 py-2 space-y-2 border-t border-[var(--ig-border)] mt-2">
          {comments.map((c, i) => (
            <div key={c._id || i} className="text-xs sm:text-sm leading-snug">
              <Link to={`/u/${c.author?.username}`} className="font-semibold text-[var(--ig-text-primary)] mr-2">
                {c.author?.username || 'member'}
              </Link>
              <span className="text-[var(--ig-text-primary)]">{c.text || c.body}</span>
            </div>
          ))}
        </div>
      )}

      {/* 8. Timestamp */}
      <div className="px-3 pt-1 sm:px-4">
        <span className="text-[10px] uppercase font-normal text-[var(--ig-text-tertiary)] tracking-wider">
          {formatTimestamp(post.createdAt)}
        </span>
      </div>

      {/* 9. Add Comment Input Row */}
      <form onSubmit={handleCommentSubmit} className="hidden sm:flex items-center px-4 pt-3 mt-2 border-t border-[var(--ig-border)] gap-2">
        <Smile className="w-5 h-5 text-[var(--ig-text-tertiary)] hover:text-[var(--ig-text-primary)] cursor-pointer" />
        <input 
          type="text"
          placeholder="Add a comment..."
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          className="flex-1 bg-transparent text-sm text-[var(--ig-text-primary)] placeholder:text-[var(--ig-text-tertiary)] outline-none"
        />
        <button
          type="submit"
          disabled={!commentText.trim() || isSubmittingComment}
          className="text-sm font-semibold text-[var(--ig-primary-button)] hover:text-[var(--ig-primary-button-hover)] disabled:opacity-0 transition-opacity"
        >
          Post
        </button>
      </form>

      {/* Options Modal Dialog */}
      {showOptionsModal && (
        <div 
          onClick={() => setShowOptionsModal(false)}
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 animate-fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[400px] bg-[var(--ig-elevated)] border border-[var(--ig-border)] rounded-2xl overflow-hidden divide-y divide-[var(--ig-border)] shadow-2xl text-center text-sm"
          >
            {currentAnalysis && (
              <button
                onClick={() => { setShowOptionsModal(false); handleOpenEvidence(); }}
                className="w-full py-3.5 font-semibold text-[var(--ig-text-primary)] hover:bg-[var(--ig-hover)] transition-colors"
              >
                Inspect image origin & credentials
              </button>
            )}
            {isOwner && (
              <button 
                onClick={handleDeletePost}
                className="w-full py-3.5 font-bold text-red-500 hover:bg-[var(--ig-hover)] transition-colors"
              >
                Delete
              </button>
            )}
            <button 
              onClick={() => { setShowOptionsModal(false); navigate(`/p/${post._id}`); }}
              className="w-full py-3.5 font-semibold text-[var(--ig-text-primary)] hover:bg-[var(--ig-hover)] transition-colors"
            >
              Go to post
            </button>
            <button 
              onClick={handleCopyLink}
              className="w-full py-3.5 font-semibold text-[var(--ig-text-primary)] hover:bg-[var(--ig-hover)] transition-colors"
            >
              Copy link
            </button>
            <button 
              onClick={() => setShowOptionsModal(false)}
              className="w-full py-3.5 font-normal text-[var(--ig-text-primary)] hover:bg-[var(--ig-hover)] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Evidence Modal */}
      {isEvidenceModalOpen && selectedAnalysis && (
        <ImageOriginEvidenceModal
          isOpen={isEvidenceModalOpen}
          onClose={() => setIsEvidenceModalOpen(false)}
          analysisData={selectedAnalysis}
          mediaUrl={currentMedia}
          isAuthor={isOwner}
          onReviewSubmitted={() => {
            if (onUpdate) onUpdate();
          }}
        />
      )}
    </article>
  );
}
