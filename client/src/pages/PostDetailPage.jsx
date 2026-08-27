import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  IoHeartOutline, IoHeart, 
  IoChatbubbleOutline, 
  IoPaperPlaneOutline, 
  IoBookmarkOutline, IoBookmark,
  IoEllipsisHorizontal,
  IoHappyOutline,
  IoShieldCheckmark
} from 'react-icons/io5';
import { MdVerified } from 'react-icons/md';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '../store/useAuthStore';
import api from '../services/api';

export default function PostDetailPage() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([]);

  useEffect(() => {
    fetchPost();
  }, [id]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/posts/${id}`);
      const postData = res.data;
      setPost(postData);
      setComments(postData.comments || []);
    } catch (err) {
      toast.error('Post not found');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    setIsLiked(!isLiked);
    try {
      await api.post(`/posts/${id}/vote`, { direction: !isLiked ? 1 : 0 });
    } catch (err) {
      console.log('Liked');
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      const res = await api.post('/comments', {
        postId: id,
        body: commentText.trim()
      });

      const newC = res.data || {
        _id: Date.now().toString(),
        body: commentText.trim(),
        author: { username: user?.username || 'you', avatar: user?.avatar }
      };

      setComments((prev) => [...prev, newC]);
      setCommentText('');
      toast.success('Comment added');
    } catch (err) {
      toast.error('Failed to post comment');
    }
  };

  if (loading) {
    return (
      <div className="w-full h-[80vh] flex items-center justify-center">
        <IoShieldCheckmark className="text-5xl text-[#262626] animate-pulse" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-center py-20 text-[#737373]">
        <h3 className="text-lg font-bold text-white mb-1">Post not found</h3>
        <Link to="/" className="text-[#0095f6] text-xs font-semibold">Back to feed</Link>
      </div>
    );
  }

  const author = post.author || {};
  const mediaUrl = post.mediaUrls && post.mediaUrls.length > 0 ? post.mediaUrls[0] : null;

  return (
    <div className="w-full max-w-[975px] mx-auto px-4 py-8 select-none">
      <div className="w-full bg-black border border-[#262626] rounded-xl overflow-hidden flex flex-col md:flex-row max-h-[85vh] shadow-2xl">
        {/* Left Media Column */}
        <div className="flex-1 bg-[#121212] flex items-center justify-center overflow-hidden min-h-[380px]">
          {mediaUrl ? (
            <img 
              src={mediaUrl} 
              alt={post.title} 
              className="w-full h-full object-contain max-h-[85vh]"
            />
          ) : (
            <div className="p-8 text-center flex flex-col items-center">
              <IoShieldCheckmark className="text-5xl text-[#0095f6] mb-3" />
              <p className="text-lg text-white font-medium">{post.title || post.body}</p>
            </div>
          )}
        </div>

        {/* Right Info & Comments Column */}
        <div className="w-full md:w-[400px] flex flex-col justify-between border-t md:border-t-0 md:border-l border-[#262626] bg-black">
          {/* Header */}
          <div className="h-16 border-b border-[#262626] px-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to={`/u/${author.username}`} className="story-ring-active p-[1.5px]">
                <img 
                  src={author.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} 
                  alt={author.username} 
                  className="w-8 h-8 rounded-full object-cover bg-black"
                />
              </Link>
              <div className="flex items-center gap-1.5">
                <Link to={`/u/${author.username}`} className="text-sm font-semibold text-white hover:underline">
                  {author.username}
                </Link>
                <MdVerified className="text-[#0095f6] text-sm" />
                <span className="text-xs text-[#00ba7c] font-medium">• Verified Human</span>
              </div>
            </div>

            <button className="text-white hover:opacity-70 text-lg">
              <IoEllipsisHorizontal />
            </button>
          </div>

          {/* Comments & Caption Stream */}
          <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4 text-sm leading-relaxed">
            {/* Author Caption */}
            <div className="flex items-start gap-3">
              <img 
                src={author.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} 
                alt={author.username} 
                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
              />
              <div>
                <span className="font-semibold text-white mr-2">{author.username}</span>
                <span className="text-[#f5f5f5]">{post.body || post.title}</span>
                <div className="text-xs text-[#737373] mt-1">3h • Proof of Humanity Verified</div>
              </div>
            </div>

            {/* Comment List */}
            {comments.map((c) => (
              <div key={c._id} className="flex items-start gap-3">
                <img 
                  src={c.author?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} 
                  alt={c.author?.username} 
                  className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                />
                <div className="flex-1">
                  <span className="font-semibold text-white mr-2">{c.author?.username || 'member'}</span>
                  <span className="text-[#f5f5f5]">{c.body}</span>
                  <div className="flex items-center gap-4 text-xs text-[#737373] mt-1">
                    <span>1h</span>
                    <button className="hover:text-white font-semibold">Reply</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Action Bar & Input Footer */}
          <div className="border-t border-[#262626] p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between text-2xl">
              <div className="flex items-center gap-4">
                <button 
                  onClick={handleLike}
                  className={`hover:opacity-70 ${isLiked ? 'text-[#ff3040]' : 'text-white'}`}
                >
                  {isLiked ? <IoHeart /> : <IoHeartOutline />}
                </button>
                <button className="text-white hover:opacity-70"><IoChatbubbleOutline /></button>
                <button className="text-white hover:opacity-70"><IoPaperPlaneOutline /></button>
              </div>
              <button 
                onClick={() => setIsSaved(!isSaved)}
                className="text-white hover:opacity-70"
              >
                {isSaved ? <IoBookmark /> : <IoBookmarkOutline />}
              </button>
            </div>

            <div className="text-sm font-semibold text-white">
              {(post.upvotes || 0) + (isLiked ? 1 : 0)} likes
            </div>
            <div className="text-[11px] text-[#737373] uppercase tracking-wider">
              3 hours ago
            </div>

            {/* Inline Comment Bar */}
            <form onSubmit={handleCommentSubmit} className="flex items-center gap-2 pt-2 border-t border-[#262626]/60 mt-2">
              <IoHappyOutline className="text-2xl text-white hover:opacity-70 cursor-pointer" />
              <input 
                type="text"
                placeholder="Add a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="flex-1 bg-transparent text-sm text-white placeholder-[#737373] outline-none"
              />
              {commentText.trim() && (
                <button type="submit" className="text-sm font-bold text-[#0095f6] hover:text-white">
                  Post
                </button>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
