import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { FiHome, FiSearch, FiPlusSquare, FiFilm, FiUser } from 'react-icons/fi';

export default function MobileBottomNav() {
    const location = useLocation();
    const { isAuthenticated, user } = useAuthStore();

    if (!isAuthenticated) return null;

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[var(--surface-color)] border-t border-[var(--border-color)] flex items-center justify-around z-50 px-4 nav-premium-blur">
            <Link 
                to="/feed" 
                className={`flex flex-col items-center justify-center w-12 h-12 rounded-full transition-colors ${location.pathname === '/feed' ? 'text-[var(--brand-color)]' : 'text-[var(--text-secondary)]'}`}
            >
                <FiHome className="text-xl" />
            </Link>

            <Link 
                to="/explore" 
                className={`flex flex-col items-center justify-center w-12 h-12 rounded-full transition-colors ${location.pathname === '/explore' ? 'text-[var(--brand-color)]' : 'text-[var(--text-secondary)]'}`}
            >
                <FiSearch className="text-xl" />
            </Link>

            <Link 
                to="/submit" 
                className={`flex flex-col items-center justify-center w-12 h-12 rounded-full transition-colors ${location.pathname === '/submit' ? 'text-[var(--brand-color)]' : 'text-[var(--text-secondary)]'}`}
            >
                <FiPlusSquare className="text-xl" />
            </Link>

            <Link 
                to="/reels" 
                className={`flex flex-col items-center justify-center w-12 h-12 rounded-full transition-colors ${location.pathname === '/reels' ? 'text-[var(--brand-color)]' : 'text-[var(--text-secondary)]'}`}
            >
                <FiFilm className="text-xl" />
            </Link>

            <Link 
                to={`/u/${user?.username}`} 
                className={`flex flex-col items-center justify-center w-12 h-12 rounded-full transition-colors ${location.pathname.startsWith('/u/') ? 'text-[var(--brand-color)]' : 'text-[var(--text-secondary)]'}`}
            >
                <FiUser className="text-xl" />
            </Link>
        </div>
    );
}
