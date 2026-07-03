import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiCompass, FiShield, FiHeart, FiMessageCircle } from 'react-icons/fi';
import api from '../services/api';
import Spinner from '../components/ui/Spinner';

const CATEGORIES = ['All', 'Technology', 'Science', 'Creativity', 'World News'];

export default function ExplorePage() {
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchExplore = async () => {
            try {
                const res = await api.get('/posts');
                // Support both cursor paginated objects or direct list returns
                const list = res.data.posts || res.data || [];
                setPosts(list.filter(p => p.mediaUrls && p.mediaUrls.length > 0));
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchExplore();
    }, []);

    // Filter posts dynamically if they belong to a category
    const getFilteredPosts = () => {
        if (selectedCategory === 'All') return posts;
        const searchSlug = selectedCategory.toLowerCase().replace(/\s/g, '');
        return posts.filter(p => p.community?.slug === searchSlug || p.community?.name?.toLowerCase().includes(searchSlug));
    };

    const displayPosts = getFilteredPosts();

    return (
        <div className="w-full max-w-[1000px] mx-auto flex flex-col gap-6 py-2 px-1 select-none">
            {/* Page Header */}
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
                <div className="flex items-center gap-2.5">
                    <FiCompass className="text-2xl text-[var(--brand-color)]" />
                    <h1 className="font-brand text-2xl font-black tracking-tight text-[var(--text-primary)]">Explore</h1>
                </div>
                <div className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[var(--verified-color)] flex items-center gap-1.5">
                    <FiShield className="fill-current text-xs animate-pulse" />
                    <span>Human-verified gallery only</span>
                </div>
            </div>

            {/* Category Filter Tray */}
            <div className="flex gap-2 overflow-x-auto pb-2 select-none no-scrollbar">
                {CATEGORIES.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`text-xs font-bold px-4 py-2 rounded-full border transition-all ${
                            selectedCategory === cat
                            ? 'bg-[var(--text-primary)] text-[var(--bg-color)] border-transparent'
                            : 'bg-transparent text-[var(--text-secondary)] border-[var(--border-color)] hover:bg-[var(--surface-hover)]'
                        }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Content Loader */}
            {loading ? (
                <div className="flex flex-col items-center justify-center p-24 gap-3">
                    <Spinner size="md" />
                    <span className="text-[9px] font-extrabold text-[var(--text-secondary)] uppercase tracking-[0.25em]">Synthesizing feed...</span>
                </div>
            ) : displayPosts.length === 0 ? (
                <div className="text-center p-20 border border-[var(--border-color)] border-dashed rounded-[24px] bg-[var(--surface-color)]/20">
                    <span className="text-3xl opacity-20">📭</span>
                    <h4 className="font-bold text-[var(--text-primary)] text-xs uppercase mt-3 tracking-wider">No human uploads detected</h4>
                    <p className="text-[var(--text-secondary)] text-[11px] mt-1 max-w-xs mx-auto">Be the first to publish a verified image or video signal in this sector.</p>
                </div>
            ) : (
                /* Masonry Styled Grid */
                <div className="columns-1 sm:columns-2 md:columns-3 gap-4 space-y-4">
                    {displayPosts.map((post, idx) => (
                        <Link 
                            key={post._id || idx} 
                            to={`/p/${post._id}`}
                            className="relative block break-inside-avoid rounded-[24px] overflow-hidden border border-[var(--border-color)] group cursor-pointer bg-zinc-950 shadow-sm"
                        >
                            <img 
                                src={post.mediaUrls[0]} 
                                alt="" 
                                className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            {/* Hover Overlay Details */}
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                                <div className="flex gap-6 text-white font-bold text-sm">
                                    <span className="flex items-center gap-1.5 hover:scale-110 transition-transform">
                                        <FiHeart className="fill-current text-rose-500" />
                                        {post.upvotes}
                                    </span>
                                    <span className="flex items-center gap-1.5 hover:scale-110 transition-transform">
                                        <FiMessageCircle className="fill-current text-sky-400" />
                                        {post.comments?.length || 0}
                                    </span>
                                </div>
                            </div>

                            {/* Category badge tag */}
                            {post.community && (
                                <span className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-[9px] font-black uppercase tracking-wider text-white px-2.5 py-1 rounded-full border border-white/10 z-20">
                                    {post.community.name}
                                </span>
                            )}
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
