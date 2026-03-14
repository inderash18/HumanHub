import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

const popularCommunities = [
  { slug: 'technology', name: 'r/technology', icon: '💻', color: '#ff4500' },
  { slug: 'science', name: 'r/science', icon: '🔬', color: '#46d160' },
  { slug: 'worldnews', name: 'r/worldnews', icon: '🌍', color: '#0079d3' },
  { slug: 'art', name: 'r/HumanArt', icon: '🎨', color: '#ff585b' },
  { slug: 'gaming', name: 'r/gaming', icon: '🎮', color: '#7193ff' },
];

export default function Sidebar() {
    const { isAuthenticated, user } = useAuthStore();
    const location = useLocation();

    const navItems = [
        { to: '/feed', icon: '🏠', label: 'Home' },
        { to: '/communities', icon: '🧭', label: 'Explore' },
    ];

    return (
        <aside style={{ width: '270px', flexShrink: 0, display: 'none' }} className="lg-sidebar">
            <style>{`
                @media (min-width: 960px) { .lg-sidebar { display: block !important; } }
            `}</style>

            {/* Main nav */}
            <div style={{ background: '#fff', border: '1px solid #ccc', borderRadius: '4px', marginBottom: '16px', padding: '8px 0' }}>
                {navItems.map(item => (
                    <Link key={item.to} to={item.to} style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '8px 16px', textDecoration: 'none',
                        color: location.pathname === item.to ? '#0079d3' : '#1c1c1c',
                        fontWeight: location.pathname === item.to ? 700 : 400,
                        fontSize: '14px',
                        background: location.pathname === item.to ? '#e8f0fe' : 'transparent',
                        transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => location.pathname !== item.to && (e.currentTarget.style.background = '#f6f7f8')}
                    onMouseLeave={e => location.pathname !== item.to && (e.currentTarget.style.background = 'transparent')}
                    >
                        <span style={{ fontSize: '18px' }}>{item.icon}</span>
                        {item.label}
                    </Link>
                ))}

                {isAuthenticated && (
                    <>
                        <div style={{ borderTop: '1px solid #edeff1', margin: '8px 0' }} />
                        <div style={{ padding: '4px 16px 8px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: '#878a8c', letterSpacing: '0.5px' }}>
                            My Communities
                        </div>
                        {popularCommunities.slice(0, 3).map(c => (
                            <Link key={c.slug} to={`/c/${c.slug}`} style={{
                                display: 'flex', alignItems: 'center', gap: '10px',
                                padding: '8px 16px', textDecoration: 'none', color: '#1c1c1c', fontSize: '14px'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = '#f6f7f8'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', flexShrink: 0 }}>
                                    {c.icon}
                                </div>
                                <span style={{ fontWeight: 500 }}>{c.name}</span>
                            </Link>
                        ))}
                    </>
                )}
            </div>

            {/* Human Verification Status */}
            {isAuthenticated && (
                <div style={{ background: '#fff', border: '1px solid #ccc', borderRadius: '4px', marginBottom: '16px', overflow: 'hidden' }}>
                    <div style={{ background: 'linear-gradient(to bottom, #46d160, #2d9941)', padding: '12px 16px' }}>
                        <div style={{ color: 'white', fontWeight: 700, fontSize: '14px', marginBottom: '2px' }}>
                            ✅ Human Verified
                        </div>
                        <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px' }}>
                            Trust Score: <strong>{Math.round((user?.trustScore || 0.95) * 100)}%</strong>
                        </div>
                    </div>
                    <div style={{ padding: '12px 16px' }}>
                        <div style={{ fontSize: '12px', color: '#1c1c1c', marginBottom: '10px', lineHeight: '1.5' }}>
                            Your account has been verified as human. You have full access to all communities.
                        </div>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            <span style={{ background: 'rgba(70,209,96,0.15)', color: '#2d9941', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '12px', border: '1px solid rgba(70,209,96,0.3)' }}>
                                🏆 Human
                            </span>
                            <span style={{ background: '#fff3cd', color: '#b06000', fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '12px' }}>
                                ⭐ Trusted
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Popular Communities */}
            <div style={{ background: '#fff', border: '1px solid #ccc', borderRadius: '4px', marginBottom: '16px', overflow: 'hidden' }}>
                <div style={{ padding: '10px 12px', background: 'linear-gradient(to bottom, #ff6534, #ff4500)', color: 'white', fontWeight: 700, fontSize: '14px' }}>
                    Top Communities
                </div>
                <div style={{ padding: '8px 0' }}>
                    {popularCommunities.map((c, i) => (
                        <div key={c.slug} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px' }}>
                            <span style={{ color: '#878a8c', fontSize: '12px', minWidth: '16px', fontWeight: 700 }}>{i + 1}</span>
                            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>
                                {c.icon}
                            </div>
                            <Link to={`/c/${c.slug}`} style={{ flex: 1, textDecoration: 'none', color: '#1c1c1c', fontWeight: 700, fontSize: '13px' }}>
                                {c.name}
                            </Link>
                            <button className="btn-join" style={{ fontFamily: 'inherit' }}>Join</button>
                        </div>
                    ))}
                    <div style={{ padding: '8px 12px' }}>
                        <Link to="/communities" className="btn-reddit-blue" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', fontFamily: 'inherit' }}>
                            View All
                        </Link>
                    </div>
                </div>
            </div>

            {/* Footer links */}
            <div style={{ fontSize: '11px', color: '#878a8c', padding: '0 4px', lineHeight: '2', display: 'flex', flexWrap: 'wrap', gap: '4px 8px' }}>
                {['User Agreement', 'Privacy Policy', 'Content Policy', 'Moderator Code', 'Careers', 'Press'].map(l => (
                    <Link key={l} to="/" style={{ color: '#878a8c', textDecoration: 'none' }}
                    onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                    onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                    >{l}</Link>
                ))}
                <span>HumanHub Inc © 2026. All rights reserved.</span>
            </div>
        </aside>
    );
}
