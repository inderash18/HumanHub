import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  Heart,
  Bookmark,
  MessageSquare,
  Send,
  Share2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '../store/useAuthStore';
import api from '../services/api';
import UserAvatar from '../components/common/UserAvatar';
import Button from '../components/ui/Button';
import EmptyState from '../components/common/EmptyState';

export default function PostDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([]);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  useEffect(() => {
    fetchPost();
    fetchComments();
  }, [id]);

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
      toast.error('Moment not found');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const res = await api.get(`/comments/${id}`);
      setComments(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setComments([]);
    }
  };

  const handleLike = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to like moments');
      return navigate('/?mode=signin');
    }

    const nextLiked = !isLiked;
    setIsLiked(nextLiked);
    setLikesCount((prev) => nextLiked ? prev + 1 : Math.max(0, prev - 1));

    try {
      const res = await api.post(`/posts/${id}/like`);
      if (res.data && typeof res.data.likesCount === 'number') {
        setLikesCount(res.data.likesCount);
        setIsLiked(res.data.hasLiked);
      }
    } catch (err) {
      setIsLiked(!nextLiked);
      setLikesCount((prev) => !nextLiked ? prev + 1 : Math.max(0, prev - 1));
      toast.error('Failed to update like');
    }
  };

  const handleSave = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to bookmark moments');
      return navigate('/?mode=signin');
    }
    const nextSaved = !isSaved;
    setIsSaved(nextSaved);
    try {
      const res = await api.post(`/posts/${id}/save`);
      if (res.data && typeof res.data.isSaved === 'boolean') {
        setIsSaved(res.data.isSaved);
        toast.success(res.data.isSaved ? 'Saved to bookmarks' : 'Removed from bookmarks');
      }
    } catch (err) {
      setIsSaved(!nextSaved);
      toast.error('Failed to bookmark');
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !isAuthenticated) return;

    try {
      setIsSubmittingComment(true);
      const res = await api.post('/comments', {
        postId: id,
        text: commentText.trim()
      });

      setComments((prev) => [...prev, res.data]);
      setCommentText('');
      toast.success('Comment posted ✨');
    } catch (err) {
      toast.error('Failed to post comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard! 📋');
    }
  };

  const formatTimestamp = (dateStr) => {
    if (!dateStr) return 'Just now';
    const date = new Date(dateStr);
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 py-20 text-center select-none">
        <p className="text-xs text-[var(--text-tertiary)]">Loading moment...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="w-full max-w-md mx-auto px-4 py-20 select-none">
        <EmptyState
          title="Moment not found"
          description="This post may have been removed or is no longer available."
          actionLabel="Back to Feed"
          onAction={() => navigate('/feed')}
        />
      </div>
    );
  }

  const author = post.author || {};
  const mediaUrls = post.mediaUrls || [];
  const primaryMedia = mediaUrls[0];
  const isVideo = primaryMedia && (primaryMedia.endsWith('.mp4') || primaryMedia.endsWith('.webm'));

  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-8 select-none space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)] font-semibold transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back
      </button>

      {/* Main Post Card */}
      <article className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl overflow-hidden shadow-2xl">
        {/* Author Header */}
        <div className="p-4 sm:p-5 border-b border-[var(--border)] flex items-center justify-between">
          <Link to={`/u/${author.username}`} className="flex items-center gap-3 group">
            <UserAvatar src={author.avatar} name={author.displayName || author.username} size="md" />
            <div>
              <p className="font-bold text-xs sm:text-sm text-[var(--text-primary)] group-hover:underline">
                {author.displayName || author.username}
              </p>
              <p className="text-[10px] text-[var(--text-tertiary)]">
                @{author.username} • {formatTimestamp(post.createdAt)}
              </p>
            </div>
          </Link>
        </div>

        {/* Text Content */}
        {(post.caption || post.body) && (
          <div className="p-5">
            <p className="text-xs sm:text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-line">
              {post.caption || post.body}
            </p>
          </div>
        )}

        {/* Media */}
        {primaryMedia && (
          <div className="w-full aspect-video bg-[var(--surface-elevated)] overflow-hidden flex items-center justify-center border-y border-[var(--border)]">
            {isVideo ? (
              <video src={primaryMedia} controls className="w-full h-full object-cover" />
            ) : (
              <img src={primaryMedia} alt="Moment media" className="w-full h-full object-cover" />
            )}
          </div>
        )}

        {/* Actions Bar */}
        <div className="p-4 flex items-center justify-between border-t border-[var(--border)] bg-[var(--surface-elevated)]/30">
          <div className="flex items-center gap-2">
            <button
              onClick={handleLike}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                isLiked 
                  ? 'bg-[var(--accent)] text-white border-[var(--accent)]' 
                  : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
              <span className="font-mono">{likesCount}</span>
            </button>

            <button
              onClick={handleShare}
              className="p-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              title="Share"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={handleSave}
            className={`p-2 rounded-xl border text-xs ${
              isSaved 
                ? 'bg-[var(--accent)] text-white border-[var(--accent)]' 
                : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-secondary)]'
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Comments Section */}
        <div className="p-5 border-t border-[var(--border)] bg-[var(--surface-elevated)]/50 space-y-4">
          <h3 className="font-display text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
            Comments ({comments.length})
          </h3>

          <div className="space-y-3">
            {comments.length > 0 ? (
              comments.map((c, idx) => (
                <div key={c._id || idx} className="p-3.5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] text-xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <Link to={`/u/${c.author?.username}`} className="flex items-center gap-2">
                      <UserAvatar src={c.author?.avatar} name={c.author?.displayName || c.author?.username} size="xs" />
                      <span className="font-bold text-[var(--text-primary)]">@{c.author?.username || 'member'}</span>
                    </Link>
                    <span className="text-[10px] text-[var(--text-tertiary)]">{formatTimestamp(c.createdAt)}</span>
                  </div>
                  <p className="text-[var(--text-secondary)] pl-6 leading-relaxed">
                    {c.text || c.body}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-xs text-[var(--text-tertiary)] text-center py-4">No comments yet. Be the first to reply!</p>
            )}
          </div>

          {/* Add Comment Form */}
          {isAuthenticated ? (
            <form onSubmit={handleComment} className="flex items-center gap-2 pt-2">
              <input
                type="text"
                placeholder="Write a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="flex-1 bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] rounded-xl px-4 py-2.5 outline-none focus:border-[var(--accent)]"
              />
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={isSubmittingComment || !commentText.trim()}
                icon={Send}
              >
                Post
              </Button>
            </form>
          ) : (
            <div className="p-3 text-center rounded-xl bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--text-secondary)]">
              <Link to="/?mode=signin" className="text-[var(--accent)] font-bold hover:underline">Sign in</Link> to leave a comment.
            </div>
          )}
        </div>
      </article>
    </div>
  );
}
