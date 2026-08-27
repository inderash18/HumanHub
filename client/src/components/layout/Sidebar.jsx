import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  IoHomeOutline, IoHome, 
  IoSearchOutline, IoSearch,
  IoCompassOutline, IoCompass,
  IoPaperPlaneOutline, IoPaperPlane,
  IoHeartOutline, IoHeart,
  IoMenuOutline,
  IoShieldCheckmark,
  IoSettingsOutline,
  IoLogOutOutline,
  IoClose
} from 'react-icons/io5';
import { BsPlusSquare, BsPlusSquareFill, BsCameraReels, BsCameraReelsFill } from 'react-icons/bs';
import { MdVerified } from 'react-icons/md';
import { useAuthStore } from '../../store/useAuthStore';
import CreatePostModal from '../posts/CreatePostModal';

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [searchDrawerOpen, setSearchDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const navItems = [
    { label: 'Home', path: '/', outline: IoHomeOutline, filled: IoHome },
    { 
      label: 'Search', 
      onClick: () => setSearchDrawerOpen(!searchDrawerOpen),
      outline: IoSearchOutline, 
      filled: IoSearch,
      active: searchDrawerOpen
    },
    { label: 'Explore', path: '/explore', outline: IoCompassOutline, filled: IoCompass },
    { label: 'Reels', path: '/reels', outline: BsCameraReels, filled: BsCameraReelsFill },
    { label: 'Messages', path: '/messages', outline: IoPaperPlaneOutline, filled: IoPaperPlane, badge: 2 },
    { label: 'Notifications', path: '/notifications', outline: IoHeartOutline, filled: IoHeart },
    { 
      label: 'Create', 
      onClick: () => setIsCreateOpen(true),
      outline: BsPlusSquare, 
      filled: BsPlusSquareFill 
    },
    { 
      label: 'Profile', 
      path: user ? `/u/${user.username}` : '/login',
      isProfile: true
    }
  ];

  return (
    <>
      <aside className="fixed top-0 left-0 h-screen w-[72px] xl:w-[245px] border-r border-[#262626] bg-black z-40 flex flex-col justify-between p-3 xl:px-4 xl:py-6 transition-all duration-300 select-none">
        {/* Top Logo */}
        <div className="flex flex-col gap-6">
          <div 
            onClick={() => navigate('/')} 
            className="cursor-pointer px-2 py-3 flex items-center gap-3 group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] flex items-center justify-center text-white shadow-lg shadow-pink-500/20 group-hover:scale-105 transition-transform">
              <span className="font-bold text-lg">H</span>
            </div>
            <div className="hidden xl:flex flex-col">
              <span className="font-brand text-2xl font-bold tracking-tight text-white flex items-center gap-1.5">
                HumanHub
                <MdVerified className="text-[#0095f6] text-base" title="Human-Only Verified Network" />
              </span>
              <span className="text-[10px] text-[#737373] tracking-wider uppercase font-medium -mt-1">
                Proof of Humanity
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5">
            {navItems.map((item, idx) => {
              const isActive = item.path ? location.pathname === item.path : item.active;
              const Icon = isActive ? (item.filled || item.outline) : item.outline;

              if (item.onClick) {
                return (
                  <button
                    key={idx}
                    onClick={item.onClick}
                    className={`w-full flex items-center gap-4 px-3 py-3 rounded-xl text-left transition-all group hover:bg-[#1a1a1a] ${
                      isActive ? 'font-bold text-white' : 'text-[#f5f5f5] hover:text-white'
                    }`}
                  >
                    <div className="relative text-2xl group-hover:scale-110 transition-transform">
                      {Icon && <Icon />}
                      {item.badge && (
                        <span className="absolute -top-1 -right-1.5 w-4 h-4 bg-[#ff3040] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <span className="hidden xl:inline text-[15px]">{item.label}</span>
                  </button>
                );
              }

              if (item.isProfile) {
                return (
                  <NavLink
                    key={idx}
                    to={item.path}
                    className={({ isActive }) =>
                      `w-full flex items-center gap-4 px-3 py-3 rounded-xl transition-all group hover:bg-[#1a1a1a] ${
                        isActive ? 'font-bold text-white' : 'text-[#f5f5f5] hover:text-white'
                      }`
                    }
                  >
                    <div className="relative">
                      <div className={`w-7 h-7 rounded-full p-[1.5px] ${isActive ? 'ring-2 ring-white' : ''}`}>
                        <img 
                          src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} 
                          alt="profile" 
                          className="w-full h-full rounded-full object-cover"
                        />
                      </div>
                    </div>
                    <span className="hidden xl:inline text-[15px] truncate">
                      {user ? user.username : 'Profile'}
                    </span>
                  </NavLink>
                );
              }

              return (
                <NavLink
                  key={idx}
                  to={item.path}
                  className={({ isActive }) =>
                    `w-full flex items-center gap-4 px-3 py-3 rounded-xl transition-all group hover:bg-[#1a1a1a] ${
                      isActive ? 'font-bold text-white' : 'text-[#f5f5f5] hover:text-white'
                    }`
                  }
                >
                  <div className="relative text-2xl group-hover:scale-110 transition-transform">
                    {Icon && <Icon />}
                    {item.badge && (
                      <span className="absolute -top-1 -right-1.5 w-4 h-4 bg-[#ff3040] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span className="hidden xl:inline text-[15px]">{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom More Menu */}
        <div className="relative">
          {isMoreOpen && (
            <div className="absolute bottom-14 left-0 w-60 bg-[#262626] border border-[#363636] rounded-2xl p-1.5 shadow-2xl z-50 flex flex-col gap-1 animate-fade-in">
              <button 
                onClick={() => { setIsMoreOpen(false); navigate('/verification-dashboard'); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#363636] text-[14px] text-white transition-colors text-left"
              >
                <IoShieldCheckmark className="text-lg text-[#0095f6]" />
                Proof of Humanity
              </button>
              <button 
                onClick={() => { setIsMoreOpen(false); navigate('/settings'); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#363636] text-[14px] text-white transition-colors text-left"
              >
                <IoSettingsOutline className="text-lg" />
                Settings
              </button>
              <div className="h-px bg-[#363636] my-1" />
              {user ? (
                <button 
                  onClick={() => { setIsMoreOpen(false); logout(); navigate('/login'); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#363636] text-[14px] text-[#ed4956] transition-colors text-left"
                >
                  <IoLogOutOutline className="text-lg" />
                  Log out
                </button>
              ) : (
                <button 
                  onClick={() => { setIsMoreOpen(false); navigate('/login'); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#363636] text-[14px] text-[#0095f6] transition-colors text-left"
                >
                  Log in
                </button>
              )}
            </div>
          )}

          <button
            onClick={() => setIsMoreOpen(!isMoreOpen)}
            className="w-full flex items-center gap-4 px-3 py-3 rounded-xl hover:bg-[#1a1a1a] text-[#f5f5f5] hover:text-white transition-all"
          >
            <IoMenuOutline className="text-2xl" />
            <span className="hidden xl:inline text-[15px]">More</span>
          </button>
        </div>
      </aside>

      {/* Slide-out Search Drawer */}
      {searchDrawerOpen && (
        <div className="fixed inset-y-0 left-[72px] xl:left-[245px] w-80 bg-black border-r border-[#262626] z-30 p-5 flex flex-col gap-4 shadow-2xl animate-fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white">Search</h3>
            <button 
              onClick={() => setSearchDrawerOpen(false)}
              className="text-[#a8a8a8] hover:text-white"
            >
              <IoClose className="text-xl" />
            </button>
          </div>
          <div className="relative">
            <input 
              type="text"
              placeholder="Search humans, posts, #tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#262626] text-white text-sm rounded-lg px-4 py-2.5 outline-none focus:ring-1 focus:ring-[#0095f6]"
            />
          </div>
          <div className="text-xs text-[#737373] mt-2 font-medium">Recent searches</div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#1a1a1a] cursor-pointer">
              <div className="w-10 h-10 rounded-full bg-[#262626] flex items-center justify-center font-bold text-[#0095f6]">#</div>
              <div>
                <p className="text-sm font-semibold text-white">#ProofOfHumanity</p>
                <p className="text-xs text-[#737373]">1.2k verified posts</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#1a1a1a] cursor-pointer">
              <div className="w-10 h-10 rounded-full bg-[#262626] flex items-center justify-center font-bold text-[#0095f6]">#</div>
              <div>
                <p className="text-sm font-semibold text-white">#HumanArt</p>
                <p className="text-xs text-[#737373]">850 authentic pieces</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Instagram Create Post Modal */}
      {isCreateOpen && (
        <CreatePostModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
      )}
    </>
  );
}
