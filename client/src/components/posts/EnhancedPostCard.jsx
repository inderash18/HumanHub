import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FaHeart, FaComment, FaShareAlt, FaPlus, FaChevronDown, FaCheckCircle, FaRobot, FaFingerprint } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

/**
 * 💎 ULTRA-PROFESSIONAL POSTCARD (International Engineering Standard)
 * - Design Paradigm: High-End Glassmorphism & Minimalist Structure
 * - Interaction: Tactile Haptic Feedback (Animations) & Double-Tap Upvote
 * - Visuals: Precise spacing, refined typography, and high-fidelity micro-details.
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🧪 UTILS & CONSTANTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const TRANSITION_SMOOTH = { type: 'spring', damping: 25, stiffness: 200 };
const BEZIER_EASE = [0.19, 1, 0.22, 1];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🧩 SUB-COMPONENTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * VerificationBadge: Re-engineered with high-fidelity "holographic" scanning effect.
 */
const HumanShield = ({ status = 'pending' }) => {
  const config = {
    published: { 
        label: 'Verified Human', 
        color: '#00FFA3', 
        bg: 'rgba(0, 255, 163, 0.03)',
        border: 'rgba(0, 255, 163, 0.15)',
        icon: <FaFingerprint /> 
    },
    rejected: { 
        label: 'Synthetic Signal', 
        color: '#FF3B3B', 
        bg: 'rgba(255, 59, 59, 0.03)',
        border: 'rgba(255, 59, 59, 0.15)',
        icon: <FaRobot /> 
    },
    pending: { 
        label: 'Analyzing Pulse', 
        color: '#FFD600', 
        bg: 'rgba(255, 214, 0, 0.03)',
        border: 'rgba(255, 214, 0, 0.15)',
        icon: <FaChevronDown className="animate-bounce" /> 
    }
  };

  const style = config[status] || config.pending;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border backdrop-blur-md"
      style={{ 
        backgroundColor: style.bg, 
        borderColor: style.border, 
        color: style.color,
        boxShadow: `inset 0 0 10px ${style.bg}`
      }}
    >
      <span className="text-[14px]">{style.icon}</span>
      <span className="text-[10px] font-black uppercase tracking-[2px] font-outfit">{style.label}</span>
      {status === 'published' && <FaCheckCircle className="text-[12px] opacity-80" />}
    </motion.div>
  );
};

/**
 * MediaEngine: Specialized handling for high-res grids and interactive taps.
 */
const MediaEngine = ({ urls, onDoubleTap }) => {
  const [tapEffect, setTapEffect] = useState(false);
  let timer = useRef(null);

  const handleTap = () => {
    if (timer.current) {
        clearTimeout(timer.current);
        timer.current = null;
        setTapEffect(true);
        onDoubleTap();
        setTimeout(() => setTapEffect(false), 1000);
    } else {
        timer.current = setTimeout(() => { timer.current = null; }, 300);
    }
  };

  if (!urls || urls.length === 0) return null;

  return (
    <div 
        className="relative mt-5 mb-2 overflow-hidden rounded-2xl group/media cursor-none"
        onClick={handleTap}
        style={{ border: '1px solid rgba(255,255,255,0.04)' }}
    >
      <AnimatePresence>
        {tapEffect && (
          <motion.div 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: [0.5, 1.2, 1], opacity: [0, 1, 0] }}
            className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none"
          >
            <FaHeart className="text-white text-8xl drop-shadow-[0_0_50px_rgba(255,69,0,1)]" />
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`grid gap-1 ${urls.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {urls.slice(0, 4).map((url, i) => (
          <div key={url} className={`relative overflow-hidden ${urls.length === 3 && i === 0 ? 'col-span-2' : ''}`}>
             <motion.img 
                whileHover={{ scale: 1.03 }}
                transition={{ duration: 0.8, ease: BEZIER_EASE }}
                src={url} 
                className="w-full h-full object-cover max-h-[640px]" 
                alt="" 
             />
             <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40 pointer-events-none" />
          </div>
        ))}
      </div>

      {/* Glassy Custom Cursor Placeholder (Invisible in actual CSS, but concept here) */}
      <div className="absolute inset-0 bg-white/0 group-hover/media:bg-white/[0.01] transition-colors pointer-events-none" />
    </div>
  );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🏗️ MAIN COMPONENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function PostCard({ post }) {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(post.upvotes || 0);

  const toggleLike = async () => {
    const wasLiked = liked;
    const newLiked = !wasLiked;
    
    // Optimistic UI
    setLiked(newLiked);
    setLikes(prev => wasLiked ? prev - 1 : prev + 1);
    
    try {
        // Call actual backend API
        const { votePost } = await import('../../services/postService');
        await votePost(post._id, newLiked ? 1 : 0);
        
        if (newLiked && navigator.vibrate) navigator.vibrate(10);
    } catch (err) {
        // Revert on failure
        setLiked(wasLiked);
        setLikes(prev => wasLiked ? prev : prev - 1);
        toast.error('Sync failed. Please check your connection.');
    }
  };

  if (!post) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.6, ease: BEZIER_EASE }}
      className="w-full max-w-2xl mx-auto mb-10 overflow-hidden"
    >
      <div 
        className="relative group bg-[#080808] border border-white/[0.05] rounded-[32px] p-6 transition-all duration-700 hover:bg-[#0A0A0A] hover:border-white/[0.12]"
        style={{ boxShadow: '0 40px 100px -20px rgba(0,0,0,0.8)' }}
      >
        {/* Subtle Ambient Glow */}
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-brand-color/5 blur-[120px] rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

        {/* Header Section */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-full p-[2.5px] bg-gradient-to-tr from-[#ff4500] via-[#ff8c00] to-[#ffd700]">
                 <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden border-[2.5px] border-black">
                    {post.author?.avatar ? (
                        <img src={post.author.avatar} className="w-full h-full object-cover" alt="" />
                    ) : (
                        <span className="text-[16px] font-black text-white font-outfit">{post.author?.username?.[0].toUpperCase()}</span>
                    )}
                 </div>
              </div>
              <div className="absolute -bottom-1 -right-1 bg-[#00FFA3] w-4 h-4 rounded-full border-[3px] border-[#080808] flex items-center justify-center shadow-lg">
                <div className="w-1 h-1 bg-white rounded-full animate-ping" />
              </div>
            </div>
            
            <div className="flex flex-col">
              <Link to={`/u/${post.author?.username}`} className="text-[15px] font-bold text-white tracking-[-0.2px] hover:text-brand-color transition-colors flex items-center gap-1.5 font-outfit">
                {post.author?.username}
                <FaCheckCircle className="text-blue-500 text-[12px]" />
              </Link>
              <div className="flex items-center gap-2 text-[11px] text-zinc-500 font-medium">
                <Link to={`/c/${post.community?.slug}`} className="hover:text-white transition-colors">dH/{post.community?.slug}</Link>
                <span>•</span>
                <span className="opacity-60">{new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          </div>
          
          <button className="w-10 h-10 rounded-full flex items-center justify-center text-zinc-500 hover:bg-white/5 hover:text-white transition-all">
             <FaPlus />
          </button>
        </div>

        {/* Content Section */}
        <div className="space-y-3">
          <h2 className="text-[22px] font-bold text-white leading-[1.2] tracking-[-0.03em] font-outfit group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-zinc-500 transition-all duration-700">
            {post.title}
          </h2>
          {post.body && (
            <p className="text-[15px] text-zinc-400 leading-[1.6] font-medium line-clamp-3">
              {post.body.replace(/<[^>]*>?/gm, '')}
            </p>
          )}
        </div>

        {/* Media Block */}
        <MediaEngine urls={post.mediaUrls} onDoubleTap={toggleLike} />

        {/* Engagement Floor */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/[0.03]">
          <div className="flex items-center gap-6">
            <button 
              onClick={toggleLike}
              className="group/btn flex items-center gap-2.5 text-zinc-400 transition-all hover:text-white"
            >
              <div className={`p-2 rounded-xl transition-all ${liked ? 'bg-[#ff4500]/10 text-[#ff4500]' : 'group-hover/btn:bg-white/5'}`}>
                {liked ? <FaHeart className="text-[18px]" /> : <FaHeart className="text-[18px] opacity-40" />}
              </div>
              <span className={`text-[13px] font-bold font-mono tracking-tighter ${liked ? 'text-white' : ''}`}>{likes}</span>
            </button>

            <button className="group/btn flex items-center gap-2.5 text-zinc-400 transition-all hover:text-white">
              <div className="p-2 rounded-xl group-hover/btn:bg-white/5 transition-all">
                <FaComment className="text-[18px] opacity-40" />
              </div>
              <span className="text-[13px] font-bold font-mono tracking-tighter">{post.comments?.length || 0}</span>
            </button>

            <button className="group/btn flex items-center gap-2.5 text-zinc-400 transition-all hover:text-white">
              <div className="p-2 rounded-xl group-hover/btn:bg-white/5 transition-all">
                <FaShareAlt className="text-[18px] opacity-40" />
              </div>
            </button>
          </div>

          <HumanShield status={post.status} />
        </div>
      </div>
    </motion.div>
  );
}
