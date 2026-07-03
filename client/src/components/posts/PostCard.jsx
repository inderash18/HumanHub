import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiHeart, 
  FiMessageCircle, 
  FiShare2, 
  FiBookmark, 
  FiShield, 
  FiChevronLeft, 
  FiChevronRight,
  FiMoreHorizontal
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { formatRelativeTime } from '../../utils/formatters';
import VerificationReportModal from '../moderation/VerificationReportModal';
import ShareSheetModal from '../ui/ShareSheetModal';

export default function PostCard({ post, isDetail = false }) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likesCount, setLikesCount] = useState(post.upvotes || 0);
  const [currentImgIdx, setCurrentImgIdx] = useState(0);
  const [showReport, setShowReport] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  if (!post) return null;

  const textScore = post.detectionScores?.text?.score || 0;
  const imageScore = post.detectionScores?.image?.score || 0;
  const combinedScore = (textScore + imageScore) / (post.mediaUrls?.length ? 2 : 1);
  const authenticityScore = Math.max(0, Math.min(100, Math.round((1 - combinedScore) * 100)));

  const handleLike = async (e) => {
    e.preventDefault();
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikesCount(prev => wasLiked ? prev - 1 : prev + 1);
    
    try {
      const { votePost } = await import('../../services/postService');
      await votePost(post._id, wasLiked ? 0 : 1);
      if (!wasLiked && navigator.vibrate) navigator.vibrate(10); // Subtle haptic tap
    } catch (err) {
      // Revert on failure
      setLiked(wasLiked);
      setLikesCount(prev => wasLiked ? prev : prev - 1);
      toast.error('Could not sync like. Try again.');
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    const nextSaved = !saved;
    setSaved(nextSaved);
    toast.success(nextSaved ? 'Saved to collection!' : 'Removed from saved collection.', { icon: '🔖' });
  };

  const handleShare = (e) => {
    e.preventDefault();
    setShowShareModal(true);
  };

  // Image Carousel Slide Handlers
  const handlePrevImg = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (currentImgIdx > 0) setCurrentImgIdx(prev => prev - 1);
  };

  const handleNextImg = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (currentImgIdx < post.mediaUrls.length - 1) setCurrentImgIdx(prev => prev + 1);
  };

  // Parses dynamic adjustments metadata from media URL hash query
  const parseImageHash = (url) => {
    if (!url) return {};
    const hashIndex = url.indexOf('#');
    if (hashIndex === -1) return {};
    const hash = url.substring(hashIndex + 1);
    const params = new URLSearchParams(hash);
    
    const brightness = params.get('brightness') || 1;
    const contrast = params.get('contrast') || 1;
    const saturation = params.get('saturation') || 1;
    const rotate = params.get('rotate') || 0;
    const filter = params.get('filter') || 'none';
    
    let filterStr = '';
    if (filter !== 'none') {
        filterStr += decodeURIComponent(filter) + ' ';
    }
    filterStr += `brightness(${brightness}) contrast(${contrast}) saturate(${saturation})`;
    
    return {
        filter: filterStr,
        transform: `rotate(${rotate}deg)`,
        transition: 'filter 150ms ease'
    };
  };

  return (
    <div className="premium-card p-5 flex flex-col gap-4 bg-[var(--surface-color)] transition-all">
      {/* Header section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar frame */}
          <div className="w-10 h-10 rounded-full bg-[var(--surface-hover)] border border-[var(--border-color)] overflow-hidden flex items-center justify-center">
            {post.author?.avatar ? (
              <img src={post.author.avatar} className="w-full h-full object-cover" alt="" />
            ) : (
              <span className="text-[var(--text-primary)] font-bold text-xs uppercase">{post.author?.username?.[0]}</span>
            )}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <Link to={`/u/${post.author?.username}`} className="text-xs font-bold text-[var(--text-primary)] hover:underline">
                {post.author?.username}
              </Link>
              {/* Green Verified shield */}
              {authenticityScore > 60 && (
                <span className="text-[10px] text-[var(--verified-color)] font-bold uppercase tracking-wider flex items-center gap-0.5">
                  <FiShield className="fill-current text-[var(--verified-color)]" />
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-secondary)] font-medium">
              {post.community && (
                <>
                  <Link to={`/c/${post.community.slug}`} className="hover:text-[var(--text-primary)] transition-colors">
                    d/{post.community.slug}
                  </Link>
                  <span>•</span>
                </>
              )}
              <span>{formatRelativeTime(post.createdAt)}</span>
            </div>
          </div>
        </div>
 
        {/* Human verified badge widget */}
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowReport(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[9px] font-extrabold uppercase tracking-widest transition-all ${
              authenticityScore >= 70
                ? 'bg-emerald-500/5 border-emerald-500/20 text-[var(--verified-color)]'
                : authenticityScore >= 40
                ? 'bg-amber-500/5 border-amber-500/20 text-[var(--warning-color)]'
                : 'bg-rose-500/5 border-rose-500/20 text-[var(--rejected-color)]'
            }`}
          >
            <FiShield className="text-xs" />
            <span>{authenticityScore}% Human</span>
          </button>
 
          <button className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            <FiMoreHorizontal className="text-lg" />
          </button>
        </div>
      </div>
 
      {/* Post Title & Text Body */}
      <div className="flex flex-col gap-2">
        <Link to={`/p/${post._id}`}>
          <h3 className="text-md font-bold font-brand tracking-wide text-[var(--text-primary)] leading-snug hover:text-[var(--brand-color)] transition-colors">
            {post.title}
          </h3>
        </Link>
        {post.body && (
          <p className={`text-xs text-[var(--text-secondary)] leading-relaxed ${!isDetail && 'line-clamp-3'}`}>
            {post.body.replace(/<[^>]*>?/gm, '')}
          </p>
        )}
      </div>
 
      {/* Media gallery with swiping capabilities */}
      {post.mediaUrls && post.mediaUrls.length > 0 && (
        <div className="relative rounded-[16px] overflow-hidden border border-[var(--border-color)] group select-none bg-black">
          <div className="relative aspect-video w-full flex items-center justify-center overflow-hidden">
            <img 
              src={post.mediaUrls[currentImgIdx]} 
              style={parseImageHash(post.mediaUrls[currentImgIdx])}
              className="w-full h-full object-contain" 
              alt="" 
            />

            {/* Slider arrows */}
            {post.mediaUrls.length > 1 && (
              <>
                {currentImgIdx > 0 && (
                  <button 
                    onClick={handlePrevImg}
                    className="absolute left-3 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-all z-10 opacity-0 group-hover:opacity-100"
                  >
                    <FiChevronLeft className="text-sm" />
                  </button>
                )}
                {currentImgIdx < post.mediaUrls.length - 1 && (
                  <button 
                    onClick={handleNextImg}
                    className="absolute right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-all z-10 opacity-0 group-hover:opacity-100"
                  >
                    <FiChevronRight className="text-sm" />
                  </button>
                )}
              </>
            )}
          </div>

          {/* Carousel dot indicators */}
          {post.mediaUrls.length > 1 && (
            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
              {post.mediaUrls.map((_, idx) => (
                <div 
                  key={idx}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    idx === currentImgIdx ? 'bg-white w-3' : 'bg-white/40'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Engagement Floor Actions */}
      <div className="flex items-center justify-between border-t border-[var(--border-color)] pt-3.5 mt-1">
        <div className="flex items-center gap-5">
          {/* Like */}
          <button 
            onClick={handleLike}
            className={`flex items-center gap-2 text-xs font-semibold transition-all ${
              liked ? 'text-rose-500' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <motion.span whileTap={{ scale: 1.4 }} className="text-lg">
              <FiHeart className={liked ? 'fill-current text-rose-500' : ''} />
            </motion.span>
            <span>{likesCount}</span>
          </button>

          {/* Comment */}
          <Link 
            to={`/p/${post._id}`}
            className="flex items-center gap-2 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <FiMessageCircle className="text-lg" />
            <span>{post.comments?.length || 0}</span>
          </Link>

          {/* Share */}
          <button 
            onClick={handleShare}
            className="flex items-center gap-2 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <FiShare2 className="text-lg" />
          </button>
        </div>

        {/* Save Bookmark */}
        <button 
          onClick={handleSave}
          className={`text-xs font-semibold transition-all ${
            saved ? 'text-amber-500' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <FiBookmark className={`text-lg ${saved ? 'fill-current text-amber-500' : ''}`} />
        </button>
      </div>

      {/* Detailed Verification Report Modal */}
      <AnimatePresence>
        {showReport && (
          <VerificationReportModal 
            isOpen={showReport} 
            onClose={() => setShowReport(false)} 
            post={post}
            authenticityScore={authenticityScore}
          />
        )}
      </AnimatePresence>

      {/* Share Sheet Modal */}
      <AnimatePresence>
        {showShareModal && (
          <ShareSheetModal 
            isOpen={showShareModal} 
            onClose={() => setShowShareModal(false)} 
            postId={post._id} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
