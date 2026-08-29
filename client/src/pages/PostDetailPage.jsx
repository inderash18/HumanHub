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
import EmptyState from '../components/ui/EmptyState';

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
  }, [id]);

  useEffect(() => {
    const handleVotedEvent = (e) => {
      const { postId, upvotes, userId, value } = e.detail || {};
      if (postId === id) {
        if (typeof upvotes === 'number') setLikesCount(upvotes);
        if (user && userId === user._id) setIsLiked(value === 1);
      }
    };
    window.addEventListener('post:voted:event', handleVotedEvent);
    return () => window.removeEventListener('post:voted:event', handleVotedEvent);
  }, [id, user?._id]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/posts/${id}`);
      const postData = res.data;
      setPost(postData);
      setIsLiked(Boolean(postData.isLiked ?? postData.hasLiked ?? (postData.userVote === 1)));
      setLikesCount(postData.upvotes || 0);
      setIsSaved(Boolean(postData.isSaved));
      setComments(postData.comments || []);
    } catch (err) {
      toast.error('Post not found');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to like');
      return navigate('/login');
    }

    const nextLiked = !isLiked;
    setIsLiked(nextLiked);
    setLikesCount((prev) => nextLiked ? prev + 1 : Math.max(0, prev - 1));

    try {
      const res = await api.post(`/posts/${id}/vote`, { 
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

  const handleSave = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to save');
      return navigate('/login');
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
      toast.success('Comment published ✨');
    } catch (err) {
      toast.error('Failed to publish comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard! 📋');
  };

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-20 flex flex-col items-center justify-center select-none">
        <p className="text-xs text-hub-text-tertiary">Loading post...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="w-full max-w-md mx-auto px-4 py-24 select-none">
        <EmptyState
          title="Post Not Found"
          description="This post does not exist or has been removed."
          actionLabel="Return to Feed"
          onAction={() => navigate('/feed')}
        />
      </div>
    );
  }

  const author = post.author || {};
  const mediaUrl = post.mediaUrls && post.mediaUrls.length > 0 ? post.mediaUrls[0] : null;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 select-none">
      {/* Top Back Navigation */}
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-xs font-bold text-hub-text-secondary hover:text-hub-text-primary mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {/* Main Post Card */}
      <div className="bg-hub-surface border border-hub-border rounded-3xl overflow-hidden shadow-2xl mb-8">
        {/* Author Header */}
        <div className="p-6 border-b border-hub-border flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <Link to={`/u/${author.username}`}>
              <UserAvatar 
                src={author.avatar} 
                name={author.displayName || author.username} 
                size="md"
              />
            </Link>
            <div>
              <Link to={`/u/${author.username}`} className="font-bold text-sm text-hub-text-primary hover:text-hub-accent transition-colors block">
                {author.displayName || author.username}
              </Link>
              <span className="text-[11px] text-hub-text-tertiary">@{author.username}</span>
            </div>
          </div>

          <button 
            onClick={handleShare}
            className="p-2 rounded-xl bg-hub-surface-elevated hover:bg-hub-surface-muted text-hub-text-secondary hover:text-hub-text-primary transition-colors text-xs"
            title="Share"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-4">
          {post.title && (
            <h1 className="font-display text-xl sm:text-2xl font-bold text-hub-text-primary">
              {post.title}
            </h1>
          )}
          <p className="text-sm text-hub-text-primary leading-relaxed whitespace-pre-line">
            {post.body}
          </p>
        </div>

        {/* Media */}
        {mediaUrl && (
          <div className="w-full bg-black flex items-center justify-center border-y border-hub-border">
            <img src={mediaUrl} alt={post.title} className="max-h-[600px] w-full object-contain" />
          </div>
        )}

        {/* Actions Bar */}
        <div className="p-4 sm:p-6 border-t border-hub-border flex items-center justify-between bg-hub-surface-elevated/40">
          <div className="flex items-center gap-3">
            <Button
              variant={isLiked ? 'primary' : 'secondary'}
              size="md"
              onClick={handleLike}
              icon={Heart}
            >
              <span>{likesCount} Likes</span>
            </Button>

            <Button
              variant="secondary"
              size="md"
              icon={MessageSquare}
            >
              <span>{comments.length} Comments</span>
            </Button>
          </div>

          <Button
            variant={isSaved ? 'primary' : 'secondary'}
            size="md"
            onClick={handleSave}
            icon={Bookmark}
          >
            {isSaved ? 'Saved' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Comments Section */}
      <div className="bg-hub-surface border border-hub-border rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        <h2 className="font-display text-base sm:text-lg font-bold text-hub-text-primary flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-hub-accent" />
          Comments ({comments.length})
        </h2>

        {/* Comment Composer */}
        {isAuthenticated ? (
          <form onSubmit={handleComment} className="flex items-center gap-3">
            <input 
              type="text"
              placeholder="Write a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="flex-1 bg-hub-surface-elevated border border-hub-border text-xs text-hub-text-primary placeholder:text-hub-text-tertiary rounded-2xl px-4 py-3 outline-none focus:border-hub-accent"
            />
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isSubmittingComment || !commentText.trim()}
              icon={Send}
            >
              Post
            </Button>
          </form>
        ) : (
          <div className="p-4 rounded-2xl bg-hub-surface-elevated text-center text-xs text-hub-text-secondary">
            Please <Link to="/login" className="text-hub-accent font-bold hover:underline">sign in</Link> to join the conversation.
          </div>
        )}

        {/* Comments Feed */}
        <div className="space-y-3 pt-2">
          {comments.length > 0 ? (
            comments.map((c, i) => (
              <div key={c._id || i} className="p-4 rounded-2xl bg-hub-surface-elevated border border-hub-border space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <UserAvatar 
                      src={c.author?.avatar} 
                      name={c.author?.displayName || c.author?.username} 
                      size="xs" 
                    />
                    <span className="font-bold text-xs text-hub-text-primary">@{c.author?.username || 'member'}</span>
                  </div>
                  <span className="text-[10px] font-mono-code text-hub-text-tertiary">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-hub-text-secondary leading-relaxed pl-7">
                  {c.body}
                </p>
              </div>
            ))
          ) : (
            <p className="text-xs text-hub-text-tertiary text-center py-6">No comments yet. Be the first to start the conversation!</p>
          )}
        </div>
      </div>
    </div>
  );
}
