import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

const popularCommunities = [
  { slug: 'technology', name: 'd/technology', icon: '💻', color: 'rgba(255, 69, 0, 0.1)' },
  { slug: 'science', name: 'd/science', icon: '🔬', color: 'rgba(70, 209, 96, 0.1)' },
  { slug: 'worldnews', name: 'd/worldnews', icon: '🌍', color: 'rgba(0, 121, 211, 0.1)' },
  { slug: 'creativity', name: 'd/creativity', icon: '🎨', color: 'rgba(255, 88, 91, 0.1)' },
  { slug: 'gaming', name: 'd/gaming', icon: '🎮', color: 'rgba(113, 147, 255, 0.1)' },
];

export default function Sidebar() {
    const { isAuthenticated, user } = useAuthStore();
    const location = useLocation();

    return (
        <aside style={{ width: '260px', flexShrink: 0, paddingRight: '12px', overflowY: 'auto', height: 'calc(100vh - var(--nav-height))', position: 'sticky', top: 'var(--nav-height)', display: 'none' }} className="lg-sidebar no-scrollbar">
            <style>{`
                @media (min-width: 960px) { .lg-sidebar { display: flex !important; flex-direction: column; } }
                .no-scrollbar::-webkit-scrollbar { display: none; }
            `}</style>

            {/* Main Navigation */}
            <div style={{ padding: '8px 0' }}>
                <Link to="/feed" className={`sidebar-link ${location.pathname === '/feed' ? 'active' : ''}`}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20">
                        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                    </svg>
                    <span>Home Feed</span>
                </Link>
                <Link to="/popular" className={`sidebar-link ${location.pathname === '/popular' ? 'active' : ''}`}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20">
                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                    </svg>
                    <span>Popular</span>
                </Link>
                <Link to="/explore" className={`sidebar-link ${location.pathname === '/explore' ? 'active' : ''}`}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20">
                        <circle cx="12" cy="12" r="10"/><path d="m16.24 7.76-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z"/>
                    </svg>
                    <span>Explore</span>
                </Link>
            </div>

            <div className="sidebar-label">Communities</div>
            <div style={{ paddingBottom: '8px' }}>
                {popularCommunities.map((c) => (
                    <Link key={c.slug} to={`/c/${c.slug}`} className={`sidebar-link ${location.pathname === `/c/${c.slug}` ? 'active' : ''}`}>
                        <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', flexShrink: 0 }}>
                            {c.icon}
                        </div>
                        <span style={{ fontSize: '14px' }}>{c.name}</span>
                    </Link>
                ))}
                <button className="sidebar-link" style={{ background: 'none', border: 'none', width: '100%', cursor: 'pointer', color: 'var(--brand-color)' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18">
                        <path d="M12 5v14M5 12h14"/>
                    </svg>
                    <span style={{ fontWeight: 700 }}>Record Community</span>
                </button>
            </div>

            <div className="sidebar-label">Resources</div>
            <div style={{ paddingBottom: '16px' }}>
                <Link to="/about" className="sidebar-link">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
                    <span>Mission</span>
                </Link>
                <Link to="/help" className="sidebar-link">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    <span>Human Help</span>
                </Link>
            </div>

            {/* Certification Footer */}
            {isAuthenticated && (
                 <div style={{ marginTop: 'auto', padding: '16px 8px' }}>
                    <div className="reddit-card" style={{ 
                        background: 'linear-gradient(135deg, #1A1A1B 0%, #0F0F0F 100%)', 
                        padding: '16px',
                        border: '1px solid var(--border-color)',
                        borderRadius: '16px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#00ff7f', boxShadow: '0 0 10px rgba(0,255,127,0.3)' }} />
                            <span style={{ fontSize: '10px', fontWeight: 900, color: '#00ff7f', letterSpacing: '1px' }}>CERTIFIED HUMAN</span>
                        </div>
                        <div style={{ fontSize: '13px', color: 'white', fontWeight: 700, marginBottom: '4px' }}>
                            {user?.username}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                            Your account is fully verified. You can post and interact in all human-only zones.
                        </div>
                    </div>
                    <div style={{ marginTop: '16px', padding: '0 8px', fontSize: '11px', color: 'var(--text-muted)', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        <span>Privacy</span>
                        <span>Terms</span>
                        <span>Content Policy</span>
                        <div style={{ width: '100%', marginTop: '4px' }}>DHRUVIT © 2026</div>
                    </div>
                </div>
            )}
        </aside>
    );
}
