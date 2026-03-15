import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useAuth } from '../../hooks/useAuth';

export default function Navbar() {
  const { isAuthenticated, user } = useAuthStore();
  const { handleLogout } = useAuth();
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchVal, setSearchVal] = useState('');
  const menuRef = useRef(null);

  const onLogout = async () => {
    await handleLogout();
    navigate('/');
    setUserMenuOpen(false);
  };

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className="nav-blur" style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
      borderBottom: '1px solid var(--border-color)',
      height: 'var(--nav-height)', display: 'flex', alignItems: 'center',
      padding: '0 20px', gap: '16px'
    }}>
      {/* Brand Logo */}
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
         <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="16" fill="var(--brand-color)"/>
            <path d="M11 9H15.5C18.5376 9 21 11.4624 21 14.5C21 17.5376 18.5376 20 15.5 20H11V9Z" fill="white"/>
            <path d="M11 20H15.5C18.5376 20 21 22.4624 21 25.5C21 28.5376 18.5376 31 15.5 31H11V20Z" fill="white"/>
         </svg>
        <span style={{ 
          fontSize: '20px', fontWeight: 900, color: 'white', 
          letterSpacing: '-1.2px', fontFamily: 'Outfit, sans-serif'
        }}>
          dhruvit
        </span>
      </Link>

      {/* Search Section */}
      <div style={{ flex: 1, maxWidth: '640px' }}>
        <div className="search-bar-pill">
          <div style={{ padding: '0 8px 0 4px', display: 'flex', alignItems: 'center' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="3" width="18" height="18">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search communities, people, or ask human..."
            value={searchVal}
            onChange={e => setSearchVal(e.target.value)}
            style={{
              background: 'transparent', border: 'none', outline: 'none',
              fontSize: '14px', color: 'white', width: '100%', fontFamily: 'inherit',
              fontWeight: 500
            }}
          />
          <button style={{
            background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '20px',
            display: 'flex', alignItems: 'center', gap: '6px', margin: '4px',
            padding: '4px 12px', cursor: 'pointer', transition: 'var(--tr-fast)',
            color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 700
          }}>
            <svg viewBox="0 0 24 24" fill="var(--brand-color)" width="14" height="14">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92c-.41.42-.67.83-.67 1.83h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>
            </svg>
            <span>Ask</span>
          </button>
        </div>
      </div>

      {/* Right Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {!isAuthenticated ? (
          <>
            <button 
              className="sidebar-link" 
              onClick={() => navigate('/login')}
              style={{ fontWeight: 700, padding: '8px 16px', fontSize: '14px' }}
            >
              Log In
            </button>
            <button 
              className="btn-dhruvit" 
              onClick={() => navigate('/register')}
              style={{ padding: '8px 24px', minWidth: '100px', fontSize: '14px' }}
            >
              Sign Up
            </button>
          </>
        ) : (
          <>
            <Link to="/submit" style={{ 
              display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none',
              background: 'var(--surface-elevated)', padding: '8px 16px', borderRadius: '20px',
              color: 'white', fontWeight: 600, fontSize: '14px', border: '1px solid var(--border-color)'
            }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18">
                    <path d="M12 5v14M5 12h14"/>
                </svg>
                <span>Create</span>
            </Link>
            
            <button className="sidebar-link" style={{ padding: '8px', position: 'relative' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2.5" width="22" height="22">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                <div style={{ position: 'absolute', top: '8px', right: '8px', width: '8px', height: '8px', background: 'var(--brand-color)', borderRadius: '50%', border: '2px solid var(--bg-color)' }}></div>
            </button>

            <div ref={menuRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                style={{
                  display: 'flex', alignItems: 'center',
                  background: 'transparent', border: 'none', cursor: 'pointer', padding: 0
                }}
              >
                <div style={{
                  width: '34px', height: '34px', borderRadius: '50%',
                  background: 'var(--brand-color)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden', border: '2px solid var(--border-color)', transition: 'var(--tr-fast)'
                }} className="avatar-hover">
                  {user?.avatar
                    ? <img src={user.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="avatar" />
                    : <span style={{ color: 'white', fontWeight: 900, fontSize: '15px' }}>{user?.username?.[0]?.toUpperCase()}</span>
                  }
                </div>
              </button>

              {userMenuOpen && (
                <div style={{
                  position: 'absolute', right: 0, top: 'calc(100% + 12px)',
                  width: '240px', background: 'var(--surface-color)', borderRadius: '16px', 
                  border: '1px solid var(--border-color)', boxShadow: '0 24px 48px rgba(0,0,0,0.6)', 
                  zIndex: 100, padding: '8px', overflow: 'hidden'
                }} className="animate-in">
                  <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', marginBottom: '8px' }}>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: 'white' }}>{user?.username}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Verified Human Account</div>
                  </div>
                  
                  <Link to={`/u/${user?.username}`} onClick={() => setUserMenuOpen(false)} className="sidebar-link" style={{ borderRadius: '8px' }}>
                    Profile
                  </Link>
                  <Link to="/settings" onClick={() => setUserMenuOpen(false)} className="sidebar-link" style={{ borderRadius: '8px' }}>
                    User Settings
                  </Link>
                  <div style={{ height: '1px', background: 'var(--border-color)', margin: '8px' }}></div>
                  <button onClick={onLogout} className="sidebar-link" style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', borderRadius: '8px', color: '#ff4b4b' }}>
                    Log Out
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </header>
  );
}
