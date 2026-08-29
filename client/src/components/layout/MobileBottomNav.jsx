import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  Activity, 
  Compass, 
  Users, 
  Bell, 
  Plus
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
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-hub-surface border-t border-hub-border z-40 flex items-center justify-around px-2 shadow-2xl">
        <NavLink 
          to={isAuthenticated ? '/feed' : '/'} 
          className={`p-2 rounded-xl transition-colors ${
            location.pathname === '/' || location.pathname === '/feed' ? 'text-hub-accent font-bold' : 'text-hub-text-tertiary'
          }`}
          title="Feed"
        >
          <Activity className="w-5 h-5" />
        </NavLink>

        <NavLink 
          to="/explore" 
          className={`p-2 rounded-xl transition-colors ${
            location.pathname === '/explore' ? 'text-hub-accent font-bold' : 'text-hub-text-tertiary'
          }`}
          title="Discover"
        >
          <Compass className="w-5 h-5" />
        </NavLink>

        <button 
          onClick={() => {
            if (!isAuthenticated) navigate('/?mode=signin');
            else setIsCreateOpen(true);
          }} 
          className="p-2 rounded-xl bg-hub-accent text-white shadow-md active:scale-95 transition-transform"
          title="Create Post"
        >
          <Plus className="w-5 h-5" />
        </button>

        <NavLink 
          to="/communities" 
          className={`p-2 rounded-xl transition-colors ${
            location.pathname === '/communities' ? 'text-hub-accent font-bold' : 'text-hub-text-tertiary'
          }`}
          title="Communities"
        >
          <Users className="w-5 h-5" />
        </NavLink>

        <NavLink 
          to="/notifications" 
          className={`p-2 rounded-xl transition-colors ${
            location.pathname === '/notifications' ? 'text-hub-accent font-bold' : 'text-hub-text-tertiary'
          }`}
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
        </NavLink>

        <NavLink 
          to={user ? `/u/${user.username}` : '/?mode=signin'} 
          className="p-1 flex items-center justify-center"
          title="My Profile"
        >
          <UserAvatar 
            src={user?.avatar} 
            name={user?.displayName || user?.username} 
            size="xs"
          />
        </NavLink>
      </div>

      {isCreateOpen && (
        <CreatePostModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
      )}
    </>
  );
}
