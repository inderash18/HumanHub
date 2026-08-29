import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Heart,
  MessageSquare,
  Share2,
  Bookmark,
  MoreHorizontal,
  Send,
  Trash2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '../../store/useAuthStore';
import api from '../../services/api';
import UserAvatar from '../common/UserAvatar';
import Button from '../ui/Button';

export default function PostCard({ post, onUpdate }) {
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  const [isLiked, setIsLiked] = useState(Boolean(post.isLiked ?? post.hasLiked ?? (post.userVote === 1)));
  const [likesCount, setLikesCount] = useState(post.upvotes || 0);
  const [isSaved, setIsSaved] = useState(Boolean(post.isSaved));
  const [showHeartAnim, setShowHeartAnim] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [comments, setComments] = useState(post.comments || []);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [showOptionsModal, setShowOptionsModal] = useState(false);

  useEffect(() => {
    setIsLiked(Boolean(post.isLiked ?? post.hasLiked ?? (post.userVote === 1)));
    setLikesCount(post.upvotes || 0);
    setIsSaved(Boolean(post.isSaved));
    setComments(post.comments || []);
  }, [post._id, post.isLiked, post.hasLiked, post.userVote, post.upvotes, post.isSaved, user?._id]);

  useEffect(() => {
    const handleVotedEvent = (e) => {
      const { postId, upvotes, userId, value } = e.detail || {};
      if (postId === post._id) {
        if (typeof upvotes === 'number') setLikesCount(upvotes);
        if (user && userId === user._id) setIsLiked(value === 1);
      }
    };
    window.addEventListener('post:voted:event', handleVotedEvent);
    return () => window.removeEventListener('post:voted:event', handleVotedEvent);
  }, [post._id, user?._id]);

  const author = post.author || {};
  const mediaUrl = post.mediaUrls && post.mediaUrls.length > 0 ? post.mediaUrls[0] : null;
  const isOwner = user && author && (author._id === user._id || author === user._id);

  const formatTimestamp = (dateStr) => {
    if (!dateStr) return 'Just now';
    const date = new Date(dateStr);
    const now = new Date();
    const diffSecs = Math.floor((now - date) / 1000);
    if (diffSecs < 60) return `${diffSecs}s ago`;
    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const handleLike = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to like posts');
      return navigate('/login');
    }

    const nextLiked = !isLiked;
    setIsLiked(nextLiked);
    setLikesCount((prev) => nextLiked ? prev + 1 : Math.max(0, prev - 1));

    try {
      const res = await api.post(`/posts/${post._id}/vote`, { 
        value: nextLiked ? 1 : 0,
        direction: nextLiked ? 1 : 0 
      });
      if (res.data) {
        if (typeof res.data.upvotes === 'number') setLikesCount(res.data.upvotes);
        if (typeof res.data.isLiked === 'boolean') setIsLiked(res.data.isLiked);
      }
    } catch (err) {
      setIsLiked(!nextLiked);
      setLikesCount((prev) => !nextLiked ? prev + 1 : Math.max(0, prev - 1));
      toast.error('Failed to update like');
    }
  };

  const handleDoubleTap = () => {
    if (!isLiked) handleLike();
    setShowHeartAnim(true);
    setTimeout(() => setShowHeartAnim(false), 700);
  };

  const handleSaveToggle = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to save posts');
      return navigate('/login');
    }
    const nextSaved = !isSaved;
    setIsSaved(nextSaved);

    try {
      const res = await api.post(`/posts/${post._id}/save`);
      if (res.data && typeof res.data.isSaved === 'boolean') {
        setIsSaved(res.data.isSaved);
        toast.success(res.data.isSaved ? 'Saved to bookmarks' : 'Removed from bookmarks');
      }
    } catch (err) {
      setIsSaved(!nextSaved);
      toast.error('Failed to update bookmark');
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !isAuthenticated) return;

    try {
      setIsSubmittingComment(true);
      const res = await api.post('/comments', {
        postId: post._id,
        body: commentText.trim()
      });

      const newComment = res.data || {
        _id: Date.now().toString(),
        body: commentText.trim(),
        author: { username: user.username, displayName: user.displayName, avatar: user.avatar },
        createdAt: new Date().toISOString()
      };

      setComments((prev) => [...prev, newComment]);
      setCommentText('');
      toast.success('Comment added ✨');
    } catch (err) {
      toast.error('Failed to post comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await api.delete(`/posts/${post._id}`);
      toast.success('Post deleted');
      setShowOptionsModal(false);
      if (onUpdate) onUpdate();
    } catch (err) {
      toast.error('Failed to delete post');
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/p/${post._id}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard! 📋');
  };

  return (
    <article className="w-full bg-hub-surface border border-hub-border rounded-3xl overflow-hidden shadow-xl hover:border-hub-border-light transition-all select-none mb-4">
      {/* Author Header */}
      <div className="flex items-center justify-between p-4 sm:p-5 border-b border-hub-border">
        <div className="flex items-center gap-3">
          <Link to={`/u/${author.username}`}>
            <UserAvatar 
              src={author.avatar}
              name={author.displayName || author.username}
              size="sm"
            />
          </Link>
          <div>
            <Link to={`/u/${author.username}`} className="font-bold text-xs text-hub-text-primary hover:underline truncate max-w-[180px] block">
              {author.displayName || author.username || 'member'}
            </Link>
            <span className="text-[10px] text-hub-text-tertiary">
              {formatTimestamp(post.createdAt)}
            </span>
          </div>
        </div>

        <button 
          onClick={() => setShowOptionsModal(true)} 
          className="text-hub-text-tertiary hover:text-hub-text-primary p-1.5 rounded-xl hover:bg-hub-surface-elevated transition-colors"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Text Content */}
      <div className="px-5 pt-4 pb-2">
        {post.title && post.title !== post.body && (
          <h2 className="font-display text-sm sm:text-base font-bold text-hub-text-primary mb-1.5 leading-snug">
            {post.title}
          </h2>
        )}
        <p className="text-xs sm:text-sm text-hub-text-secondary leading-relaxed whitespace-pre-line">
          {post.body}
        </p>
      </div>

      {/* Media Image */}
      {mediaUrl && (
        <div 
          onDoubleClick={handleDoubleTap}
          className="relative w-full aspect-video sm:aspect-[16/10] bg-hub-surface-elevated overflow-hidden flex items-center justify-center cursor-pointer my-2 border-y border-hub-border"
        >
          <img 
            src={mediaUrl} 
            alt={post.title || 'Post media'} 
            className="w-full h-full object-cover"
          />

          {/* Double Tap Heart Animation */}
          {showHeartAnim && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
              <Heart className="text-hub-accent w-20 h-20 fill-current drop-shadow-2xl animate-scale-in" />
            </div>
          )}
        </div>
      )}

      {/* Action Toolbar */}
      <div className="px-4 py-2.5 flex items-center justify-between border-t border-hub-border bg-hub-surface-elevated/40">
        <div className="flex items-center gap-2">
          {/* Like Action */}
          <button 
            onClick={handleLike}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
              isLiked 
                ? 'bg-hub-accent text-white border-hub-accent shadow-sm' 
                : 'bg-hub-surface border-hub-border text-hub-text-secondary hover:text-hub-text-primary hover:bg-hub-surface-elevated'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
            <span className="font-mono-code">{likesCount}</span>
          </button>

          {/* Comments Toggle */}
          <button 
            onClick={() => setIsCommentsOpen(!isCommentsOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-hub-surface border border-hub-border text-xs font-semibold text-hub-text-secondary hover:text-hub-text-primary hover:bg-hub-surface-elevated transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="font-mono-code">{comments.length}</span>
          </button>

          {/* Share Action */}
          <button 
            onClick={handleShare}
            className="p-2 rounded-xl bg-hub-surface border border-hub-border text-hub-text-secondary hover:text-hub-text-primary hover:bg-hub-surface-elevated transition-colors text-xs"
            title="Copy link"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Bookmark Action */}
        <button 
          onClick={handleSaveToggle}
          className={`p-2 rounded-xl border text-xs transition-colors ${
            isSaved 
              ? 'bg-hub-accent text-white border-hub-accent' 
              : 'bg-hub-surface border-hub-border text-hub-text-secondary hover:text-hub-text-primary hover:bg-hub-surface-elevated'
          }`}
          title={isSaved ? 'Saved in library' : 'Save post'}
        >
          <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Comments Drawer */}
      {isCommentsOpen && (
        <div className="px-4 pb-4 pt-3 border-t border-hub-border bg-hub-surface-elevated/60 space-y-3 animate-fade-in">
          <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
            {comments.length > 0 ? (
              comments.map((c, i) => (
                <div key={c._id || i} className="p-3 rounded-2xl bg-hub-surface border border-hub-border text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <UserAvatar src={c.author?.avatar} name={c.author?.displayName || c.author?.username} size="xs" />
                      <span className="font-bold text-hub-text-primary">@{c.author?.username || 'member'}</span>
                    </div>
                    <span className="text-[10px] text-hub-text-tertiary">{formatTimestamp(c.createdAt)}</span>
                  </div>
                  <p className="text-hub-text-secondary pl-6">{c.body}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-hub-text-tertiary text-center py-3">No comments yet. Start the conversation below!</p>
            )}
          </div>

          <form onSubmit={handleCommentSubmit} className="flex items-center gap-2 pt-1">
            <input 
              type="text"
              placeholder="Add a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="flex-1 bg-hub-surface border border-hub-border text-xs text-hub-text-primary placeholder:text-hub-text-tertiary rounded-xl px-3.5 py-2.5 outline-none focus:border-hub-accent"
            />
            <Button 
              type="submit"
              size="sm"
              variant="primary"
              disabled={isSubmittingComment || !commentText.trim()}
              icon={Send}
            >
              Post
            </Button>
          </form>
        </div>
      )}

      {/* Options Modal */}
      {showOptionsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-hub-surface border border-hub-border rounded-3xl overflow-hidden p-2 divide-y divide-hub-border animate-fade-in shadow-2xl">
            <button 
              onClick={() => { setShowOptionsModal(false); handleShare(); }}
              className="w-full py-2.5 text-xs font-bold text-hub-text-primary hover:bg-hub-surface-elevated rounded-xl text-center"
            >
              Copy Link
            </button>
            <button 
              onClick={() => { setShowOptionsModal(false); navigate(`/p/${post._id}`); }}
              className="w-full py-2.5 text-xs font-bold text-hub-text-primary hover:bg-hub-surface-elevated rounded-xl text-center"
            >
              View Full Post
            </button>
            {isOwner && (
              <button 
                onClick={handleDeletePost}
                className="w-full py-2.5 text-xs font-bold text-hub-danger hover:bg-hub-danger/10 rounded-xl text-center flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete Post
              </button>
            )}
            <button 
              onClick={() => setShowOptionsModal(false)}
              className="w-full py-2.5 text-xs font-medium text-hub-text-tertiary hover:bg-hub-surface-elevated rounded-xl text-center"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
