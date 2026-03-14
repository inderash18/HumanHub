import PostFeed from '../components/posts/PostFeed';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const SORT_TABS = [
    { key: 'hot', icon: '🔥', label: 'Hot' },
    { key: 'new', icon: '✨', label: 'New' },
    { key: 'top', icon: '📈', label: 'Top' },
    { key: 'rising', icon: '⬆️', label: 'Rising' },
];

const TRENDING_COMMUNITIES = [
    { slug: 'technology', name: 'r/technology', members: '12.4m', icon: '💻', color: '#ff4500', joined: false },
    { slug: 'science', name: 'r/science', members: '8.1m', icon: '🔬', color: '#46d160', joined: true },
    { slug: 'worldnews', name: 'r/worldnews', members: '25.3m', icon: '🌍', color: '#0079d3', joined: false },
    { slug: 'art', name: 'r/HumanArt', members: '2.7m', icon: '🎨', color: '#ff585b', joined: false },
    { slug: 'gaming', name: 'r/gaming', members: '35.1m', icon: '🎮', color: '#7193ff', joined: true },
];

export default function FeedPage() {
    const { user, isAuthenticated } = useAuthStore();
    const navigate = useNavigate();
    const [sort, setSort] = useState('hot');
    const [joinedMap, setJoinedMap] = useState({ science: true, gaming: true });
    const [viewMode, setViewMode] = useState('card'); // 'card' | 'compact' | 'classic'

    const toggleJoin = (slug) => {
        setJoinedMap(prev => ({ ...prev, [slug]: !prev[slug] }));
    };

    return (
        <div style={{ display: 'flex', gap: '24px', width: '100%' }}>
            {/* Main feed */}
            <div style={{ flex: 1, minWidth: 0 }}>

                {/* Create Post bar */}
                {isAuthenticated && (
                    <div className="reddit-card" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', marginBottom: '10px' }}>
                        <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#ff4500', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                            {user?.avatar
                                ? <img src={user.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                : <svg viewBox="0 0 20 20" fill="white" width="22" height="22"><path d="M10 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 7a7 7 0 0 1 14 0H3z"/></svg>
                            }
                        </div>
                        <input
                            type="text"
                            placeholder="Create Post"
                            className="reddit-input"
                            style={{ flex: 1 }}
                            readOnly
                            onClick={() => navigate('/submit')}
                        />
                        <button onClick={() => navigate('/submit')} style={{
                            width: '34px', height: '34px', border: '1px solid #ccc', borderRadius: '4px', background: 'transparent', cursor: 'pointer',
                            color: '#878a8c', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'border-color .1s, background .1s'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#f6f7f8'; e.currentTarget.style.borderColor = '#0079d3'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#ccc'; }}
                        title="Upload image"
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                        </button>
                        <button onClick={() => navigate('/submit')} style={{
                            width: '34px', height: '34px', border: '1px solid #ccc', borderRadius: '4px', background: 'transparent', cursor: 'pointer',
                            color: '#878a8c', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'border-color .1s, background .1s'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#f6f7f8'; e.currentTarget.style.borderColor = '#0079d3'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#ccc'; }}
                        title="Add link"
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                        </button>
                    </div>
                )}

                {/* Sort Bar */}
                <div className="reddit-card" style={{ display: 'flex', alignItems: 'center', padding: '6px 8px 6px 4px', marginBottom: '10px', gap: '4px' }}>
                    {SORT_TABS.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setSort(tab.key)}
                            className={`sort-tab ${sort === tab.key ? 'active' : ''}`}
                            style={{ fontFamily: 'inherit' }}
                        >
                            <span>{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: '4px' }}>
                        {[
                            { mode: 'card', title: 'Card view', icon: <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></> },
                            { mode: 'compact', title: 'Compact view', icon: <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></> },
                        ].map(({ mode, title, icon }) => (
                            <button key={mode} onClick={() => setViewMode(mode)} title={title} style={{
                                width: '32px', height: '32px', borderRadius: '2px', border: 'none',
                                background: viewMode === mode ? '#e8f0fe' : 'transparent', color: viewMode === mode ? '#0079d3' : '#878a8c',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background .1s'
                            }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">{icon}</svg>
                            </button>
                        ))}
                    </div>
                </div>

                <PostFeed sort={sort} compact={viewMode === 'compact'} />
            </div>

            {/* Right sidebar */}
            <div style={{ width: '312px', flexShrink: 0, display: 'none' }} className="feed-right-sidebar">
                <style>{`@media (min-width: 1100px) { .feed-right-sidebar { display: block !important; } }`}</style>

                {/* Premium Card */}
                <div className="reddit-widget" style={{ marginBottom: '16px' }}>
                    <div style={{ padding: '12px', background: 'linear-gradient(135deg, #ff4500 0%, #ff6534 100%)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'white' }}>
                            <span style={{ fontSize: '24px' }}>🏆</span>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: '15px' }}>HumanHub Premium</div>
                                <div style={{ fontSize: '12px', opacity: 0.9 }}>The best human-only experience</div>
                            </div>
                        </div>
                    </div>
                    <div style={{ padding: '12px' }}>
                        <p style={{ fontSize: '13px', color: '#1c1c1c', marginBottom: '12px', lineHeight: 1.5 }}>
                            Get an ad-free experience, special membership rewards, and exclusive access to premium features.
                        </p>
                        <button className="btn-reddit-orange" style={{ width: '100%', fontFamily: 'inherit', marginBottom: '8px' }}>
                            Try Premium
                        </button>
                        {isAuthenticated && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#878a8c' }}>
                                <span>🪙</span> Use your coins to give awards
                            </div>
                        )}
                    </div>
                </div>

                {/* Home Widget */}
                <div className="reddit-widget" style={{ marginBottom: '16px' }}>
                    <div style={{ padding: '10px 12px 0', background: 'linear-gradient(180deg, #46d160, #2d9941)', height: '60px' }} />
                    <div style={{ padding: '0 12px 12px' }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginTop: '-20px', marginBottom: '8px' }}>
                            <div style={{ width: '48px', height: '48px', background: '#fff', borderRadius: '50%', border: '4px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', boxShadow: '0 2px 4px rgba(0,0,0,.1)' }}>
                                🏠
                            </div>
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>Home</div>
                        <p style={{ fontSize: '13px', color: '#1c1c1c', lineHeight: 1.5, marginBottom: '12px' }}>
                            Your personal HumanHub frontpage. Come here to check in with your favorite communities.
                        </p>
                        {isAuthenticated ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <button className="btn-reddit-blue" onClick={() => navigate('/submit')} style={{ fontFamily: 'inherit' }}>
                                    Create Post
                                </button>
                                <button className="btn-reddit-outline" onClick={() => navigate('/communities')} style={{ fontFamily: 'inherit' }}>
                                    Create Community
                                </button>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <button className="btn-reddit-orange" onClick={() => navigate('/login')} style={{ fontFamily: 'inherit' }}>
                                    Log In
                                </button>
                                <button className="btn-reddit-outline" onClick={() => navigate('/register')} style={{ fontFamily: 'inherit' }}>
                                    Sign Up
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Top Communities */}
                <div className="reddit-widget" style={{ marginBottom: '16px' }}>
                    <div style={{ padding: '10px 12px', fontWeight: 700, fontSize: '14px', borderBottom: '1px solid #edeff1' }}>
                        Top Communities
                    </div>
                    <div>
                        {TRENDING_COMMUNITIES.map((c, i) => (
                            <div key={c.slug} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderBottom: '1px solid #edeff1' }}
                                onMouseEnter={e => e.currentTarget.style.background = '#f6f7f8'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                                <span style={{ color: '#878a8c', fontSize: '13px', minWidth: '18px', fontWeight: 700 }}>{i + 1}</span>
                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>
                                    {c.icon}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <Link to={`/c/${c.slug}`} style={{ display: 'block', fontWeight: 700, fontSize: '13px', color: '#1c1c1c', textDecoration: 'none' }}
                                        onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                                        onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                                    >
                                        {c.name}
                                    </Link>
                                    <div style={{ fontSize: '12px', color: '#878a8c' }}>{c.members} members</div>
                                </div>
                                <button
                                    onClick={() => toggleJoin(c.slug)}
                                    className={`btn-join ${joinedMap[c.slug] ? 'joined' : ''}`}
                                    style={{ fontFamily: 'inherit' }}
                                >
                                    {joinedMap[c.slug] ? 'Joined' : 'Join'}
                                </button>
                            </div>
                        ))}
                    </div>
                    <div style={{ padding: '10px 12px' }}>
                        <Link to="/communities" className="btn-reddit-blue" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', fontFamily: 'inherit' }}>
                            View All Communities
                        </Link>
                    </div>
                </div>

                {/* Footer */}
                <div style={{ fontSize: '11px', color: '#878a8c', padding: '0 4px', lineHeight: '1.8', display: 'flex', flexWrap: 'wrap', gap: '0 8px' }}>
                    {['Help', 'About', 'Careers', 'Press', 'Blog', 'Rules', 'Privacy Policy', 'User Agreement', 'Moderator Code of Conduct'].map(label => (
                        <Link key={label} to="/" style={{ color: '#878a8c', textDecoration: 'none', fontSize: '11px' }}
                            onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                            onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                        >
                            {label}
                        </Link>
                    ))}
                    <span style={{ color: '#878a8c', fontSize: '11px' }}>HumanHub Inc © 2026. All rights reserved.</span>
                </div>
            </div>
        </div>
    );
}
