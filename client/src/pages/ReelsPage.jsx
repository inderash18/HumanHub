import { useState, useEffect } from 'react';
import { FiFilm, FiHeart, FiMessageCircle, FiShare2, FiBookmark, FiVolume2, FiVolumeX, FiShield } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import api from '../services/api';
import Spinner from '../components/ui/Spinner';

export default function ReelsPage() {
    const [reels, setReels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [muted, setMuted] = useState(true);
    const [likedState, setLikedState] = useState({});
    const [savedState, setSavedState] = useState({});
    const [lastClickTimes, setLastClickTimes] = useState({});
    const [heartAnim, setHeartAnim] = useState({});

    useEffect(() => {
        const fetchReels = async () => {
            try {
                const res = await api.get('/posts');
                const postsList = res.data.posts || res.data || [];
                
                const mapped = postsList.map(p => ({
                    id: p._id,
                    username: p.author?.username || 'human_hub',
                    avatar: p.author?.avatar || '',
                    videoUrl: p.mediaUrls?.find(url => url.endsWith('.mp4')) || 'https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-sign-in-front-of-a-mirror-41870-large.mp4',
                    caption: p.title + ' ' + (p.body || ''),
                    likes: p.upvotes || 0,
                    comments: p.comments?.length || 0,
                    trustScore: p.author?.trustScore || 0.95
                }));
                setReels(mapped);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchReels();
    }, []);

    const toggleLike = (id) => {
        setLikedState(prev => ({ ...prev, [id]: !prev[id] }));
        if (!likedState[id]) {
            toast.success('Reel upvoted!', { icon: '🔥' });
        }
    };

    const toggleSave = (id) => {
        setSavedState(prev => ({ ...prev, [id]: !prev[id] }));
        toast.success(savedState[id] ? 'Removed from collections.' : 'Reel saved!', { icon: '🔖' });
    };

    const handleVideoClick = (e, reelId) => {
        const currentTime = new Date().getTime();
        const lastClickTime = lastClickTimes[reelId] || 0;
        
        if (currentTime - lastClickTime < 300) {
            if (!likedState[reelId]) {
                toggleLike(reelId);
            }
            setHeartAnim(prev => ({ ...prev, [reelId]: true }));
            setTimeout(() => {
                setHeartAnim(prev => ({ ...prev, [reelId]: false }));
            }, 800);
        }
        
        setLastClickTimes(prev => ({ ...prev, [reelId]: currentTime }));
    };

    return (
        <div className="w-full max-w-[420px] mx-auto flex flex-col gap-4 py-2 px-1 select-none">
            {/* Page Header */}
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
                <div className="flex items-center gap-2">
                    <FiFilm className="text-xl text-[var(--brand-color)]" />
                    <span className="font-brand text-lg font-black tracking-tight text-[var(--text-primary)]">Reels</span>
                </div>
                <button 
                    onClick={() => setMuted(!muted)} 
                    className="p-2 bg-[var(--surface-hover)] border border-[var(--border-color)] rounded-full text-[var(--text-primary)] hover:scale-105 transition-transform"
                >
                    {muted ? <FiVolumeX className="text-sm" /> : <FiVolume2 className="text-sm" />}
                </button>
            </div>

            {/* Viewport content swiper */}
            {loading ? (
                <div className="flex flex-col items-center justify-center p-40 gap-3">
                    <Spinner size="lg" />
                    <span className="text-[9px] font-extrabold uppercase tracking-widest text-[var(--text-secondary)]">Assembling streams...</span>
                </div>
            ) : reels.length === 0 ? (
                <div className="text-center p-20 border border-[var(--border-color)] border-dashed rounded-[24px] bg-[var(--surface-color)]/25">
                    <span className="text-3xl opacity-20">🎥</span>
                    <h4 className="font-bold text-[var(--text-primary)] text-xs uppercase mt-3 tracking-wider">No video reels matching</h4>
                    <p className="text-[var(--text-secondary)] text-[11px] mt-1">Be the first to upload an MP4 verified signal block.</p>
                </div>
            ) : (
                <div className="h-[75vh] w-full snap-y snap-mandatory overflow-y-scroll no-scrollbar rounded-[24px] border border-[var(--border-color)] bg-black shadow-lg">
                    {reels.map((reel) => {
                        const isLiked = !!likedState[reel.id];
                        const isSaved = !!savedState[reel.id];
                        const hasHeart = !!heartAnim[reel.id];

                        return (
                            <div 
                                key={reel.id} 
                                onClick={(e) => handleVideoClick(e, reel.id)}
                                className="relative w-full h-[75vh] snap-start bg-black flex flex-col justify-between overflow-hidden cursor-pointer"
                            >
                                <div className="absolute inset-0 z-0">
                                    <video 
                                        src={reel.videoUrl} 
                                        autoPlay 
                                        loop 
                                        muted={muted}
                                        playsInline
                                        className="w-full h-full object-cover opacity-90"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/35 pointer-events-none" />
                                </div>

                                <AnimatePresence>
                                    {hasHeart && (
                                        <motion.div 
                                            initial={{ scale: 0, opacity: 0 }}
                                            animate={{ scale: [0, 1.4, 1.1], opacity: [0, 1, 0] }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.7 }}
                                            className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
                                        >
                                            <FiHeart className="text-6xl text-white fill-current drop-shadow-xl" />
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between text-white">
                                    <div className="flex items-center gap-2.5 bg-black/25 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/5">
                                        {reel.avatar ? (
                                            <img src={reel.avatar} alt="" className="w-7 h-7 rounded-full border border-white/20 object-cover" />
                                        ) : (
                                            <div className="w-7 h-7 rounded-full bg-[var(--surface-hover)]/30 border border-white/10 flex items-center justify-center font-bold text-[9px] text-white uppercase select-none">
                                                {reel.username?.[0]}
                                            </div>
                                        )}
                                        <span className="text-xs font-extrabold font-brand tracking-wide flex items-center gap-1">
                                            {reel.username}
                                            {reel.trustScore > 0.7 && (
                                                <FiShield className="text-[9px] text-[var(--verified-color)] fill-current" />
                                            )}
                                        </span>
                                    </div>
                                </div>

                                <div className="absolute right-4 bottom-16 z-20 flex flex-col gap-4.5 items-center text-white">
                                    <div className="flex flex-col items-center gap-1">
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleLike(reel.id);
                                            }}
                                            className={`p-3 rounded-full backdrop-blur-md border hover:scale-110 active:scale-90 transition-all ${
                                                isLiked ? 'bg-rose-500 border-transparent text-white' : 'bg-black/40 border-white/10 text-white'
                                            }`}
                                        >
                                            <FiHeart className={`text-md ${isLiked ? 'fill-current' : ''}`} />
                                        </button>
                                        <span className="text-[10px] font-extrabold tracking-wider font-mono">{reel.likes + (isLiked ? 1 : 0)}</span>
                                    </div>

                                    <div className="flex flex-col items-center gap-1">
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toast.success("Opening short comments drawer...");
                                            }}
                                            className="p-3 rounded-full bg-black/40 backdrop-blur-md border border-white/10 hover:scale-110 active:scale-90 transition-all text-white"
                                        >
                                            <FiMessageCircle className="text-md" />
                                        </button>
                                        <span className="text-[10px] font-extrabold tracking-wider font-mono">{reel.comments}</span>
                                    </div>

                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toast.success("Link copied to share!");
                                        }}
                                        className="p-3 rounded-full bg-black/40 backdrop-blur-md border border-white/10 hover:scale-110 active:scale-90 transition-all text-white"
                                    >
                                        <FiShare2 className="text-md" />
                                    </button>

                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleSave(reel.id);
                                        }}
                                        className={`p-3 rounded-full backdrop-blur-md border hover:scale-110 active:scale-90 transition-all ${
                                            isSaved ? 'bg-amber-500 border-transparent text-white' : 'bg-black/40 border-white/10 text-white'
                                        }`}
                                    >
                                        <FiBookmark className={`text-md ${isSaved ? 'fill-current' : ''}`} />
                                    </button>
                                </div>

                                <div className="absolute bottom-4 left-4 right-16 z-20 text-white flex flex-col gap-1 bg-black/15 backdrop-blur-sm p-3.5 rounded-[18px] border border-white/5">
                                    <p className="text-xs leading-relaxed font-semibold">{reel.caption}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
