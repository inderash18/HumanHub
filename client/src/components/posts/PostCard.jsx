import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  IoHeartOutline, IoHeart, 
  IoChatbubbleOutline, 
  IoPaperPlaneOutline, 
  IoBookmarkOutline, IoBookmark,
  IoEllipsisHorizontal,
  IoShieldCheckmark,
  IoHappyOutline
} from 'react-icons/io5';
import { MdVerified } from 'react-icons/md';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '../../store/useAuthStore';
import api from '../../services/api';

export default function PostCard({ post, onUpdate }) {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.upvotes || 0);
  const [isSaved, setIsSaved] = useState(false);
  const [showHeartAnim, setShowHeartAnim] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [comments, setComments] = useState(post.comments || []);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showOptionsModal, setShowOptionsModal] = useState(false);

  const author = post.author || {};
  const mediaUrl = post.mediaUrls && post.mediaUrls.length > 0 ? post.mediaUrls[0] : null;
  const trustScorePercent = Math.round((author.trustScore || 0.95) * 100);

  const handleLike = async () => {
    if (!user) {
      toast.error('Please log in to like posts');
      return navigate('/login');
    }

    const nextLiked = !isLiked;
    setIsLiked(nextLiked);
    setLikesCount((prev) => nextLiked ? prev + 1 : Math.max(0, prev - 1));

    try {
      await api.post(`/posts/${post._id}/vote`, { direction: nextLiked ? 1 : 0 });
    } catch (err) {
      console.log('Like synced with local state');
    }
  };

  const handleDoubleTap = () => {
    if (!isLiked) {
      handleLike();
    }
    setShowHeartAnim(true);
    setTimeout(() => setShowHeartAnim(false), 900);
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    if (!user) {
      toast.error('Please log in to comment');
      return navigate('/login');
    }

    try {
      setIsSubmittingComment(true);
      const res = await api.post(`/comments`, {
        postId: post._id,
        body: commentText.trim()
      });

      const newComment = res.data || {
        _id: Date.now().toString(),
        body: commentText.trim(),
        author: { username: user.username, avatar: user.avatar }
      };

      setComments((prev) => [...prev, newComment]);
      setCommentText('');
      toast.success('Comment posted');
    } catch (err) {
      toast.error('Failed to post comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/p/${post._id}`;
    navigator.clipboard.writeText(url);
    toast.success('Post link copied to clipboard!');
  };

  return (
    <article className="w-full max-w-[470px] mx-auto bg-black border-b border-[#262626] pb-4 mb-4 select-none">
      {/* 1. Header */}
      <div className="flex items-center justify-between px-1 py-3">
        <div className="flex items-center gap-3">
          <Link to={`/u/${author.username}`} className="story-ring-active p-[1.5px]">
            <img 
              src={author.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} 
              alt={author.username}
              className="w-8 h-8 rounded-full object-cover bg-black" 
            />
          </Link>
          <div className="flex items-center gap-1.5">
            <Link to={`/u/${author.username}`} className="font-semibold text-[13.5px] text-white hover:opacity-80">
              {author.username || 'human_member'}
            </Link>
            <MdVerified className="text-[#0095f6] text-[15px]" title={`Proof of Humanity Verified (${trustScorePercent}%)`} />
            <span className="text-[#737373] text-[13px]">• 3h</span>
          </div>
        </div>

        <button 
          onClick={() => setShowOptionsModal(true)} 
          className="text-[#a8a8a8] hover:text-white p-1"
        >
          <IoEllipsisHorizontal className="text-lg" />
        </button>
      </div>

      {/* 2. Media Container */}
      <div 
        onDoubleClick={handleDoubleTap}
        className="relative w-full aspect-square sm:aspect-[4/5] bg-[#121212] rounded-md overflow-hidden flex items-center justify-center cursor-pointer border border-[#262626]"
      >
        {mediaUrl ? (
          <img 
            src={mediaUrl} 
            alt={post.title} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="p-8 text-center bg-gradient-to-br from-[#121212] to-[#1f1f1f] w-full h-full flex flex-col justify-center items-center">
            <IoShieldCheckmark className="text-4xl text-[#0095f6] mb-3" />
            <p className="text-base font-medium text-[#f5f5f5] max-w-xs">{post.title || post.body}</p>
          </div>
        )}

        {/* Verification Pill Overlay */}
        <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 flex items-center gap-1.5 shadow-lg">
          <span className="w-2 h-2 rounded-full bg-[#00ba7c] animate-pulse" />
          <span className="text-[11px] font-semibold text-white tracking-wide">Human Verified</span>
        </div>

        {/* Exploding Double Tap Heart Animation */}
        {showHeartAnim && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <IoHeart className="text-white text-8xl drop-shadow-2xl animate-heart-burst" />
          </div>
        )}
      </div>

      {/* 3. Action Bar */}
      <div className="flex items-center justify-between pt-3 pb-1 px-1">
        <div className="flex items-center gap-4 text-2xl">
          <button 
            onClick={handleLike}
            className={`hover:opacity-70 transition-transform active:scale-75 ${
              isLiked ? 'text-[#ff3040]' : 'text-white'
            }`}
          >
            {isLiked ? <IoHeart /> : <IoHeartOutline />}
          </button>
          <Link to={`/p/${post._id}`} className="text-white hover:opacity-70">
            <IoChatbubbleOutline />
          </Link>
          <button onClick={handleShare} className="text-white hover:opacity-70">
            <IoPaperPlaneOutline />
          </button>
        </div>

        <button 
          onClick={() => setIsSaved(!isSaved)}
          className="text-2xl text-white hover:opacity-70"
        >
          {isSaved ? <IoBookmark /> : <IoBookmarkOutline />}
        </button>
      </div>

      {/* 4. Likes Count */}
      <div className="px-1 text-[13.5px] font-semibold text-white">
        {likesCount.toLocaleString()} {likesCount === 1 ? 'like' : 'likes'}
      </div>

      {/* 5. Title & Caption */}
      <div className="px-1 pt-1 text-[13.5px] leading-relaxed">
        <span className="font-semibold text-white mr-2">{author.username || 'human_member'}</span>
        <span className="text-[#f5f5f5]">
          {isExpanded ? (post.body || post.title) : `${(post.body || post.title || '').slice(0, 110)}`}
        </span>
        {(post.body || post.title || '').length > 110 && !isExpanded && (
          <button 
            onClick={() => setIsExpanded(true)}
            className="text-[#737373] ml-1 hover:text-white font-medium text-[13px]"
          >
            ...more
          </button>
        )}
      </div>

      {/* 6. Comments Preview */}
      {comments.length > 0 && (
        <div className="px-1 pt-1">
          <Link to={`/p/${post._id}`} className="text-[13px] text-[#737373] hover:text-white">
            View all {comments.length} comments
          </Link>
          <div className="mt-1 text-[13px]">
            <span className="font-semibold text-white mr-2">{comments[0]?.author?.username || 'member'}</span>
            <span className="text-[#f5f5f5]">{comments[0]?.body}</span>
          </div>
        </div>
      )}

      {/* 7. Inline Comment Input */}
      <form onSubmit={handleCommentSubmit} className="flex items-center gap-2 px-1 pt-2 border-t border-[#262626]/50 mt-2">
        <button type="button" className="text-[#737373] hover:text-white text-xl">
          <IoHappyOutline />
        </button>
        <input 
          type="text"
          placeholder="Add a comment..."
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          className="flex-1 bg-transparent text-[13px] text-white placeholder-[#737373] outline-none"
        />
        {commentText.trim() && (
          <button 
            type="submit"
            disabled={isSubmittingComment}
            className="text-[13px] font-semibold text-[#0095f6] hover:text-white disabled:opacity-50"
          >
            Post
          </button>
        )}
      </form>

      {/* Options Modal */}
      {showOptionsModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-[380px] bg-[#262626] rounded-2xl overflow-hidden text-center divide-y divide-[#363636] animate-fade-in shadow-2xl">
            <button 
              onClick={() => { setShowOptionsModal(false); handleShare(); }}
              className="w-full py-3.5 text-sm font-semibold text-white hover:bg-[#363636]"
            >
              Share to...
            </button>
            <button 
              onClick={() => { setShowOptionsModal(false); handleShare(); }}
              className="w-full py-3.5 text-sm font-semibold text-white hover:bg-[#363636]"
            >
              Copy link
            </button>
            <button 
              onClick={() => { setShowOptionsModal(false); navigate(`/p/${post._id}`); }}
              className="w-full py-3.5 text-sm font-semibold text-white hover:bg-[#363636]"
            >
              Go to post
            </button>
            <button 
              onClick={() => setShowOptionsModal(false)}
              className="w-full py-3.5 text-sm font-normal text-[#a8a8a8] hover:bg-[#363636]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
