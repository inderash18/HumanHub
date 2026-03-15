import PostFeed from '../components/posts/PostFeed';
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const SORT_TABS = [
    { key: 'hot', icon: '🔥', label: 'Hot' },
    { key: 'new', icon: '✨', label: 'New' },
    { key: 'top', icon: '📈', label: 'Top' },
    { key: 'rising', icon: '⬆️', label: 'Rising' },
];

const TRENDING_SEARCHES = [
    { title: 'Human Creativity vs AI', subtitle: 'The new era of digital art', icon: '🎨' },
    { title: 'DHRUVIT Network Growth', subtitle: '1M+ verified humans joined', icon: '🚀' },
    { title: 'Future of Verified Content', subtitle: 'Why human-only matters', icon: '🛡️' },
    { title: 'The AI Singularity Debate', subtitle: 'Community discussion', icon: '🧠' },
];

export default function FeedPage() {
    const { user, isAuthenticated } = useAuthStore();
    const navigate = useNavigate();
    const [sort, setSort] = useState('hot');

    return (
        <div style={{ display: 'flex', gap: '24px', width: '100%', maxWidth: '1280px', margin: '0 auto', padding: '16px' }}>
            {/* Main feed */}
            <div style={{ flex: 1, minWidth: 0 }}>
                
                {/* Search Bar / Input */}
                {isAuthenticated && (
                     <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '0 8px', marginBottom: '24px' }}>
                        <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'var(--brand-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden', border: '2px solid var(--border-color)' }}>
                            {user?.avatar
                                ? <img src={user.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                : <span style={{ color: 'white', fontWeight: 800 }}>{user?.username?.[0]?.toUpperCase()}</span>
                            }
                        </div>
                        <div className="search-bar-pill" style={{ flex: 1, cursor: 'pointer', display: 'flex', alignItems: 'center', background: '#0f0f0f' }} onClick={() => navigate('/submit')}>
                             <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Create Post</span>
                        </div>
                        <button className="sidebar-link" onClick={() => navigate('/submit')} title="Media" style={{ padding: '8px' }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                        </button>
                    </div>
                )}

                {/* Trending section */}
                <div style={{ marginBottom: '32px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px', paddingLeft: '8px' }}>Trending Locally</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                        {TRENDING_SEARCHES.map((t, i) => (
                            <div key={i} className="reddit-card" style={{ padding: '16px', cursor: 'pointer' }}>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                    <div style={{ fontSize: '20px' }}>{t.icon}</div>
                                    <div>
                                        <div style={{ fontWeight: 700, color: 'white', fontSize: '14px', marginBottom: '4px' }}>{t.title}</div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{t.subtitle}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sort Bar / Chips - Exactly like screenshot 1 */}
                <div style={{ display: 'flex', alignItems: 'center', padding: '0 8px', marginBottom: '24px', gap: '8px' }}>
                    {['Posts', 'Communities', 'Comments', 'Media', 'People'].map((label, idx) => (
                        <button
                            key={label}
                            style={{ 
                                padding: '8px 16px', fontSize: '14px', border: 'none', 
                                background: idx === 0 ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                                color: 'white',
                                borderRadius: '9999px',
                                fontWeight: 700, cursor: 'pointer',
                                transition: 'background 0.2s'
                            }}
                            onMouseEnter={e => idx !== 0 && (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)')}
                            onMouseLeave={e => idx !== 0 && (e.currentTarget.style.background = 'transparent')}
                        >
                            {label}
                        </button>
                    ))}
                    
                    <div style={{ marginLeft: '12px', height: '24px', width: '1px', background: 'var(--border-color)' }}></div>

                    {['Relevance', 'All time'].map(filter => (
                        <button
                            key={filter}
                            style={{ 
                                padding: '8px 12px', fontSize: '13px', border: 'none', 
                                background: 'transparent', color: 'var(--text-secondary)',
                                fontWeight: 600, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '4px'
                            }}
                        >
                            <span>{filter}</span>
                            <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path d="M5 8l5 5 5-5z"/></svg>
                        </button>
                    ))}
                </div>

                <PostFeed sort={sort} />
            </div>

            {/* Right sidebar */}
            <div style={{ width: '312px', flexShrink: 0, display: 'none' }} className="feed-right-sidebar">
                <style>{`@media (min-width: 1100px) { .feed-right-sidebar { display: flex !important; flex-direction: column; gap: 16px; } }`}</style>

                {/* Home Widget */}
                <div className="reddit-card" style={{ padding: '16px' }}>
                    <h4 style={{ fontWeight: 800, color: 'var(--text-secondary)', fontSize: '11px', textTransform: 'uppercase', marginBottom: '16px' }}>Popular Communities</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {[
                            { name: 'd/technology', members: '12.5M' },
                            { name: 'd/science', members: '8.2M' },
                            { name: 'd/creativity', members: '4.1M' }
                        ].map((c, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--brand-color)' }}></div>
                                    <div style={{ fontSize: '13px', fontWeight: 600 }}>{c.name}</div>
                                </div>
                                <button className="btn-dhruvit-outline" style={{ padding: '4px 12px', fontSize: '12px' }}>Join</button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* DHRUVIT Vision */}
                <div className="reddit-card" style={{ background: 'linear-gradient(to right, #1a1a1b, #121213)' }}>
                    <h4 style={{ fontWeight: 700, fontSize: '14px', marginBottom: '8px' }}>Experience Premium</h4>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '12px' }}>
                        Browse DHRUVIT without AI clutter. Support human creators directly.
                    </p>
                    <button className="btn-dhruvit" style={{ width: '100%', padding: '8px' }}>Upgrade Now</button>
                </div>

                {/* Legal / Footer */}
                <div style={{ padding: '0 8px', fontSize: '10px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                     <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        <span>User Agreement</span>
                        <span>Privacy Policy</span>
                        <span>Content Policy</span>
                        <span>Moderator Code of Conduct</span>
                     </div>
                     <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '12px 0' }} />
                     <div>DHRUVIT Network © 2026. All rights reserved.</div>
                </div>
            </div>
        </div>
    );
}
