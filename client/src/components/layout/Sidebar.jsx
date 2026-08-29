import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  Activity, 
  Compass, 
  Users,
  Bookmark,
  MessageSquare, 
  Bell, 
  Plus, 
  Search,
  Settings, 
  User,
  Fingerprint,
  X,
  Sun,
  Moon
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useUIStore } from '../../store/uiStore';
import api from '../../services/api';
import CreatePostModal from '../posts/CreatePostModal';
import UserAvatar from '../common/UserAvatar';
import Button from '../ui/Button';

export default function Sidebar() {
  const { user, isAuthenticated } = useAuthStore();
  const { theme, toggleTheme } = useUIStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchUnreadCounts();
    }
  }, [isAuthenticated, user?._id, location.pathname]);

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

  const navItems = [
    { 
      path: '/feed', 
      label: 'Feed', 
      icon: Activity,
      requireAuth: true
    },
    { 
      path: '/explore', 
      label: 'Discover', 
      icon: Compass 
    },
    { 
      path: '/communities', 
      label: 'Communities', 
      icon: Users 
    },
    { 
      path: '/messages', 
      label: 'Messages', 
      icon: MessageSquare,
      badge: unreadMessages > 0 ? unreadMessages : null,
      requireAuth: true
    },
    { 
      path: '/notifications', 
      label: 'Notifications', 
      icon: Bell,
      badge: unreadNotifications > 0 ? unreadNotifications : null,
      requireAuth: true
    },
    { 
      path: '/saved', 
      label: 'Saved', 
      icon: Bookmark,
      requireAuth: true
    },
    { 
      path: user ? `/u/${user.username}` : '/login', 
      label: 'Profile', 
      isProfile: true,
      requireAuth: true
    }
  ];

  return (
    <>
      <aside className="hidden md:flex fixed top-0 left-0 h-screen w-[72px] xl:w-[240px] bg-hub-surface border-r border-hub-border z-30 flex-col justify-between p-3.5 select-none transition-all duration-150">
        <div className="flex flex-col gap-4">
          
          {/* Brand Logo Header */}
          <NavLink 
            to="/" 
            className="flex items-center gap-3 px-2 py-2 rounded-2xl hover:bg-hub-surface-elevated transition-colors group"
          >
            <div className="w-9 h-9 rounded-xl bg-hub-accent flex items-center justify-center text-white text-base shadow-sm group-hover:opacity-90 transition-opacity flex-shrink-0">
              <Fingerprint className="w-5 h-5" />
            </div>
            <div className="hidden xl:flex flex-col">
              <span className="font-display text-base font-extrabold text-hub-text-primary tracking-tight leading-tight">
                Human<span className="text-hub-accent">Hub</span>
              </span>
              <span className="text-[10px] font-medium text-hub-text-tertiary">Social Space</span>
            </div>
          </NavLink>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1">
            {/* Search Trigger */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className={`flex items-center gap-3.5 px-3 py-2.5 rounded-xl transition-all ${
                searchOpen
                  ? 'bg-hub-surface-elevated text-hub-text-primary font-bold border border-hub-border'
                  : 'text-hub-text-secondary hover:bg-hub-surface-elevated hover:text-hub-text-primary'
              }`}
            >
              <Search className="w-4 h-4 flex-shrink-0 text-hub-text-tertiary" />
              <span className="hidden xl:inline text-xs font-semibold tracking-wide">
                Search
              </span>
            </button>

            {navItems.map((item) => {
              if (item.requireAuth && !isAuthenticated) return null;

              const Icon = item.icon;

              if (item.isProfile) {
                return (
                  <NavLink
                    key={item.label}
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center gap-3.5 px-3 py-2.5 rounded-xl transition-all ${
                        isActive
                          ? 'bg-hub-surface-elevated text-hub-text-primary font-bold border border-hub-border shadow-sm'
                          : 'text-hub-text-secondary hover:bg-hub-surface-elevated hover:text-hub-text-primary'
                      }`
                    }
                  >
                    <UserAvatar 
                      src={user?.avatar} 
                      name={user?.displayName || user?.username} 
                      size="xs"
                      className="flex-shrink-0"
                    />
                    <span className="hidden xl:inline text-xs font-semibold tracking-wide truncate">
                      {user ? `@${user.username}` : 'Profile'}
                    </span>
                  </NavLink>
                );
              }

              return (
                <NavLink
                  key={item.label}
                  to={item.path}
                  className={({ isActive }) =>
                    `relative flex items-center gap-3.5 px-3 py-2.5 rounded-xl transition-all ${
                      isActive
                        ? 'bg-hub-surface-elevated text-hub-text-primary font-bold border border-hub-border shadow-sm'
                        : 'text-hub-text-secondary hover:bg-hub-surface-elevated hover:text-hub-text-primary'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className="relative flex-shrink-0">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-hub-accent' : 'text-hub-text-tertiary'}`} />
                        {item.badge && (
                          <span className="absolute -top-1.5 -right-2 w-4 h-4 rounded-full bg-hub-accent text-white text-[9px] font-bold flex items-center justify-center">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <span className="hidden xl:inline text-xs font-semibold tracking-wide">
                        {item.label}
                      </span>
                    </>
                  )}
                </NavLink>
              );
            })}

            {/* Quick Create Post Action */}
            {isAuthenticated && (
              <Button
                variant="primary"
                size="md"
                onClick={() => setIsCreateOpen(true)}
                icon={Plus}
                className="mt-3 w-full justify-center xl:justify-start shadow-sm"
              >
                <span className="hidden xl:inline">Create Post</span>
              </Button>
            )}
          </nav>
        </div>

        {/* Bottom User Area */}
        <div className="pt-3 border-t border-hub-border flex flex-col gap-2">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="flex items-center gap-3.5 px-3 py-2 rounded-xl text-hub-text-secondary hover:bg-hub-surface-elevated hover:text-hub-text-primary transition-all group"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400 group-hover:rotate-45 transition-transform" />
              ) : (
                <Moon className="w-4 h-4 text-hub-text-secondary group-hover:-rotate-12 transition-transform" />
              )}
            </div>
            <span className="hidden xl:inline text-xs font-semibold tracking-wide">
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </span>
          </button>

          {isAuthenticated && user ? (
            <div className="p-2 rounded-xl bg-hub-surface-elevated border border-hub-border flex items-center justify-between shadow-sm">
              <NavLink to={`/u/${user.username}`} className="flex items-center gap-2.5 min-w-0">
                <UserAvatar 
                  src={user.avatar} 
                  name={user.displayName || user.username} 
                  size="xs"
                />
                <div className="hidden xl:flex flex-col text-left min-w-0">
                  <span className="text-xs font-bold text-hub-text-primary truncate">
                    {user.displayName || user.username}
                  </span>
                  <span className="text-[10px] text-hub-text-tertiary truncate">
                    @{user.username}
                  </span>
                </div>
              </NavLink>
              <NavLink to="/settings" className="hidden xl:block text-hub-text-tertiary hover:text-hub-text-primary p-1" title="Settings">
                <Settings className="w-3.5 h-3.5" />
              </NavLink>
            </div>
          ) : (
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate('/login')}
              className="w-full"
            >
              <span className="hidden xl:inline">Sign In</span>
              <span className="xl:hidden text-xs">🔑</span>
            </Button>
          )}
        </div>
      </aside>

      {/* Slide-out Search Panel */}
      {searchOpen && (
        <div className="hidden md:block fixed top-0 left-[72px] xl:left-[240px] w-80 h-screen bg-hub-surface border-r border-hub-border z-40 p-4 shadow-2xl animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-sm font-bold text-hub-text-primary">Search People</h3>
            <button 
              onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
              className="p-1 rounded-lg text-hub-text-tertiary hover:text-hub-text-primary hover:bg-hub-surface-elevated"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-hub-text-tertiary" />
            <input 
              type="text"
              placeholder="Search by username or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              className="w-full bg-hub-surface-elevated border border-hub-border text-hub-text-primary text-xs rounded-xl pl-9 pr-3 py-2 outline-none focus:border-hub-accent"
            />
          </div>

          <div className="space-y-1 overflow-y-auto max-h-[calc(100vh-140px)]">
            {isSearching ? (
              <p className="text-xs text-hub-text-tertiary text-center py-6">Searching...</p>
            ) : searchResults.length > 0 ? (
              searchResults.map(u => (
                <div 
                  key={u._id}
                  onClick={() => {
                    setSearchOpen(false);
                    setSearchQuery('');
                    navigate(`/u/${u.username}`);
                  }}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-hub-surface-elevated cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <UserAvatar src={u.avatar} name={u.displayName || u.username} size="xs" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-hub-text-primary truncate">{u.displayName || u.username}</p>
                      <p className="text-[10px] text-hub-text-tertiary truncate">@{u.username}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : searchQuery ? (
              <p className="text-xs text-hub-text-tertiary text-center py-6">No users found matching "{searchQuery}"</p>
            ) : (
              <p className="text-xs text-hub-text-tertiary text-center py-6">Type to search people and profiles.</p>
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
