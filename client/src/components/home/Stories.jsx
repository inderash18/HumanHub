import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiSend, FiPlus, FiBarChart2, FiShield } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { fetchStories, createStory } from '../../services/storyService';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';

export default function Stories() {
    const { user } = useAuthStore();
    const [stories, setStories] = useState([]);
    const [activeStoryIdx, setActiveStoryIdx] = useState(null);
    const [progress, setProgress] = useState(0);
    const [replyVal, setReplyVal] = useState('');
    const [uploading, setUploading] = useState(false);
    const [showAnalytics, setShowAnalytics] = useState(false);
    const fileInputRef = useRef(null);

    const isOpen = activeStoryIdx !== null;

    // Load active stories on mount
    const loadStories = async () => {
        try {
            const data = await fetchStories();
            setStories(data);
        } catch (err) {
            console.error('Failed to load stories:', err);
        }
    };

    useEffect(() => {
        loadStories();
    }, []);

    // Automated progress timeline bar
    useEffect(() => {
        let interval;
        if (isOpen && stories.length > 0 && !showAnalytics) {
            interval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 100) {
                        if (activeStoryIdx < stories.length - 1) {
                            setActiveStoryIdx(prevIdx => prevIdx + 1);
                            return 0;
                        } else {
                            setActiveStoryIdx(null);
                            return 0;
                        }
                    }
                    return prev + 1;
                });
            }, 60); // ~6s story duration
        }
        return () => clearInterval(interval);
    }, [isOpen, activeStoryIdx, stories, showAnalytics]);

    const handlePrev = (e) => {
        e.stopPropagation();
        if (activeStoryIdx > 0) {
            setActiveStoryIdx(prev => prev - 1);
            setProgress(0);
        } else {
            setActiveStoryIdx(null);
        }
    };

    const handleNext = (e) => {
        e.stopPropagation();
        if (activeStoryIdx < stories.length - 1) {
            setActiveStoryIdx(prev => prev + 1);
            setProgress(0);
        } else {
            setActiveStoryIdx(null);
        }
    };

    const handleSendReply = (e) => {
        e.preventDefault();
        if (!replyVal.trim()) return;
        toast.success(`Reply sent to @${stories[activeStoryIdx].author?.username}!`);
        setReplyVal('');
    };

    // Upload New Story Handler
    const handleStoryUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const toastId = toast.loading('Uploading your story to the database...');

        try {
            const formData = new FormData();
            formData.append('images', file);
            
            const { data } = await api.post('/posts/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const uploadedUrl = data.urls?.[0];

            if (!uploadedUrl) throw new Error('No upload URL returned');

            const response = await createStory(uploadedUrl, 'Authentic moment shared ⚡');
            
            setStories(prev => [response.story, ...prev]);
            toast.success('Story published successfully!', { id: toastId });
        } catch (err) {
            console.error(err);
            toast.error('Failed to post story.', { id: toastId });
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="w-full">
            {/* Story Tray List */}
            <div className="flex items-center gap-4 overflow-x-auto pb-3 select-none no-scrollbar">
                
                {/* "+" Add Story Button */}
                <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center gap-1 cursor-pointer flex-shrink-0"
                >
                    <div className="relative">
                        <div className="w-[66px] h-[66px] rounded-full border border-dashed border-[var(--border-color)] hover:border-[var(--brand-color)] flex items-center justify-center bg-[var(--surface-hover)] transition-all">
                            {uploading ? (
                                <div className="w-5 h-5 rounded-full border-2 border-[var(--brand-color)] border-t-transparent animate-spin" />
                            ) : (
                                <FiPlus className="text-xl text-[var(--text-secondary)] hover:text-[var(--brand-color)]" />
                            )}
                        </div>
                        <input 
                            type="file" 
                            accept="image/*"
                            ref={fileInputRef}
                            onChange={handleStoryUpload}
                            className="hidden"
                        />
                    </div>
                    <span className="text-[11px] text-[var(--text-secondary)] font-medium">Add Story</span>
                </div>

                {stories.map((story, idx) => (
                    <div 
                        key={story._id} 
                        onClick={() => {
                            setActiveStoryIdx(idx);
                            setShowAnalytics(false);
                        }}
                        className="flex flex-col items-center gap-1 cursor-pointer flex-shrink-0 animate-in"
                    >
                        <div className="relative">
                            <div className="w-[66px] h-[66px] rounded-full p-[2.5px] bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] hover:scale-105 transition-transform duration-200">
                                <div className="w-full h-full rounded-full bg-[var(--bg-color)] p-[2.5px] flex items-center justify-center overflow-hidden">
                                    {story.author?.avatar ? (
                                        <img 
                                            src={story.author.avatar} 
                                            alt="" 
                                            className="w-full h-full object-cover rounded-full"
                                        />
                                    ) : (
                                        <span className="text-[var(--text-primary)] font-bold text-xs uppercase">{story.author?.username?.[0]}</span>
                                    )}
                                </div>
                            </div>
                            <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-[var(--verified-color)] border-2 border-[var(--bg-color)] flex items-center justify-center text-white text-[9px] font-bold shadow-md">
                                ✓
                            </div>
                        </div>
                        <span className="text-[11px] text-[var(--text-secondary)] font-medium max-w-[70px] truncate">
                            {story.author?.username}
                        </span>
                    </div>
                ))}
            </div>

            {/* Viewer Overlay Modal */}
            <AnimatePresence>
                {isOpen && stories[activeStoryIdx] && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center p-4 backdrop-blur-md"
                        onClick={() => setActiveStoryIdx(null)}
                    >
                        <div 
                            className="relative w-full max-w-[400px] aspect-[9/16] bg-zinc-900 rounded-[24px] overflow-hidden flex flex-col justify-between shadow-2xl border border-white/10"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* ProgressBar */}
                            <div className="absolute top-3 left-4 right-4 flex gap-1 z-[10001]">
                                {stories.map((_, i) => (
                                    <div key={i} className="flex-1 h-[2px] bg-white/30 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-white transition-all duration-75"
                                            style={{ 
                                                width: i === activeStoryIdx ? `${progress}%` : i < activeStoryIdx ? '100%' : '0%' 
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>

                            {/* Header details */}
                            <div className="absolute top-6 left-4 right-4 flex items-center justify-between z-[10001] text-white">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-[var(--brand-color)] border border-white/20 overflow-hidden flex items-center justify-center">
                                        {stories[activeStoryIdx].author?.avatar ? (
                                            <img 
                                                src={stories[activeStoryIdx].author.avatar} 
                                                alt="" 
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <span className="text-white text-[10px] font-bold uppercase">{stories[activeStoryIdx].author?.username?.[0]}</span>
                                        )}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold font-brand tracking-wide flex items-center gap-1">
                                            {stories[activeStoryIdx].author?.username}
                                            <span className="w-2.5 h-2.5 bg-[var(--verified-color)] text-[6px] rounded-full flex items-center justify-center font-bold">✓</span>
                                        </span>
                                        <span className="text-[9px] text-white/60 font-mono">Trust Index: {((stories[activeStoryIdx].author?.trustScore || 0.95) * 100).toFixed(0)}%</span>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setActiveStoryIdx(null)}
                                    className="p-1 hover:bg-white/10 rounded-full text-white transition-colors"
                                >
                                    <FiX className="text-xl" />
                                </button>
                            </div>

                            {/* Story Media display */}
                            <div className="relative flex-1 w-full h-full flex items-center justify-center bg-black">
                                <div onClick={handlePrev} className="absolute left-0 top-0 bottom-16 w-[35%] z-[10000] cursor-w-resize" />
                                <div onClick={handleNext} className="absolute right-0 top-0 bottom-16 w-[35%] z-[10000] cursor-e-resize" />

                                <img 
                                    src={stories[activeStoryIdx].mediaUrl} 
                                    alt="" 
                                    className="w-full h-full object-cover"
                                />

                                <div className="absolute bottom-18 left-4 right-4 bg-black/50 backdrop-blur-md p-3.5 rounded-xl border border-white/10 text-white">
                                    <p className="text-xs font-medium">{stories[activeStoryIdx].caption}</p>
                                </div>

                                {/* Slide-up Analytics Panel Overlay */}
                                <AnimatePresence>
                                    {showAnalytics && (
                                        <motion.div 
                                            initial={{ y: '100%' }}
                                            animate={{ y: 0 }}
                                            exit={{ y: '100%' }}
                                            className="absolute inset-x-0 bottom-0 bg-zinc-950/95 border-t border-white/10 p-5 rounded-t-[20px] z-[10003] flex flex-col gap-4 text-white"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <div className="flex justify-between items-center border-b border-white/10 pb-2">
                                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-white/50 flex items-center gap-1.5">
                                                    <FiBarChart2 className="text-[var(--brand-color)] text-sm" />
                                                    <span>Story Analytics</span>
                                                </span>
                                                <button 
                                                    onClick={() => setShowAnalytics(false)}
                                                    className="text-white/50 hover:text-white text-xs"
                                                >
                                                    Hide
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 text-center">
                                                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                                                    <span className="text-[9px] text-white/40 block font-bold uppercase tracking-wide">Verified Viewers</span>
                                                    <span className="text-md font-mono font-bold mt-1 block">42</span>
                                                    <span className="text-[8px] text-[var(--verified-color)] font-semibold mt-0.5 block">100% Humans</span>
                                                </div>
                                                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                                                    <span className="text-[9px] text-white/40 block font-bold uppercase tracking-wide">Fingerprint Match</span>
                                                    <span className="text-md font-mono font-bold mt-1 block">98%</span>
                                                    <span className="text-[8px] text-[var(--verified-color)] font-semibold mt-0.5 block">Ingest integrity cleared</span>
                                                </div>
                                            </div>

                                            {/* Reactions breakdown */}
                                            <div className="flex justify-around bg-white/5 py-2.5 px-4 rounded-xl border border-white/5">
                                                <span className="text-[11px] font-bold">🔥 14</span>
                                                <span className="text-[11px] font-bold">❤️ 22</span>
                                                <span className="text-[11px] font-bold">👏 8</span>
                                                <span className="text-[11px] font-bold">😮 3</span>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Footer engagement */}
                            <div className="p-4 bg-zinc-950/90 border-t border-white/5 flex flex-col gap-3.5 z-[10002]">
                                <div className="flex justify-between items-center">
                                    <span 
                                        onClick={() => setShowAnalytics(!showAnalytics)}
                                        className="text-[9px] font-extrabold uppercase tracking-widest text-white/50 hover:text-white cursor-pointer transition-colors flex items-center gap-1"
                                    >
                                        <FiBarChart2 />
                                        <span>Show Analytics</span>
                                    </span>
                                    <span className="text-[9.5px] text-[var(--verified-color)] font-bold flex items-center gap-1 uppercase tracking-wider">
                                        <FiShield />
                                        <span>Verified Human</span>
                                    </span>
                                </div>
                                <form onSubmit={handleSendReply} className="flex gap-2 items-center">
                                    <input 
                                        type="text" 
                                        placeholder={`Reply to ${stories[activeStoryIdx].author?.username}...`}
                                        value={replyVal}
                                        onChange={e => setReplyVal(e.target.value)}
                                        className="flex-1 bg-white/10 border border-white/10 rounded-full px-4 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-white/20"
                                    />
                                    <button 
                                        type="submit"
                                        className="p-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors"
                                    >
                                        <FiSend className="text-sm" />
                                    </button>
                                </form>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
