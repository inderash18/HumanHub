import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
  Smile,
  ArrowLeft,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '../store/useAuthStore';
import api, { getRetryAfterSeconds } from '../services/api';
import UserAvatar from '../components/common/UserAvatar';
import EmptyState from '../components/common/EmptyState';
import ImageOriginBadge from '../components/media/ImageOriginBadge';
import ImageOriginEvidenceModal from '../components/media/ImageOriginEvidenceModal';
import { useSocketStore } from '../store/useSocketStore';

export default function PostDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const socket = useSocketStore(s => s.socket);

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isLiking, setIsLiking] = useState(false);
  const [likeCooldownUntil, setLikeCooldownUntil] = useState(0);

  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveCooldownUntil, setSaveCooldownUntil] = useState(0);

  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([]);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);

  // Origin Analysis Modal
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState(false);

  useEffect(() => {
    fetchPost();
    fetchComments();
  }, [id]);

  useEffect(() => {
    if (!socket) return;
    const handleAnalysisUpdate = (data) => {
      if (data && post && Array.isArray(post.mediaAnalysis)) {
        setPost(prev => {
          if (!prev) return prev;
          const updatedAnalysis = prev.mediaAnalysis.map(a => 
            a.mediaId === data.mediaId ? { ...a, ...data } : a
          );
          return { ...prev, mediaAnalysis: updatedAnalysis };
        });
      }
    };
    socket.on('media:analysis:updated', handleAnalysisUpdate);
    return () => {
      socket.off('media:analysis:updated', handleAnalysisUpdate);
    };
  }, [socket, post]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/posts/${id}`);
      const postData = res.data?.post || res.data;
      setPost(postData);
      setIsLiked(Boolean(postData.isLiked ?? postData.hasLiked));
      setLikesCount(postData.likesCount || 0);
      setIsSaved(Boolean(postData.isSaved));
    } catch (err) {
      toast.error('Post not found');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    if (isLoadingComments) return;
    try {
      setIsLoadingComments(true);
      const res = await api.get(`/comments/${id}`);
      setComments(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setComments([]);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handleLike = async () => {
    if (!isAuthenticated) return navigate('/login');

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
      const res = await api.post(`/posts/${id}/like`, { action: nextLiked ? 'like' : 'unlike' });
      if (res.data && typeof res.data.likesCount === 'number') {
        setLikesCount(res.data.likesCount);
        setIsLiked(Boolean(res.data.hasLiked ?? res.data.isLiked));
      }
    } catch (err) {
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

  const handleSave = async () => {
    if (!isAuthenticated) return navigate('/login');

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
      const res = await api.post(`/posts/${id}/save`, { action: nextSaved ? 'save' : 'unsave' });
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

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    const textToSubmit = commentText.trim();
    if (!textToSubmit || !isAuthenticated || isSubmittingComment) return;

    try {
      setIsSubmittingComment(true);
      const res = await api.post('/comments', {
        postId: id,
        text: textToSubmit
      });
      setComments((prev) => [...prev, res.data]);
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

  const author = post?.author || {};
  const mediaUrls = post?.mediaUrls || [];
  const currentMedia = mediaUrls[activeMediaIndex] || mediaUrls[0];
  const isVideo = currentMedia && (currentMedia.endsWith('.mp4') || currentMedia.endsWith('.webm'));
  const isOwner = user && author && (author._id === user._id || author === user._id);
  const currentAnalysis = post?.mediaAnalysis?.[activeMediaIndex] || (post?.mediaAnalysis?.[0]);

  if (loading) {
    return (
      <div className="w-full max-w-[935px] mx-auto min-h-[500px] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--ig-primary-button)] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="w-full max-w-[935px] mx-auto py-20 text-center">
        <EmptyState 
          title="Post not found"
          description="The link you followed may be broken, or the post may have been removed."
          actionLabel="Back to Feed"
          onAction={() => navigate('/feed')}
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-[935px] mx-auto px-0 md:px-4 py-0 md:py-8 select-none">
      {/* Mobile Back Button */}
      <div className="md:hidden h-11 border-b border-[var(--ig-border)] flex items-center px-3">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-semibold text-[var(--ig-text-primary)]">
          <ArrowLeft className="w-5 h-5" />
          <span>Post</span>
        </button>
      </div>

      {/* 2-Column Desktop Modal / Card View */}
      <div className="bg-[var(--ig-bg)] md:border border-[var(--ig-border)] md:rounded-lg overflow-hidden flex flex-col md:flex-row min-h-[550px] max-h-[90vh]">
        
        {/* Left Column: Media Player */}
        <div className="w-full md:w-[60%] bg-black flex items-center justify-center relative">
          {currentMedia ? (
            isVideo ? (
              <video src={currentMedia} controls className="w-full h-full object-contain max-h-[700px]" />
            ) : (
              <img 
                src={currentMedia} 
                alt={post.caption || 'Post image'} 
                className="w-full h-full object-contain max-h-[700px]"
              />
            )
          ) : (
            <div className="p-8 text-center text-white text-base">
              {post.caption || post.body}
            </div>
          )}

          {/* Origin & Provenance Badge Overlay */}
          {currentAnalysis && (
            <div className="absolute top-3 left-3 z-20">
              <ImageOriginBadge
                outcome={currentAnalysis.analysisOutcome}
                evidence={currentAnalysis.evidence}
                processingState={currentAnalysis.processingState}
                onClick={() => {
                  setSelectedAnalysis(currentAnalysis);
                  setIsEvidenceModalOpen(true);
                }}
                size="sm"
              />
            </div>
          )}

          {/* Carousel Arrows */}
          {mediaUrls.length > 1 && activeMediaIndex > 0 && (
            <button
              onClick={() => setActiveMediaIndex(activeMediaIndex - 1)}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 z-10"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          {mediaUrls.length > 1 && activeMediaIndex < mediaUrls.length - 1 && (
            <button
              onClick={() => setActiveMediaIndex(activeMediaIndex + 1)}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 z-10"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Right Column: Author Header, Comments, Actions */}
        <div className="w-full md:w-[40%] flex flex-col justify-between border-t md:border-t-0 md:border-l border-[var(--ig-border)] bg-[var(--ig-bg)]">
          {/* Top Author Header */}
          <div className="h-14 px-4 border-b border-[var(--ig-border)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to={`/u/${author.username}`}>
                <UserAvatar src={author.avatar} name={author.displayName || author.username} size="sm" hasStory={true} />
              </Link>
              <Link to={`/u/${author.username}`} className="text-sm font-semibold text-[var(--ig-text-primary)] hover:opacity-80">
                {author.username}
              </Link>
            </div>
            <button className="text-[var(--ig-text-primary)] hover:opacity-60">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>

          {/* Middle: Caption + Comments Stream */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {/* Author Caption */}
            {post.caption && (
              <div className="flex items-start gap-3 text-sm">
                <Link to={`/u/${author.username}`}>
                  <UserAvatar src={author.avatar} name={author.displayName || author.username} size="xs" />
                </Link>
                <div className="flex-1 leading-normal">
                  <Link to={`/u/${author.username}`} className="font-semibold text-[var(--ig-text-primary)] mr-2">
                    {author.username}
                  </Link>
                  <span className="text-[var(--ig-text-primary)] whitespace-pre-line">{post.caption}</span>
                </div>
              </div>
            )}

            {/* Comments List */}
            {comments.map((c, i) => (
              <div key={c._id || i} className="flex items-start gap-3 text-sm">
                <Link to={`/u/${c.author?.username}`}>
                  <UserAvatar src={c.author?.avatar} name={c.author?.displayName || c.author?.username} size="xs" />
                </Link>
                <div className="flex-1 leading-normal">
                  <Link to={`/u/${c.author?.username}`} className="font-semibold text-[var(--ig-text-primary)] mr-2">
                    {c.author?.username || 'member'}
                  </Link>
                  <span className="text-[var(--ig-text-primary)]">{c.text || c.body}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Actions & Input */}
          <div className="border-t border-[var(--ig-border)]">
            <div className="px-4 pt-3 pb-1 flex items-center justify-between text-[var(--ig-text-primary)]">
              <div className="flex items-center gap-4">
                <button onClick={handleLike} className="hover:opacity-60">
                  <Heart className={`w-6 h-6 stroke-[1.8] ${isLiked ? 'fill-[var(--ig-like)] text-[var(--ig-like)]' : ''}`} />
                </button>
                <button className="hover:opacity-60">
                  <MessageCircle className="w-6 h-6 stroke-[1.8]" />
                </button>
                <button onClick={() => {}} className="hover:opacity-60">
                  <Send className="w-6 h-6 stroke-[1.8]" />
                </button>
              </div>

              <button onClick={handleSave} className="hover:opacity-60">
                <Bookmark className={`w-6 h-6 stroke-[1.8] ${isSaved ? 'fill-current' : ''}`} />
              </button>
            </div>

            <div className="px-4 pt-1">
              <span className="text-sm font-semibold text-[var(--ig-text-primary)]">
                {likesCount.toLocaleString()} likes
              </span>
            </div>

            <form onSubmit={handleCommentSubmit} className="flex items-center px-4 py-3 mt-1 border-t border-[var(--ig-border)] gap-2">
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
          </div>

        </div>

      </div>

      {/* Evidence Modal */}
      {isEvidenceModalOpen && selectedAnalysis && (
        <ImageOriginEvidenceModal
          isOpen={isEvidenceModalOpen}
          onClose={() => setIsEvidenceModalOpen(false)}
          analysisData={selectedAnalysis}
          mediaUrl={currentMedia}
          isAuthor={isOwner}
          onReviewSubmitted={fetchPost}
        />
      )}
    </div>
  );
}
