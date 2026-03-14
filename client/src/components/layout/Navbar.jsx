import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useAuth } from '../../hooks/useAuth';

export default function Navbar() {
  const { isAuthenticated, user } = useAuthStore();
  const { handleLogout } = useAuth();
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchVal, setSearchVal] = useState('');
  const menuRef = useRef(null);

  const onLogout = async () => {
    await handleLogout();
    navigate('/');
    setUserMenuOpen(false);
  };

  // Close menu on outside click
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
      background: '#ffffff', borderBottom: '1px solid #edeff1',
      height: '48px', display: 'flex', alignItems: 'center',
      padding: '0 20px', gap: '8px', boxShadow: '0 2px 4px rgba(0,0,0,.06)'
    }}>
      {/* Logo */}
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', flexShrink: 0 }}>
        <svg width="32" height="32" viewBox="0 0 20 20" fill="#ff4500">
          <circle cx="10" cy="10" r="10"/>
          <path d="M16.67 10a1.46 1.46 0 0 0-2.47-1 7.12 7.12 0 0 0-3.85-1.23l.65-3.08 2.13.45a1 1 0 1 0 1-.92 1 1 0 0 0-.96.68l-2.38-.5a.27.27 0 0 0-.32.2l-.73 3.44a7.14 7.14 0 0 0-3.89 1.23 1.46 1.46 0 1 0-1.61 2.39 2.87 2.87 0 0 0 0 .44c0 2.24 2.61 4.06 5.83 4.06s5.83-1.82 5.83-4.06a2.87 2.87 0 0 0 0-.44 1.46 1.46 0 0 0 .68-1.16zM7.27 11a1 1 0 1 1 1 1 1 1 0 0 1-1-1zm5.58 2.65a3.56 3.56 0 0 1-2.85.87 3.56 3.56 0 0 1-2.85-.87.23.23 0 0 1 .33-.33 3.15 3.15 0 0 0 2.52.69 3.15 3.15 0 0 0 2.52-.69.23.23 0 0 1 .33.33zm-.16-1.65a1 1 0 1 1 1-1 1 1 0 0 1-1 1z" fill="white"/>
        </svg>
        <span style={{ fontSize: '18px', fontWeight: 700, color: '#1c1c1c', letterSpacing: '-0.3px', fontFamily: 'IBM Plex Sans, sans-serif' }}>
          humanit
        </span>
      </Link>

      {/* Community Dropdown */}
      {isAuthenticated && (
        <div style={{ flexShrink: 0 }}>
          <Link to="/feed" style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '6px 10px', borderRadius: '4px', border: '1px solid transparent',
            textDecoration: 'none', color: '#1c1c1c', fontSize: '14px', fontWeight: 500,
            transition: 'border-color 0.1s'
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = '#edeff1'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}
          >
            🏠 <span style={{ fontSize: '14px' }}>Home</span>
            <svg viewBox="0 0 20 20" fill="#878a8c" width="16" height="16"><path d="M5 8l5 5 5-5z"/></svg>
          </Link>
        </div>
      )}

      {/* Search Bar */}
      <div style={{ flex: 1, maxWidth: '690px', margin: '0 8px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          background: searchFocused ? '#ffffff' : '#f6f7f8',
          border: `1px solid ${searchFocused ? '#0079d3' : '#edeff1'}`,
          borderRadius: '20px', padding: '0 16px', height: '36px',
          transition: 'all 0.15s', boxShadow: searchFocused ? '0 0 0 1px #0079d3' : 'none'
        }}>
          <svg viewBox="0 0 24 24" fill="none" stroke={searchFocused ? '#0079d3' : '#878a8c'} strokeWidth="2" width="16" height="16" style={{ flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder="Search HumanHub"
            value={searchVal}
            onChange={e => setSearchVal(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            style={{
              background: 'transparent', border: 'none', outline: 'none',
              fontSize: '14px', color: '#1c1c1c', width: '100%', fontFamily: 'inherit'
            }}
          />
        </div>
      </div>

      {/* Right Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto', flexShrink: 0 }}>
        {isAuthenticated ? (
          <>
            {/* Create Post */}
            <button
              onClick={() => navigate('/submit')}
              className="reddit-action-btn"
              style={{ border: '1px solid transparent', borderRadius: '20px', padding: '5px 12px', fontFamily: 'inherit' }}
            >
              <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18"><path d="M10 5a1 1 0 0 1 1 1v3h3a1 1 0 1 1 0 2h-3v3a1 1 0 1 1-2 0v-3H6a1 1 0 1 1 0-2h3V6a1 1 0 0 1 1-1z"/></svg>
              Create
            </button>

            {/* Notifications */}
            <button style={{
              width: '32px', height: '32px', borderRadius: '2px', border: 'none',
              background: 'transparent', cursor: 'pointer', color: '#878a8c',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.1s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#e2e2e2'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20">
                <path d="M10 2a6 6 0 0 0-6 6v3.586l-.707.707A1 1 0 0 0 4 14h12a1 1 0 0 0 .707-1.707L16 11.586V8a6 6 0 0 0-6-6zM10 18a3 3 0 0 1-3-3h6a3 3 0 0 1-3 3z"/>
              </svg>
            </button>

            {/* User Menu */}
            <div ref={menuRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '4px 8px', borderRadius: '2px', border: '1px solid transparent',
                  background: 'transparent', cursor: 'pointer', transition: 'border-color 0.1s',
                  borderColor: userMenuOpen ? '#edeff1' : 'transparent'
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#edeff1'}
                onMouseLeave={e => !userMenuOpen && (e.currentTarget.style.borderColor = 'transparent')}
              >
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: '#ff4500', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden', flexShrink: 0
                }}>
                  {user?.avatar
                    ? <img src={user.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="avatar" />
                    : <svg viewBox="0 0 20 20" fill="white" width="20" height="20"><path d="M10 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 7a7 7 0 0 1 14 0H3z"/></svg>
                  }
                </div>
                <div style={{ textAlign: 'left', display: 'none' }} className="md:block">
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#1c1c1c', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user?.username}
                  </div>
                  <div style={{ fontSize: '11px', color: '#878a8c' }}>
                    ✨ {Math.round((user?.trustScore || 0) * 100)}% Human
                  </div>
                </div>
                <svg viewBox="0 0 20 20" fill="#878a8c" width="16" height="16"><path d="M5 8l5 5 5-5z"/></svg>
              </button>

              {userMenuOpen && (
                <div style={{
                  position: 'absolute', right: 0, top: 'calc(100% + 4px)',
                  width: '200px', background: '#fff', border: '1px solid #ccc',
                  borderRadius: '4px', boxShadow: '0 2px 8px rgba(0,0,0,.15)', zIndex: 100, overflow: 'hidden'
                }}>
                  <div style={{ padding: '8px 16px', borderBottom: '1px solid #edeff1',  fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: '#878a8c', letterSpacing: '0.5px' }}>
                    My Stuff
                  </div>
                  <Link to={`/u/${user?.username}`} onClick={() => setUserMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', color: '#1c1c1c', textDecoration: 'none', fontSize: '14px' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f6f7f8'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path d="M10 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 7a7 7 0 0 1 14 0H3z"/></svg>
                    Profile
                  </Link>
                  <Link to="/submit" onClick={() => setUserMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', color: '#1c1c1c', textDecoration: 'none', fontSize: '14px' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f6f7f8'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path d="M10 5a1 1 0 0 1 1 1v3h3a1 1 0 1 1 0 2h-3v3a1 1 0 1 1-2 0v-3H6a1 1 0 1 1 0-2h3V6a1 1 0 0 1 1-1z"/></svg>
                    Create Post
                  </Link>
                  <div style={{ borderTop: '1px solid #edeff1', marginTop: '4px', paddingTop: '4px' }} />
                  <button onClick={onLogout} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', color: '#1c1c1c', fontSize: '14px', background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f6f7f8'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path d="M3 3h7v2H5v10h5v2H3V3zm11.293 3.293l1.414 1.414L12.414 11H17v2h-4.586l3.293 3.293-1.414 1.414L8.586 12l6.707-6.707z"/></svg>
                    Log Out
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn-reddit-outline" onClick={() => navigate('/login')} style={{ fontFamily: 'inherit' }}>Log In</button>
            <button className="btn-reddit-orange" onClick={() => navigate('/register')} style={{ fontFamily: 'inherit' }}>Sign Up</button>
          </div>
        )}
      </div>
    </header>
  );
}
