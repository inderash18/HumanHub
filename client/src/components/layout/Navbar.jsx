import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Search, 
  Bell, 
  MessageSquare, 
  Plus, 
  ShieldCheck, 
  Settings, 
  LogOut, 
  User, 
  Fingerprint,
  ChevronDown,
  X,
  Users,
  Compass
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import api from '../../services/api';
import UserAvatar from '../common/UserAvatar';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import CreatePostModal from '../posts/CreatePostModal';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [unreadMsgs, setUnreadMsgs] = useState(0);

  const profileMenuRef = useRef(null);
  const searchContainerRef = useRef(null);

  // Close menus on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setProfileDropdownOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setSearchDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Fetch unread counters
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchCounts();
    }
  }, [isAuthenticated, user?._id, location.pathname]);

  const fetchCounts = async () => {
    try {
      const [notifRes, msgRes] = await Promise.all([
        api.get('/notifications/unread-count').catch(() => ({ data: { count: 0 } })),
        api.get('/messages/unread-count').catch(() => ({ data: { count: 0 } }))
      ]);
      setUnreadNotifs(notifRes.data?.count || 0);
      setUnreadMsgs(msgRes.data?.count || 0);
    } catch (err) {}
  };

  // Debounced user search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearchDropdownOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearching(true);
        const res = await api.get(`/users/search/query?q=${encodeURIComponent(searchQuery.trim())}`);
        setSearchResults(res.data || []);
        setSearchDropdownOpen(true);
      } catch (err) {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <>
      <header className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur-md border-b border-neutral-200 select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          
          {/* 1. Left: Brand Identity */}
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-black flex items-center justify-center text-white text-lg shadow-sm group-hover:bg-neutral-800 transition-colors">
                <Fingerprint className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-display font-extrabold text-base text-black tracking-tight leading-none">
                  Human<span className="text-neutral-500">Hub</span>
                </span>
                <span className="text-[10px] font-mono-code text-neutral-400 mt-0.5">Verified Social Network</span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              <Link 
                to="/feed" 
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                  location.pathname === '/feed' 
                    ? 'bg-neutral-100 text-black font-bold border border-neutral-200/80 shadow-sm' 
                    : 'text-neutral-600 hover:text-black hover:bg-neutral-50'
                }`}
              >
                Home Feed
              </Link>
              <Link 
                to="/explore" 
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  location.pathname === '/explore' 
                    ? 'bg-neutral-100 text-black font-bold border border-neutral-200/80 shadow-sm' 
                    : 'text-neutral-600 hover:text-black hover:bg-neutral-50'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                Discover
              </Link>
              <Link 
                to="/communities" 
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  location.pathname === '/communities' 
                    ? 'bg-neutral-100 text-black font-bold border border-neutral-200/80 shadow-sm' 
                    : 'text-neutral-600 hover:text-black hover:bg-neutral-50'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                Communities
              </Link>
            </nav>
          </div>

          {/* 2. Middle: Search Component */}
          <div ref={searchContainerRef} className="relative flex-1 max-w-xs sm:max-w-sm hidden sm:block">
            <div className="relative flex items-center">
              <Search className="absolute left-3.5 w-4 h-4 text-neutral-400 pointer-events-none" />
              <input 
                type="text"
                placeholder="Search people, posts, or communities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery.trim() && setSearchDropdownOpen(true)}
                className="w-full bg-neutral-50 border border-neutral-200 text-black text-xs rounded-xl pl-9 pr-3 py-2 outline-none focus:border-black focus:bg-white placeholder:text-neutral-400"
              />
            </div>

            {/* Live Search Dropdown */}
            {searchDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-neutral-200 rounded-2xl shadow-xl p-2 z-50 max-h-72 overflow-y-auto divide-y divide-neutral-100 animate-fade-in">
                {isSearching ? (
                  <p className="text-xs text-neutral-400 text-center py-4">Searching...</p>
                ) : searchResults.length > 0 ? (
                  searchResults.map((u) => (
                    <div 
                      key={u._id}
                      onClick={() => {
                        setSearchDropdownOpen(false);
                        setSearchQuery('');
                        navigate(`/u/${u.username}`);
                      }}
                      className="flex items-center justify-between p-2 rounded-xl hover:bg-neutral-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <UserAvatar 
                          src={u.avatar} 
                          name={u.displayName || u.username} 
                          size="xs"
                          verified={u.isVerified}
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-black truncate">{u.displayName || u.username}</p>
                          <p className="text-[10px] text-neutral-400 truncate">@{u.username}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-neutral-400 text-center py-4">No users found matching "{searchQuery}"</p>
                )}
              </div>
            )}
          </div>

          {/* 3. Right: User Actions & Profile Dropdown */}
          <div className="flex items-center gap-2.5">
            {isAuthenticated && user ? (
              <>
                {/* Create Post CTA */}
                <Button 
                  variant="primary"
                  size="sm"
                  onClick={() => setIsCreateOpen(true)}
                  icon={Plus}
                  className="hidden sm:inline-flex"
                >
                  Create
                </Button>

                {/* Messages Link */}
                <Link 
                  to="/messages" 
                  className={`relative p-2 rounded-xl border transition-colors ${
                    location.pathname === '/messages' 
                      ? 'bg-neutral-100 border-neutral-300 text-black' 
                      : 'bg-white border-neutral-200 text-neutral-600 hover:text-black hover:bg-neutral-50'
                  }`}
                  title="Messages"
                >
                  <MessageSquare className="w-4 h-4" />
                  {unreadMsgs > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-black text-white text-[9px] font-bold flex items-center justify-center">
                      {unreadMsgs}
                    </span>
                  )}
                </Link>

                {/* Notifications Link */}
                <Link 
                  to="/notifications" 
                  className={`relative p-2 rounded-xl border transition-colors ${
                    location.pathname === '/notifications' 
                      ? 'bg-neutral-100 border-neutral-300 text-black' 
                      : 'bg-white border-neutral-200 text-neutral-600 hover:text-black hover:bg-neutral-50'
                  }`}
                  title="Activity"
                >
                  <Bell className="w-4 h-4" />
                  {unreadNotifs > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-black text-white text-[9px] font-bold flex items-center justify-center">
                      {unreadNotifs}
                    </span>
                  )}
                </Link>

                {/* User Menu Trigger */}
                <div ref={profileMenuRef} className="relative">
                  <button 
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="flex items-center gap-1.5 p-1 rounded-xl border border-neutral-200 hover:border-neutral-300 transition-colors bg-white shadow-sm"
                  >
                    <UserAvatar 
                      src={user.avatar} 
                      name={user.displayName || user.username} 
                      size="xs"
                      verified={user.isVerified}
                    />
                    <ChevronDown className="w-3.5 h-3.5 text-neutral-500 mr-1" />
                  </button>

                  {/* Profile Dropdown Menu */}
                  {profileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-neutral-200 rounded-2xl shadow-2xl p-1.5 z-50 animate-fade-in divide-y divide-neutral-100">
                      <div className="p-2.5">
                        <p className="text-xs font-bold text-black truncate">{user.displayName || user.username}</p>
                        <p className="text-[11px] text-neutral-400 truncate">@{user.username}</p>
                      </div>

                      <div className="py-1">
                        <Link
                          to={`/u/${user.username}`}
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-neutral-700 hover:text-black hover:bg-neutral-50 transition-colors"
                        >
                          <User className="w-4 h-4" />
                          Profile
                        </Link>
                        <Link
                          to="/settings"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-neutral-700 hover:text-black hover:bg-neutral-50 transition-colors"
                        >
                          <Settings className="w-4 h-4" />
                          Settings & Privacy
                        </Link>
                      </div>

                      <div className="pt-1">
                        <button
                          onClick={() => {
                            setProfileDropdownOpen(false);
                            logout();
                            navigate('/login');
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-red-600 hover:bg-red-50 transition-colors text-left"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm">
                    Create Identity
                  </Button>
                </Link>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* Create Post Modal */}
      {isCreateOpen && (
        <CreatePostModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
      )}
    </>
  );
}
