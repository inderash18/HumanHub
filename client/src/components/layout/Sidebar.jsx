import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

const popularCommunities = [
  { slug: 'technology', name: 'd/technology', icon: '💻', color: '#ff4500' },
  { slug: 'science', name: 'd/science', icon: '🔬', color: '#46d160' },
  { slug: 'worldnews', name: 'd/worldnews', icon: '🌍', color: '#0079d3' },
  { slug: 'creativity', name: 'd/creativity', icon: '🎨', color: '#ff585b' },
  { slug: 'gaming', name: 'd/gaming', icon: '🎮', color: '#7193ff' },
];

export default function Sidebar() {
    const { isAuthenticated, user } = useAuthStore();
    const location = useLocation();

    return (
        <aside style={{ width: '240px', flexShrink: 0, paddingRight: '12px', overflowY: 'auto', height: 'calc(100vh - var(--nav-height))', display: 'none' }} className="lg-sidebar no-scrollbar">
            <style>{`
                @media (min-width: 960px) { .lg-sidebar { display: flex !important; flex-direction: column; gap: 4px; } }
                .no-scrollbar::-webkit-scrollbar { display: none; }
            `}</style>

            {/* Main Links */}
            <div style={{ marginBottom: '12px' }}>
                <Link to="/feed" className={`sidebar-link ${location.pathname === '/feed' ? 'active' : ''}`}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="22" height="22">
                        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                    </svg>
                    <span>Home</span>
                </Link>
                <Link to="/popular" className={`sidebar-link ${location.pathname === '/popular' ? 'active' : ''}`}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="22" height="22">
                        <path d="M12 2v20M2 12h20M5 5l14 14M19 5 5 19"/>
                    </svg>
                    <span>Popular</span>
                </Link>
                <Link to="/explore" className={`sidebar-link ${location.pathname === '/explore' ? 'active' : ''}`}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="22" height="22">
                        <circle cx="12" cy="12" r="10"/><path d="m16.24 7.76-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z"/>
                    </svg>
                    <span>Explore</span>
                </Link>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '8px 4px' }} />

            {/* Communities Section */}
            <div>
                 <div style={{ padding: '8px 12px', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>
                    Recent Communities
                </div>
                {popularCommunities.map((c) => (
                    <Link key={c.slug} to={`/c/${c.slug}`} className="sidebar-link">
                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', flexShrink: 0 }}>
                            {c.icon}
                        </div>
                        <span style={{ fontSize: '13px' }}>{c.name}</span>
                    </Link>
                ))}
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '8px 4px' }} />

            {/* Resources Section */}
            <div>
                 <div style={{ padding: '8px 12px', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>
                    Resources
                </div>
                <Link to="/about" className="sidebar-link">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01"/></svg>
                    <span>About DHRUVIT</span>
                </Link>
                <Link to="/advertise" className="sidebar-link">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20"><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
                    <span>Advertise</span>
                </Link>
                <Link to="/help" className="sidebar-link">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
                    <span>Help Center</span>
                </Link>
            </div>

            {/* User Badges Card at the very bottom */}
            {isAuthenticated && (
                 <div style={{ marginTop: 'auto', padding: '12px' }}>
                    <div className="reddit-card" style={{ background: 'linear-gradient(45deg, #121212, #202020)', border: '1px solid var(--brand-color)', padding: '12px' }}>
                        <div style={{ fontWeight: 800, color: 'var(--brand-color)', fontSize: '12px', marginBottom: '4px' }}>HUMAN CERTIFIED</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                            {user?.username}, you are currently verified as a human content creator.
                        </div>
                    </div>
                </div>
            )}
        </aside>
    );
}
