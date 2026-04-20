import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getPost } from '../services/postService';
import PostCard from '../components/posts/PostCard';
import CommentThread from '../components/comments/CommentThread';
import CommentEditor from '../components/comments/CommentEditor';
import Spinner from '../components/ui/Spinner';
import { motion } from 'framer-motion';

const SORT_OPTIONS = ['Best', 'Top', 'New', 'Controversial', 'Old', 'Q&A'];

export default function PostDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [commentSort, setCommentSort] = useState('Best');

    const loadData = async () => {
        try {
            const data = await getPost(id);
            setPost(data);
        } catch(e) {
            console.error(e);
            navigate('/feed');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, [id]);

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-40 gap-4">
            <Spinner size="lg" />
            <p className="text-brand-muted text-[10px] font-black uppercase tracking-[0.3em]">Decoding Signal...</p>
        </div>
    );
    if (!post) return null;

    return (
        <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            className="flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto px-4 lg:px-8 py-5"
        >
            {/* Main content */}
            <div className="flex-1 min-w-0 max-w-4xl">
                {/* Post Content */}
                <div className="reddit-card p-6 mb-6 shadow-2xl relative border-brand-gold/10">
                    <PostCard post={post} isDetail={true} />
                </div>

                {/* Comment Section Header */}
                <div className="flex items-center gap-4 mb-6">
                    <h3 className="text-xs font-black text-brand-muted uppercase tracking-[0.2em] whitespace-nowrap">Subject Discourses</h3>
                    <div className="h-[1px] w-full bg-white/5" />
                </div>

                {/* Comment Input */}
                <div className="reddit-card p-6 mb-6 bg-gradient-to-r from-reddit-dark-surface to-reddit-dark-surface/50 border-none">
                    <CommentEditor postId={post._id} onSubmitSuccess={loadData} />
                </div>

                {/* Filters */}
                <div className="flex items-center gap-4 mb-6 overflow-x-auto no-scrollbar py-1">
                    <div className="flex items-center gap-2 bg-reddit-dark-surface/30 p-1 rounded-full border border-white/5">
                        {SORT_OPTIONS.map(opt => (
                            <button
                                key={opt}
                                onClick={() => setCommentSort(opt)}
                                className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest transition-all ${
                                    commentSort === opt ? 'bg-reddit-orange text-white' : 'text-zinc-500 hover:text-white'
                                }`}
                            >
                                {opt.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Comment List */}
                <div className="reddit-card p-6 border-none shadow-none bg-transparent">
                    <CommentThread
                        comments={[]}
                        onReply={(parentId) => console.log('Reply to', parentId)}
                    />
                    
                    {/* Placeholder when empty */}
                    <div className="text-center p-20 flex flex-col items-center gap-4 border border-white/5 border-dashed rounded-3xl">
                        <div className="text-4xl opacity-10">💬</div>
                        <h4 className="font-bold text-white text-sm uppercase tracking-widest">No human activity detected.</h4>
                        <p className="text-brand-muted text-xs max-w-xs">Be the first to leave a manual imprint on this publication.</p>
                    </div>
                </div>
            </div>

            {/* Sidebar (Desktop Only) */}
            <div className="w-full lg:w-80 flex-shrink-0 flex flex-col gap-6">
                {/* Community Snapshot */}
                {post.community && (
                    <div className="reddit-card overflow-hidden shadow-2xl border-none">
                        <div className="p-5 bg-gradient-to-r from-reddit-orange to-brand-gold relative">
                            <h4 className="text-black font-black text-[11px] uppercase tracking-[0.2em]">Community Profile</h4>
                            <div className="text-black text-xl font-bold font-outfit truncate">d/{post.community.slug}</div>
                        </div>
                        <div className="p-6 flex flex-col gap-4">
                            <p className="text-zinc-400 text-sm leading-relaxed font-medium">
                                {post.community.description || `A verified human containment zone for specialized interactions.`}
                            </p>
                            <div className="flex flex-col gap-2">
                                <Link 
                                    to={`/c/${post.community.slug}`} 
                                    className="bg-brand-gold hover:bg-white text-black font-black text-[11px] py-3 rounded-xl transition-all text-center tracking-widest uppercase"
                                >
                                    Join Sector
                                </Link>
                                <Link 
                                    to={`/c/${post.community.slug}`} 
                                    className="border border-white/10 hover:border-white/30 text-white font-black text-[11px] py-3 rounded-xl transition-all text-center tracking-widest uppercase"
                                >
                                    View Protocol
                                </Link>
                            </div>
                        </div>
                    </div>
                )}

                {/* Verified Metadata */}
                <div className="reddit-card p-6 border-brand-gold/10">
                    <h4 className="text-[10px] font-black text-brand-gold uppercase tracking-[0.3em] mb-4">Identity Insights</h4>
                    <div className="flex flex-col gap-5">
                        {[
                            { label: 'Humanity Rate', value: '94.2%', color: 'text-brand-success' },
                            { label: 'Signal Strength', value: 'High', color: 'text-brand-success' },
                            { label: 'Venture Rank', value: '#12', color: 'text-brand-gold' },
                        ].map(stat => (
                            <div key={stat.label} className="flex justify-between items-center bg-white/5 p-3 rounded-xl">
                                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{stat.label}</span>
                                <span className={`text-xs font-black ${stat.color} font-mono tracking-tighter`}>{stat.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
