import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import Stories from '../components/home/Stories';
import PostFeed from '../components/posts/PostFeed';
import { FiPlus, FiTrendingUp, FiShield } from 'react-icons/fi';
import api from '../services/api';

const VERIFICATION_TIPS = [
    'Always review text perplexity scores in the detailed report.',
    'Verified images contain cryptographically signed camera metadata.',
    'User behavioral trust grows based on post consistency over time.'
];

export default function FeedPage() {
    const { user, isAuthenticated } = useAuthStore();
    const navigate = useNavigate();
    const [sort, setSort] = useState('hot');
    const [suggestions, setSuggestions] = useState([]);

    useEffect(() => {
        const loadSuggestions = async () => {
            try {
                const res = await api.get('/users/suggested/list');
                setSuggestions(res.data);
            } catch (err) {
                console.error('Failed to load suggested users:', err);
            }
        };
        if (isAuthenticated) {
            loadSuggestions();
        }
    }, [isAuthenticated]);

    return (
        <div className="w-full max-w-[1200px] mx-auto flex gap-8 py-2 px-1">
            {/* Left Feed Area */}
            <div className="flex-1 min-w-0 flex flex-col gap-6">
                {/* Stories Component */}
                <div className="premium-card p-4">
                    <Stories />
                </div>

                {/* Create Quick Post Input Bar */}
                {isAuthenticated && (
                    <div className="premium-card p-4 flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-full bg-[var(--brand-color)] flex items-center justify-center text-white font-bold select-none overflow-hidden">
                            {user?.avatar ? (
                                <img src={user.avatar} className="w-full h-full object-cover" alt="" />
                            ) : (
                                <span>{user?.username?.[0]?.toUpperCase()}</span>
                            )}
                        </div>
                        <div 
                            onClick={() => navigate('/submit')}
                            className="flex-1 bg-[var(--surface-hover)] hover:bg-[var(--border-color)] text-[var(--text-secondary)] py-2.5 px-5 rounded-[16px] text-xs font-semibold cursor-pointer transition-all duration-150"
                        >
                            What authentic story are you sharing today, {user?.username}?
                        </div>
                        <button 
                            onClick={() => navigate('/submit')}
                            className="btn-premium p-2.5 rounded-full"
                            title="Create Post"
                        >
                            <FiPlus className="text-md" />
                        </button>
                    </div>
                )}

                {/* Feed Sort Filter Header */}
                <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
                    <h2 className="text-md font-bold font-brand tracking-wide text-[var(--text-primary)]">Human Activity</h2>
                    <div className="flex gap-1 bg-[var(--surface-hover)] p-1 rounded-full border border-[var(--border-color)]">
                        {['hot', 'new', 'rising'].map((t) => (
                            <button
                                key={t}
                                onClick={() => setSort(t)}
                                className={`text-[11px] font-bold uppercase tracking-wider px-4 py-1.5 rounded-full transition-all duration-200 ${
                                    sort === t 
                                        ? 'bg-[var(--surface-color)] text-[var(--brand-color)] shadow-sm' 
                                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                                }`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Infinite Feed */}
                <PostFeed sort={sort} />
            </div>

            {/* Right Desktop Suggestions Sidebar */}
            <div className="hidden lg:flex flex-col gap-6 w-[280px] flex-shrink-0">
                {/* User Info Overview */}
                {isAuthenticated && (
                    <div className="premium-card p-4 flex items-center gap-3">
                        <img 
                            src={user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'} 
                            alt="" 
                            className="w-11 h-11 rounded-full border border-[var(--border-color)]"
                        />
                        <div className="flex flex-col min-w-0">
                            <Link to={`/u/${user?.username}`} className="text-xs font-bold text-[var(--text-primary)] hover:underline truncate">{user?.username}</Link>
                            <span className="text-[10px] text-[var(--text-secondary)]">Reputation Score: {(user?.trustScore * 100).toFixed(0)}%</span>
                        </div>
                        <Link 
                            to="/verification-dashboard" 
                            className="ml-auto text-[10px] font-bold text-[var(--brand-color)] hover:text-[var(--brand-hover)] transition-colors"
                        >
                            View Stats
                        </Link>
                    </div>
                )}

                {/* Suggested Users */}
                <div className="premium-card p-5 flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--text-secondary)]">Verified Humans</span>
                        <span className="text-[10px] font-bold text-[var(--brand-color)] cursor-pointer">See All</span>
                    </div>
                    <div className="flex flex-col gap-3">
                        {suggestions.length === 0 ? (
                            <span className="text-[10px] text-[var(--text-secondary)] italic">No verification suggestions available.</span>
                        ) : (
                            suggestions.map((u) => (
                                <div key={u._id} className="flex items-center gap-3 animate-in">
                                    <div className="w-8 h-8 rounded-full bg-[var(--brand-color)] flex items-center justify-center overflow-hidden border border-[var(--border-color)]">
                                        {u.avatar ? (
                                            <img src={u.avatar} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-white text-xs font-bold uppercase">{u.username?.[0]}</span>
                                        )}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <Link to={`/u/${u.username}`} className="text-xs font-bold text-[var(--text-primary)] hover:underline truncate">{u.username}</Link>
                                        <span className="text-[10px] text-[var(--text-secondary)] truncate">Trust Score: {(u.trustScore * 100).toFixed(0)}%</span>
                                    </div>
                                    <button className="ml-auto text-[10px] font-extrabold text-[var(--brand-color)] hover:text-[var(--brand-hover)] uppercase tracking-wide">
                                        Follow
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Verification Guidance */}
                <div className="premium-card p-5 flex flex-col gap-4">
                    <div className="flex items-center gap-2 text-[var(--verified-color)]">
                        <FiShield className="text-md" />
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--text-secondary)]">Security Tips</span>
                    </div>
                    <div className="flex flex-col gap-3.5">
                        {VERIFICATION_TIPS.map((tip, idx) => (
                            <div key={idx} className="flex gap-2.5 items-start text-xs text-[var(--text-secondary)] leading-relaxed">
                                <span className="text-[var(--verified-color)] font-bold font-mono">{idx + 1}.</span>
                                <span>{tip}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Legal & Version Footer */}
                <div className="px-2 text-[10px] text-[var(--text-muted)] leading-loose">
                    <div className="flex flex-wrap gap-2">
                        <span>User Agreement</span>
                        <span>Privacy Policy</span>
                        <span>Content Policy</span>
                    </div>
                    <div className="mt-1">HumanHub Premium © 2026. All rights reserved.</div>
                </div>
            </div>
        </div>
    );
}
