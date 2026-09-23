import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  Home,
  Search,
  Compass,
  Film,
  Send,
  Heart,
  PlusSquare,
  Menu,
  Bookmark,
  Sun,
  Moon,
  LogOut,
  Settings,
  ShieldCheck,
  X,
  User
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useUIStore } from '../../store/uiStore';
import api from '../../services/api';
import CreatePostModal from '../posts/CreatePostModal';
import UserAvatar from '../common/UserAvatar';

export default function Sidebar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { theme, toggleTheme } = useUIStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  // Drawers
  const [activeDrawer, setActiveDrawer] = useState(null); // 'search' | 'notifications' | null
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);

  // More menu popover
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchUnreadCounts();
    }
  }, [isAuthenticated, user?._id, location.pathname]);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target)) {
        setMoreMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchUnreadCounts = async () => {
    try {
      const [notifRes, msgRes] = await Promise.all([
        api.get('/notifications/unread-count').catch(() => ({ data: { count: 0 } })),
        api.get('/messages/unread-count').catch(() => ({ data: { count: 0 } }))
      ]);
      setUnreadNotifications(notifRes.data?.count || 0);
      setUnreadMessages(msgRes.data?.count || 0);
    } catch (err) {}
  };

  // Search logic
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        setIsSearching(true);
        const res = await api.get(`/users/search/query?q=${encodeURIComponent(searchQuery.trim())}`);
        setSearchResults(res.data || []);
      } catch (err) {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch Notifications when opening drawer
  useEffect(() => {
    if (activeDrawer === 'notifications') {
      setLoadingNotifs(true);
      api.get('/notifications')
        .then(res => setNotifications(Array.isArray(res.data) ? res.data : []))
        .catch(() => setNotifications([]))
        .finally(() => setLoadingNotifs(false));
    }
  }, [activeDrawer]);

  const handleDrawerToggle = (drawer) => {
    if (activeDrawer === drawer) {
      setActiveDrawer(null);
    } else {
      setActiveDrawer(drawer);
      if (drawer === 'search') setSearchQuery('');
    }
  };

  const isCollapsed = activeDrawer !== null;

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside 
        className={`hidden md:flex fixed top-0 left-0 h-screen z-30 bg-[var(--ig-bg)] border-r border-[var(--ig-border)] flex-col justify-between py-5 px-3 select-none transition-all duration-300 ${
          isCollapsed ? 'w-[72px]' : 'w-[72px] xl:w-[244px]'
        }`}
      >
        <div className="flex flex-col gap-5">
          {/* Logo Header */}
          <div className="h-10 flex items-center px-3 mb-2">
            <NavLink 
              to="/" 
              onClick={() => setActiveDrawer(null)}
              className="flex items-center gap-2 group"
            >
              {/* Collapsed or drawer open shows the camera/circle logo icon, full width shows HumanHub wordmark */}
              <div className={`${isCollapsed ? 'block' : 'block xl:hidden'}`}>
                <div className="w-7 h-7 rounded-lg bg-[var(--ig-text-primary)] text-[var(--ig-bg)] flex items-center justify-center font-bold text-sm">
                  H
                </div>
              </div>
              <div className={`${isCollapsed ? 'hidden' : 'hidden xl:block'}`}>
                <span className="font-logo text-2xl tracking-tight text-[var(--ig-text-primary)]">
                  HumanHub
                </span>
              </div>
            </NavLink>
          </div>

          {/* Nav Items */}
          <nav className="flex flex-col gap-1">
            {/* Home */}
            <NavLink
              to="/feed"
              onClick={() => setActiveDrawer(null)}
              className={({ isActive }) =>
                `flex items-center gap-4 px-3 py-3 rounded-lg text-sm transition-colors hover:bg-[var(--ig-hover)] ${
                  isActive && !activeDrawer ? 'font-bold text-[var(--ig-text-primary)]' : 'font-normal text-[var(--ig-text-primary)]'
                }`
              }
              title="Home"
            >
              {({ isActive }) => (
                <>
                  <Home className={`w-6 h-6 flex-shrink-0 ${isActive && !activeDrawer ? 'stroke-[2.8]' : 'stroke-[1.8]'}`} />
                  <span className={`${isCollapsed ? 'hidden' : 'hidden xl:inline'}`}>Home</span>
                </>
              )}
            </NavLink>

            {/* Search Trigger */}
            <button
              onClick={() => handleDrawerToggle('search')}
              className={`flex items-center gap-4 px-3 py-3 rounded-lg text-sm transition-colors hover:bg-[var(--ig-hover)] text-[var(--ig-text-primary)] ${
                activeDrawer === 'search' ? 'border border-[var(--ig-border)] font-bold' : 'font-normal'
              }`}
              title="Search"
            >
              <Search className={`w-6 h-6 flex-shrink-0 ${activeDrawer === 'search' ? 'stroke-[2.8]' : 'stroke-[1.8]'}`} />
              <span className={`${isCollapsed ? 'hidden' : 'hidden xl:inline'}`}>Search</span>
            </button>

            {/* Explore */}
            <NavLink
              to="/explore"
              onClick={() => setActiveDrawer(null)}
              className={({ isActive }) =>
                `flex items-center gap-4 px-3 py-3 rounded-lg text-sm transition-colors hover:bg-[var(--ig-hover)] ${
                  isActive && !activeDrawer ? 'font-bold text-[var(--ig-text-primary)]' : 'font-normal text-[var(--ig-text-primary)]'
                }`
              }
              title="Explore"
            >
              {({ isActive }) => (
                <>
                  <Compass className={`w-6 h-6 flex-shrink-0 ${isActive && !activeDrawer ? 'stroke-[2.8]' : 'stroke-[1.8]'}`} />
                  <span className={`${isCollapsed ? 'hidden' : 'hidden xl:inline'}`}>Explore</span>
                </>
              )}
            </NavLink>

            {/* Reels */}
            <NavLink
              to="/reels"
              onClick={() => setActiveDrawer(null)}
              className={({ isActive }) =>
                `flex items-center gap-4 px-3 py-3 rounded-lg text-sm transition-colors hover:bg-[var(--ig-hover)] ${
                  isActive && !activeDrawer ? 'font-bold text-[var(--ig-text-primary)]' : 'font-normal text-[var(--ig-text-primary)]'
                }`
              }
              title="Reels"
            >
              {({ isActive }) => (
                <>
                  <Film className={`w-6 h-6 flex-shrink-0 ${isActive && !activeDrawer ? 'stroke-[2.8]' : 'stroke-[1.8]'}`} />
                  <span className={`${isCollapsed ? 'hidden' : 'hidden xl:inline'}`}>Reels</span>
                </>
              )}
            </NavLink>

            {/* Messages */}
            <NavLink
              to="/messages"
              onClick={() => setActiveDrawer(null)}
              className={({ isActive }) =>
                `relative flex items-center gap-4 px-3 py-3 rounded-lg text-sm transition-colors hover:bg-[var(--ig-hover)] ${
                  isActive && !activeDrawer ? 'font-bold text-[var(--ig-text-primary)]' : 'font-normal text-[var(--ig-text-primary)]'
                }`
              }
              title="Messages"
            >
              {({ isActive }) => (
                <>
                  <div className="relative">
                    <Send className={`w-6 h-6 flex-shrink-0 ${isActive && !activeDrawer ? 'stroke-[2.8]' : 'stroke-[1.8]'}`} />
                    {unreadMessages > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[var(--ig-like)] text-white text-[10px] font-bold flex items-center justify-center">
                        {unreadMessages}
                      </span>
                    )}
                  </div>
                  <span className={`${isCollapsed ? 'hidden' : 'hidden xl:inline'}`}>Messages</span>
                </>
              )}
            </NavLink>

            {/* Notifications */}
            <button
              onClick={() => handleDrawerToggle('notifications')}
              className={`relative flex items-center gap-4 px-3 py-3 rounded-lg text-sm transition-colors hover:bg-[var(--ig-hover)] text-[var(--ig-text-primary)] ${
                activeDrawer === 'notifications' ? 'border border-[var(--ig-border)] font-bold' : 'font-normal'
              }`}
              title="Notifications"
            >
              <div className="relative">
                <Heart className={`w-6 h-6 flex-shrink-0 ${activeDrawer === 'notifications' ? 'fill-current stroke-[2.5]' : 'stroke-[1.8]'}`} />
                {unreadNotifications > 0 && (
                  <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-[var(--ig-like)] ring-2 ring-[var(--ig-bg)]" />
                )}
              </div>
              <span className={`${isCollapsed ? 'hidden' : 'hidden xl:inline'}`}>Notifications</span>
            </button>

            {/* Create */}
            <button
              onClick={() => {
                setActiveDrawer(null);
                if (!isAuthenticated) navigate('/?mode=signin');
                else setIsCreateOpen(true);
              }}
              className="flex items-center gap-4 px-3 py-3 rounded-lg text-sm transition-colors hover:bg-[var(--ig-hover)] text-[var(--ig-text-primary)] font-normal"
              title="Create"
            >
              <PlusSquare className="w-6 h-6 flex-shrink-0 stroke-[1.8]" />
              <span className={`${isCollapsed ? 'hidden' : 'hidden xl:inline'}`}>Create</span>
            </button>

            {/* Profile */}
            <NavLink
              to={user ? `/u/${user.username}` : '/?mode=signin'}
              onClick={() => setActiveDrawer(null)}
              className={({ isActive }) =>
                `flex items-center gap-4 px-3 py-2.5 rounded-lg text-sm transition-colors hover:bg-[var(--ig-hover)] ${
                  isActive && !activeDrawer ? 'font-bold text-[var(--ig-text-primary)]' : 'font-normal text-[var(--ig-text-primary)]'
                }`
              }
              title="Profile"
            >
              {({ isActive }) => (
                <>
                  <div className={`p-[1.5px] rounded-full ${isActive && !activeDrawer ? 'ring-2 ring-[var(--ig-text-primary)]' : ''}`}>
                    <UserAvatar 
                      src={user?.avatar} 
                      name={user?.displayName || user?.username} 
                      size="xs"
                    />
                  </div>
                  <span className={`${isCollapsed ? 'hidden' : 'hidden xl:inline'} truncate`}>
                    {user ? 'Profile' : 'Sign In'}
                  </span>
                </>
              )}
            </NavLink>
          </nav>
        </div>

        {/* Bottom More Button */}
        <div ref={moreMenuRef} className="relative pt-2">
          <button
            onClick={() => setMoreMenuOpen(!moreMenuOpen)}
            className={`w-full flex items-center gap-4 px-3 py-3 rounded-lg text-sm transition-colors hover:bg-[var(--ig-hover)] text-[var(--ig-text-primary)] ${
              moreMenuOpen ? 'font-bold bg-[var(--ig-hover)]' : 'font-normal'
            }`}
            title="More"
          >
            <Menu className="w-6 h-6 flex-shrink-0 stroke-[1.8]" />
            <span className={`${isCollapsed ? 'hidden' : 'hidden xl:inline'}`}>More</span>
          </button>

          {/* More Menu Popover */}
          {moreMenuOpen && (
            <div className="absolute bottom-full left-0 mb-2 w-64 bg-[var(--ig-elevated)] border border-[var(--ig-border)] rounded-2xl shadow-2xl p-1.5 z-50 divide-y divide-[var(--ig-border)] select-none">
              <div className="py-1">
                <button
                  onClick={() => { setMoreMenuOpen(false); navigate('/settings'); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-xs text-[var(--ig-text-primary)] hover:bg-[var(--ig-highlight)] rounded-xl transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </button>
                <button
                  onClick={() => { setMoreMenuOpen(false); navigate('/saved'); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-xs text-[var(--ig-text-primary)] hover:bg-[var(--ig-highlight)] rounded-xl transition-colors"
                >
                  <Bookmark className="w-4 h-4" />
                  Saved
                </button>
                <button
                  onClick={toggleTheme}
                  className="w-full flex items-center justify-between px-3 py-2.5 text-xs text-[var(--ig-text-primary)] hover:bg-[var(--ig-highlight)] rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                    Switch appearance
                  </div>
                  <span className="text-[10px] text-[var(--ig-text-tertiary)] uppercase font-semibold">
                    {theme === 'dark' ? 'Dark' : 'Light'}
                  </span>
                </button>
                {user && ['admin', 'moderator'].includes(user.role) && (
                  <button
                    onClick={() => { setMoreMenuOpen(false); navigate('/moderation'); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-xs text-amber-400 hover:bg-[var(--ig-highlight)] rounded-xl transition-colors"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Moderation Center
                  </button>
                )}
              </div>

              {isAuthenticated && (
                <div className="pt-1">
                  <button
                    onClick={() => {
                      setMoreMenuOpen(false);
                      logout();
                      navigate('/login');
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-xs text-[var(--ig-text-primary)] hover:bg-[var(--ig-highlight)] rounded-xl transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4 text-red-500" />
                    Log out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* ================= SEARCH SLIDE-OUT DRAWER ================= */}
      {activeDrawer === 'search' && (
        <div className="hidden md:flex fixed top-0 left-[72px] w-96 h-screen bg-[var(--ig-bg)] border-r border-[var(--ig-border)] z-20 flex-col shadow-2xl animate-fade-in select-none">
          <div className="p-6 border-b border-[var(--ig-border)]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[var(--ig-text-primary)]">Search</h2>
              <button 
                onClick={() => setActiveDrawer(null)}
                className="p-1 rounded-full text-[var(--ig-text-tertiary)] hover:text-[var(--ig-text-primary)] hover:bg-[var(--ig-hover)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ig-text-tertiary)]" />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="w-full bg-[var(--ig-elevated)] text-sm text-[var(--ig-text-primary)] placeholder:text-[var(--ig-text-tertiary)] rounded-lg pl-10 pr-8 py-2 outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[var(--ig-text-tertiary)] text-[var(--ig-bg)] flex items-center justify-center text-[10px]"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto py-2">
            {isSearching ? (
              <p className="text-xs text-[var(--ig-text-tertiary)] text-center py-8">Searching...</p>
            ) : searchResults.length > 0 ? (
              searchResults.map((u) => (
                <div
                  key={u._id}
                  onClick={() => {
                    setActiveDrawer(null);
                    navigate(`/u/${u.username}`);
                  }}
                  className="flex items-center gap-3 px-6 py-3 hover:bg-[var(--ig-hover)] cursor-pointer transition-colors"
                >
                  <UserAvatar src={u.avatar} name={u.displayName || u.username} size="md" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--ig-text-primary)] truncate">{u.username}</p>
                    <p className="text-xs text-[var(--ig-text-secondary)] truncate">{u.displayName || u.username}</p>
                  </div>
                </div>
              ))
            ) : searchQuery ? (
              <p className="text-xs text-[var(--ig-text-tertiary)] text-center py-8">No results found.</p>
            ) : (
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-semibold text-[var(--ig-text-primary)]">Recent</span>
                  <span className="text-xs font-semibold text-[var(--ig-primary-button)] cursor-pointer hover:opacity-75">Clear all</span>
                </div>
                <p className="text-xs text-[var(--ig-text-tertiary)] text-center py-10">No recent searches.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= NOTIFICATIONS SLIDE-OUT DRAWER ================= */}
      {activeDrawer === 'notifications' && (
        <div className="hidden md:flex fixed top-0 left-[72px] w-96 h-screen bg-[var(--ig-bg)] border-r border-[var(--ig-border)] z-20 flex-col shadow-2xl animate-fade-in select-none">
          <div className="p-6 border-b border-[var(--ig-border)] flex items-center justify-between">
            <h2 className="text-xl font-bold text-[var(--ig-text-primary)]">Notifications</h2>
            <button 
              onClick={() => setActiveDrawer(null)}
              className="p-1 rounded-full text-[var(--ig-text-tertiary)] hover:text-[var(--ig-text-primary)] hover:bg-[var(--ig-hover)]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-3">
            {loadingNotifs ? (
              <p className="text-xs text-[var(--ig-text-tertiary)] text-center py-8">Loading notifications...</p>
            ) : notifications.length > 0 ? (
              notifications.map((n) => (
                <div 
                  key={n._id}
                  onClick={() => {
                    setActiveDrawer(null);
                    if (n.post) navigate(`/p/${n.post._id || n.post}`);
                    else if (n.sender) navigate(`/u/${n.sender.username}`);
                  }}
                  className="flex items-center justify-between gap-3 px-6 py-3 hover:bg-[var(--ig-hover)] cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <UserAvatar src={n.sender?.avatar} name={n.sender?.username} size="md" />
                    <div className="text-xs text-[var(--ig-text-primary)] leading-snug">
                      <span className="font-semibold">{n.sender?.username || 'someone'}</span>{' '}
                      {n.message || (n.type === 'like' ? 'liked your photo.' : n.type === 'comment' ? 'commented on your post.' : 'started following you.')}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-[var(--ig-text-tertiary)] text-center py-12">No notifications yet.</p>
            )}
          </div>
        </div>
      )}

      {/* Create Post Modal */}
      {isCreateOpen && (
        <CreatePostModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
      )}
    </>
  );
}
