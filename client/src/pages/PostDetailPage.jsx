import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getPost } from '../services/postService';
import PostCard from '../components/posts/PostCard';
import CommentThread from '../components/comments/CommentThread';
import CommentEditor from '../components/comments/CommentEditor';
import Spinner from '../components/ui/Spinner';
import { motion } from 'framer-motion';
import { FiSliders, FiActivity, FiShield } from 'react-icons/fi';

const SORT_OPTIONS = ['Best', 'New', 'Old', 'Verified First'];

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

    useEffect(() => { 
        loadData(); 
    }, [id]);

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-40 gap-4">
            <Spinner size="lg" />
            <p className="text-[var(--text-secondary)] text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Decoding Signal...</p>
        </div>
    );
    
    if (!post) return null;

    // Client-side sorting logic
    const getSortedComments = () => {
        const list = [...(post.comments || [])];
        if (commentSort === 'New') {
            return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }
        if (commentSort === 'Old') {
            return list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        }
        if (commentSort === 'Verified First') {
            return list.sort((a, b) => (b.author?.trustScore || 0) - (a.author?.trustScore || 0));
        }
        // Best: sort by upvotes score
        return list.sort((a, b) => ((b.upvotes || 0) - (b.downvotes || 0)) - ((a.upvotes || 0) - (a.downvotes || 0)));
    };

    const sortedComments = getSortedComments();

    return (
        <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            className="flex flex-col lg:flex-row gap-8 max-w-6xl mx-auto px-4 py-4"
        >
            {/* Main content column */}
            <div className="flex-1 min-w-0">
                {/* Post details */}
                <div className="mb-6">
                    <PostCard post={post} isDetail={true} />
                </div>

                {/* Comment Section Header */}
                <div className="flex items-center gap-4 mb-5 mt-8">
                    <h3 className="text-[10px] font-extrabold text-[var(--text-secondary)] uppercase tracking-[0.2em] whitespace-nowrap">Subject Discourses</h3>
                    <div className="h-[1px] w-full bg-[var(--border-color)]" />
                </div>

                {/* Comment Composer */}
                <div className="premium-card p-5 mb-6 bg-[var(--surface-color)]/20 border border-[var(--border-color)]">
                    <CommentEditor postId={post._id} onSubmitSuccess={loadData} />
                </div>

                {/* Sorting Tabs */}
                <div className="flex items-center gap-2 mb-6 overflow-x-auto no-scrollbar py-1">
                    <div className="flex items-center gap-1.5 bg-[var(--surface-color)]/30 p-1.5 rounded-full border border-[var(--border-color)]">
                        {SORT_OPTIONS.map(opt => (
                            <button
                                key={opt}
                                onClick={() => setCommentSort(opt)}
                                className={`px-4 py-1.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider transition-all ${
                                    commentSort === opt 
                                        ? 'bg-[var(--brand-color)] text-white shadow-sm' 
                                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-transparent'
                                }`}
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Comments Thread stream */}
                <div className="flex flex-col gap-2">
                    {sortedComments.length > 0 ? (
                        <CommentThread
                            comments={sortedComments}
                            postId={post._id}
                            onSubmitSuccess={loadData}
                            onReply={(parentId) => console.log('Reply to', parentId)}
                        />
                    ) : (
                        /* Beautiful empty state when no comments are present */
                        <div className="text-center p-16 flex flex-col items-center gap-3 border border-[var(--border-color)] border-dashed rounded-[24px] bg-[var(--surface-color)]/15">
                            <div className="text-3xl opacity-20">💬</div>
                            <h4 className="font-bold text-[var(--text-primary)] text-xs uppercase tracking-wider">No human activity detected</h4>
                            <p className="text-[var(--text-secondary)] text-[11px] max-w-xs leading-relaxed">Be the first to publish a manual human imprint on this post.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Sidebar metadata (Desktop only) */}
            <div className="w-full lg:w-72 flex-shrink-0 flex flex-col gap-6">
                {/* Community details */}
                {post.community && (
                    <div className="premium-card overflow-hidden bg-[var(--surface-color)] border border-[var(--border-color)]">
                        <div className="p-5 bg-gradient-to-r from-[var(--brand-color)] to-purple-600 text-white relative">
                            <h4 className="text-[10px] font-black uppercase tracking-wider opacity-85">Community Area</h4>
                            <div className="text-lg font-black font-brand truncate">d/{post.community.slug}</div>
                        </div>
                        <div className="p-5 flex flex-col gap-4">
                            <p className="text-[var(--text-secondary)] text-xs leading-relaxed font-medium">
                                {post.community.description || `A verified human sector zone for custom publication records.`}
                            </p>
                            <div className="flex flex-col gap-2">
                                <Link 
                                    to={`/c/${post.community.slug}`} 
                                    className="btn-premium text-[10px] uppercase tracking-wider font-extrabold py-2.5"
                                >
                                    Join Sector
                                </Link>
                            </div>
                        </div>
                    </div>
                )}

                {/* Integrity Insights statistics gauges */}
                <div className="premium-card p-5 bg-[var(--surface-color)] border border-[var(--border-color)]">
                    <h4 className="text-[9px] font-extrabold text-[var(--text-secondary)] uppercase tracking-[0.2em] mb-4 flex items-center gap-1">
                        <FiActivity /> Identity Insights
                    </h4>
                    <div className="flex flex-col gap-4">
                        {[
                            { label: 'Humanity Rate', value: '98.4%', color: 'text-[var(--verified-color)]' },
                            { label: 'Signal Vector', value: 'Manual', color: 'text-[var(--verified-color)]' },
                            { label: 'Network Rank', value: '#08 Block', color: 'text-[var(--text-primary)]' },
                        ].map(stat => (
                            <div key={stat.label} className="flex justify-between items-center bg-[var(--surface-hover)]/30 border border-[var(--border-color)] p-3 rounded-[16px]">
                                <span className="text-[9px] font-extrabold text-[var(--text-secondary)] uppercase tracking-wider">{stat.label}</span>
                                <span className={`text-[11px] font-bold ${stat.color} font-mono`}>{stat.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
