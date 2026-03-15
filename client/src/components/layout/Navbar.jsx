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
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
      background: 'var(--bg-color)',
      borderBottom: '1px solid var(--border-color)',
      height: 'var(--nav-height)', display: 'flex', alignItems: 'center',
      padding: '0 16px', gap: '8px'
    }}>
      {/* Menu / Sidebar toggle - Reddit placeholder */}
      <button className="sidebar-link" style={{ padding: '8px', background: 'transparent' }}>
        <svg viewBox="0 0 24 24" fill="var(--text-primary)" width="24" height="24">
          <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
        </svg>
      </button>

      {/* Logo */}
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', marginRight: '8px' }}>
         <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="16" fill="var(--brand-color)"/>
            <path d="M11 9H15.5C18.5376 9 21 11.4624 21 14.5C21 17.5376 18.5376 20 15.5 20H11V9Z" fill="white"/>
            <path d="M11 20H15.5C18.5376 20 21 22.4624 21 25.5C21 28.5376 18.5376 31 15.5 31H11V20Z" fill="white"/>
         </svg>
        <span style={{ 
          fontSize: '22px', fontWeight: 800, color: 'white', 
          letterSpacing: '-0.5px', fontFamily: 'Outfit, sans-serif'
        }}>
          dhruvit
        </span>
      </Link>

      {/* Search Bar - Exactly like screenshot 1 */}
      <div style={{ flex: 1, maxWidth: '640px', position: 'relative' }}>
        <div className="search-bar-pill" style={{ paddingLeft: '40px', position: 'relative' }}>
          <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2.5" width="20" height="20">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
          </div>
          <input
            type="text"
            placeholder="Find anything"
            value={searchVal}
            onChange={e => setSearchVal(e.target.value)}
            style={{
              background: 'transparent', border: 'none', outline: 'none',
              fontSize: '15px', color: 'white', width: '100%', fontFamily: 'inherit'
            }}
          />
          {/* Ask Integration */}
          <button style={{
            background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', gap: '4px',
            padding: '4px 12px', cursor: 'pointer', borderLeft: '1px solid var(--border-color)', height: '100%',
            color: 'var(--text-primary)', fontSize: '14px', fontWeight: 600
          }}>
            <svg viewBox="0 0 24 24" fill="var(--brand-color)" width="18" height="18">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92c-.41.42-.67.83-.67 1.83h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>
            </svg>
            <span>Ask</span>
          </button>
        </div>
      </div>

      {/* Right Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
        {!isAuthenticated ? (
          <>
            <button 
              className="sidebar-link" 
              onClick={() => navigate('/login')}
              style={{ fontWeight: 700, padding: '8px 16px' }}
            >
              Log In
            </button>
            <button 
              className="btn-dhruvit" 
              onClick={() => navigate('/register')}
              style={{ padding: '8px 20px', minWidth: '100px' }}
            >
              Sign Up
            </button>
            <button className="sidebar-link" style={{ padding: '8px' }}>
                <svg viewBox="0 0 24 24" fill="var(--text-secondary)" width="20" height="20">
                    <circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/>
                </svg>
            </button>
          </>
        ) : (
          <>
            <button onClick={() => navigate('/submit')} className="sidebar-link" title="Create Post">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="22" height="22">
                    <path d="M12 5v14M5 12h14"/>
                </svg>
            </button>
            
            <div ref={menuRef} style={{ position: 'relative', marginLeft: '8px' }}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '4px',
                  background: 'transparent', border: 'none', cursor: 'pointer'
                }}
              >
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: 'var(--brand-color)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden', border: '2px solid var(--border-color)'
                }}>
                  {user?.avatar
                    ? <img src={user.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="avatar" />
                    : <span style={{ color: 'white', fontWeight: 800, fontSize: '14px' }}>{user?.username?.[0]?.toUpperCase()}</span>
                  }
                </div>
              </button>

              {userMenuOpen && (
                <div style={{
                  position: 'absolute', right: 0, top: 'calc(100% + 12px)',
                  width: '240px', background: 'var(--surface-color)', borderRadius: '12px', 
                  border: '1px solid var(--border-color)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', 
                  zIndex: 100, padding: '8px'
                }}>
                  <div style={{ padding: '12px', borderBottom: '1px solid var(--border-color)', marginBottom: '8px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'white' }}>{user?.username}</div>
                  </div>
                  
                  <Link to={`/u/${user?.username}`} onClick={() => setUserMenuOpen(false)} className="sidebar-link">
                    Profile
                  </Link>
                  <button onClick={onLogout} className="sidebar-link" style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer' }}>
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
