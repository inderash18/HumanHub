import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  IoHomeOutline, IoHome, 
  IoCompassOutline, IoCompass,
  IoPaperPlaneOutline, IoPaperPlane,
  IoHeartOutline, IoHeart 
} from 'react-icons/io5';
import { BsPlusSquare, BsPlusSquareFill, BsCameraReels, BsCameraReelsFill } from 'react-icons/bs';
import { useAuthStore } from '../../store/useAuthStore';
import CreatePostModal from '../posts/CreatePostModal';

export default function MobileBottomNav() {
  const { user } = useAuthStore();
  const location = useLocation();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <>
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-[50px] bg-black border-t border-[#262626] z-40 flex items-center justify-around px-4">
        <NavLink to="/" className="text-2xl text-white">
          {location.pathname === '/' ? <IoHome /> : <IoHomeOutline />}
        </NavLink>
        <NavLink to="/explore" className="text-2xl text-white">
          {location.pathname === '/explore' ? <IoCompass /> : <IoCompassOutline />}
        </NavLink>
        <NavLink to="/reels" className="text-2xl text-white">
          {location.pathname === '/reels' ? <BsCameraReelsFill /> : <BsCameraReels />}
        </NavLink>
        <button onClick={() => setIsCreateOpen(true)} className="text-2xl text-white">
          <BsPlusSquare />
        </button>
        <NavLink to="/messages" className="text-2xl text-white">
          {location.pathname === '/messages' ? <IoPaperPlane /> : <IoPaperPlaneOutline />}
        </NavLink>
        <NavLink to={user ? `/u/${user.username}` : '/login'} className="w-6 h-6 rounded-full overflow-hidden border border-[#262626]">
          <img 
            src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} 
            alt="profile" 
            className="w-full h-full object-cover"
          />
        </NavLink>
      </div>

      {isCreateOpen && (
        <CreatePostModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
      )}
    </>
  );
}
