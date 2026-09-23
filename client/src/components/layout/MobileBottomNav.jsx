import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Compass, 
  PlusSquare, 
  Film, 
  Send,
  Heart
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import CreatePostModal from '../posts/CreatePostModal';
import UserAvatar from '../common/UserAvatar';

export default function MobileBottomNav() {
  const { user, isAuthenticated } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <>
      {/* Mobile Top Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-12 bg-[var(--ig-bg)] border-b border-[var(--ig-border)] z-40 flex items-center justify-between px-4 select-none">
        <NavLink to="/" className="font-logo text-xl tracking-tight text-[var(--ig-text-primary)]">
          HumanHub
        </NavLink>

        <div className="flex items-center gap-4 text-[var(--ig-text-primary)]">
          <NavLink to="/notifications" title="Notifications">
            <Heart className="w-6 h-6 stroke-[1.8]" />
          </NavLink>
          <NavLink to="/messages" title="Direct Messages">
            <Send className="w-6 h-6 stroke-[1.8]" />
          </NavLink>
        </div>
      </header>

      {/* Mobile Bottom Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-[50px] bg-[var(--ig-bg)] border-t border-[var(--ig-border)] z-40 flex items-center justify-around px-2 select-none">
        <NavLink 
          to={isAuthenticated ? '/feed' : '/'} 
          className="p-2 text-[var(--ig-text-primary)]"
          title="Home"
        >
          {({ isActive }) => <Home className={`w-6 h-6 ${isActive ? 'stroke-[2.8]' : 'stroke-[1.8]'}`} />}
        </NavLink>

        <NavLink 
          to="/explore" 
          className="p-2 text-[var(--ig-text-primary)]"
          title="Explore"
        >
          {({ isActive }) => <Compass className={`w-6 h-6 ${isActive ? 'stroke-[2.8]' : 'stroke-[1.8]'}`} />}
        </NavLink>

        <NavLink 
          to="/reels" 
          className="p-2 text-[var(--ig-text-primary)]"
          title="Reels"
        >
          {({ isActive }) => <Film className={`w-6 h-6 ${isActive ? 'stroke-[2.8]' : 'stroke-[1.8]'}`} />}
        </NavLink>

        <button 
          onClick={() => {
            if (!isAuthenticated) navigate('/?mode=signin');
            else setIsCreateOpen(true);
          }} 
          className="p-2 text-[var(--ig-text-primary)] active:scale-90 transition-transform"
          title="Create"
        >
          <PlusSquare className="w-6 h-6 stroke-[1.8]" />
        </button>

        <NavLink 
          to={user ? `/u/${user.username}` : '/?mode=signin'} 
          className="p-2 text-[var(--ig-text-primary)]"
          title="Profile"
        >
          {({ isActive }) => (
            <div className={`p-[1.5px] rounded-full ${isActive ? 'ring-2 ring-[var(--ig-text-primary)]' : ''}`}>
              <UserAvatar 
                src={user?.avatar} 
                name={user?.displayName || user?.username} 
                size="xs"
              />
            </div>
          )}
        </NavLink>
      </div>

      {isCreateOpen && (
        <CreatePostModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
      )}
    </>
  );
}
