import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useAuth } from '../../hooks/useAuth';
import { FiSearch, FiPlusSquare, FiBell, FiMessageSquare, FiX, FiTrendingUp } from 'react-icons/fi';
import api from '../../services/api';

export default function Navbar() {
  const { isAuthenticated, user } = useAuthStore();
  const { handleLogout } = useAuth();
  const navigate = useNavigate();

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchVal, setSearchVal] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState(() => {
    return JSON.parse(localStorage.getItem('recent_searches') || '["watercolors", "ai verification", "organicsocial"]');
  });

  const menuRef = useRef(null);
  const searchRef = useRef(null);

  const onLogout = async () => {
    await handleLogout();
    navigate('/');
    setUserMenuOpen(false);
  };

  // Click outside to close menus
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    if (!searchVal.trim()) {
      setSuggestions([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      try {
        const res = await api.get(`/users/search/query?q=${encodeURIComponent(searchVal)}`);
        setSuggestions((res.data || []).map(u => ({
          type: 'user',
          name: u.username,
          handle: u.username,
          detail: `Trust Score: ${Math.round(u.trustScore * 100)}%`
        })));
      } catch (err) {
        console.error(err);
      }
    }, 250);

    return () => clearTimeout(delayDebounce);
  }, [searchVal]);

  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter' && searchVal.trim()) {
      saveRecentSearch(searchVal.trim());
      setSearchFocused(false);
      navigate(`/feed?search=${encodeURIComponent(searchVal)}`);
    }
  };

  const saveRecentSearch = (query) => {
    const updated = [query, ...recentSearches.filter(q => q !== query)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recent_searches', JSON.stringify(updated));
  };

  const deleteRecentSearch = (e, query) => {
    e.stopPropagation();
    const updated = recentSearches.filter(q => q !== query);
    setRecentSearches(updated);
    localStorage.setItem('recent_searches', JSON.stringify(updated));
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-14 z-50 flex items-center justify-between px-6 border-b border-[var(--border-color)] nav-premium-blur">
      {/* Left: Brand Logo */}
      <Link to="/" className="flex items-center gap-2.5 no-underline select-none">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-[var(--brand-color)]">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" />
          <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
        <span className="font-brand text-lg font-black tracking-[-0.04em] text-[var(--text-primary)]">
          HumanHub
        </span>
      </Link>

      {/* Center: Search pill with Suggestion Overlay */}
      <div ref={searchRef} className="hidden sm:block flex-1 max-w-sm mx-4 relative">
        <div className="flex items-center gap-2 px-3.5 h-9 rounded-full bg-[var(--surface-hover)] border border-transparent focus-within:border-[var(--border-color)] transition-all">
          <FiSearch className="text-[var(--text-secondary)] text-md" />
          <input
            type="text"
            placeholder="Search verified content..."
            value={searchVal}
            onChange={e => setSearchVal(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onKeyDown={handleSearchSubmit}
            className="bg-transparent border-none outline-none text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] w-full font-medium"
          />
          {searchVal && (
            <button onClick={() => setSearchVal('')} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
              <FiX className="text-sm" />
            </button>
          )}
        </div>

        {/* Suggestion Dropdown Drop */}
        {searchFocused && (
          <div className="absolute left-0 right-0 top-11 bg-[var(--surface-color)] border border-[var(--border-color)] rounded-[20px] shadow-2xl z-50 p-4 flex flex-col gap-4 animate-in">
            {/* If input has query values -> Show matched suggestions */}
            {searchVal.trim() !== '' ? (
              <div className="flex flex-col gap-3">
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-[var(--text-secondary)]">Matched Results</span>
                <div className="flex flex-col gap-2.5">
                  {suggestions.length === 0 ? (
                    <span className="text-xs text-[var(--text-muted)] italic">No verified match found.</span>
                  ) : (
                    suggestions.map((c, idx) => (
                      <div 
                        key={idx}
                        onClick={() => {
                          saveRecentSearch(searchVal.trim());
                          setSearchFocused(false);
                          navigate(c.type === 'user' ? `/u/${c.handle}` : `/${c.handle}`);
                        }}
                        className="flex items-center justify-between p-2 rounded-xl hover:bg-[var(--surface-hover)] cursor-pointer transition-colors"
                      >
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-[var(--text-primary)]">{c.name}</span>
                          <span className="text-[10px] text-[var(--text-secondary)]">@{c.handle}</span>
                        </div>
                        <span className="text-[10px] font-semibold text-[var(--text-muted)] bg-[var(--surface-hover)] px-2 py-0.5 rounded">
                          {c.detail}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              // Empty search input -> Show Recent & Trending searches
              <>
                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <span className="text-[9px] font-extrabold uppercase tracking-wider text-[var(--text-secondary)]">Recent Searches</span>
                    <div className="flex flex-wrap gap-1.5">
                      {recentSearches.map((q, idx) => (
                        <div 
                          key={idx}
                          onClick={() => {
                            setSearchVal(q);
                            saveRecentSearch(q);
                            setSearchFocused(false);
                            navigate(`/feed?search=${encodeURIComponent(q)}`);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--surface-hover)] hover:bg-[var(--border-color)] text-[10px] font-bold text-[var(--text-primary)] cursor-pointer transition-colors"
                        >
                          <span>{q}</span>
                          <button 
                            onClick={(e) => deleteRecentSearch(e, q)}
                            className="text-[var(--text-secondary)] hover:text-red-500 transition-colors"
                          >
                            <FiX size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Trending Topics */}
                <div className="flex flex-col gap-2 border-t border-[var(--border-color)] pt-3">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-1">
                    <FiTrendingUp className="text-[var(--brand-color)]" />
                    <span>Trending Searches</span>
                  </span>
                  <div className="flex flex-col gap-2 mt-1">
                    {['#watercolors', '#yosemite', '#proofofhumanity', '#linearstyle'].map((tag, idx) => (
                      <div 
                        key={idx}
                        onClick={() => {
                          setSearchVal(tag);
                          saveRecentSearch(tag);
                          setSearchFocused(false);
                          navigate(`/feed?search=${encodeURIComponent(tag)}`);
                        }}
                        className="text-xs font-semibold text-[var(--text-primary)] hover:text-[var(--brand-color)] cursor-pointer flex items-center justify-between"
                      >
                        <span>{tag}</span>
                        <span className="text-[9px] text-[var(--text-muted)] font-mono">{(8.4 - idx * 1.5).toFixed(1)}k searches</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-4">
        {!isAuthenticated ? (
          <>
            <button 
              onClick={() => navigate('/login')}
              className="text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-3 py-2 transition-colors"
            >
              Log In
            </button>
            <button 
              onClick={() => navigate('/register')}
              className="btn-premium py-1.5 px-4 text-xs"
            >
              Sign Up
            </button>
          </>
        ) : (
          <>
            {/* Create Action Button */}
            <Link 
              to="/submit" 
              className="hidden sm:inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-all text-xs font-semibold"
            >
              <FiPlusSquare className="text-sm" />
              <span>Create</span>
            </Link>

            {/* Notifications Button */}
            <Link to="/notifications" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1.5 relative transition-colors">
              <FiBell className="text-xl" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[var(--brand-color)] rounded-full border-2 border-[var(--bg-color)]"></span>
            </Link>

            {/* Messages Button */}
            <Link to="/messages" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1.5 transition-colors">
              <FiMessageSquare className="text-xl" />
            </Link>

            {/* Profile Menu Trigger */}
            <div ref={menuRef} className="relative flex items-center">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="w-8 h-8 rounded-full border border-[var(--border-color)] overflow-hidden flex items-center justify-center bg-[var(--surface-hover)] focus:outline-none"
              >
                {user?.avatar ? (
                  <img src={user.avatar} className="w-full h-full object-cover" alt="" />
                ) : (
                  <span className="text-[var(--text-primary)] font-bold text-xs uppercase">{user?.username?.[0]}</span>
                )}
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-10 w-56 bg-[var(--surface-color)] border border-[var(--border-color)] rounded-xl shadow-xl z-50 p-1.5 animate-in">
                  <div className="px-3.5 py-2.5 border-b border-[var(--border-color)] mb-1">
                    <div className="text-[13px] font-bold text-[var(--text-primary)]">{user?.username}</div>
                    <div className="text-[10px] text-[var(--text-muted)] mt-0.5">Verified Human</div>
                  </div>
                  
                  <Link 
                    to={`/u/${user?.username}`} 
                    onClick={() => setUserMenuOpen(false)}
                    className="block px-3.5 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] rounded-lg transition-all"
                  >
                    Profile
                  </Link>
                  <Link 
                    to="/settings" 
                    onClick={() => setUserMenuOpen(false)}
                    className="block px-3.5 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] rounded-lg transition-all"
                  >
                    Settings
                  </Link>
                  <div className="h-[1px] bg-[var(--border-color)] my-1"></div>
                  <button 
                    onClick={onLogout}
                    className="w-full text-left px-3.5 py-2 text-xs font-semibold text-red-500 hover:bg-red-500/5 rounded-lg transition-all"
                  >
                    Logout
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
