import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useAuth } from '../../hooks/useAuth';
import { useUIStore } from '../../store/uiStore';
import { 
  FiHome, 
  FiCompass, 
  FiFilm, 
  FiMessageSquare, 
  FiBell, 
  FiPlusSquare, 
  FiShield, 
  FiBookmark, 
  FiUser, 
  FiSettings, 
  FiLogOut,
  FiMoon,
  FiSun
} from 'react-icons/fi';

export default function Sidebar() {
    const { isAuthenticated, user } = useAuthStore();
    const { handleLogout } = useAuth();
    const { theme, toggleTheme } = useUIStore();
    const location = useLocation();
    const navigate = useNavigate();

    const onLogout = async () => {
        await handleLogout();
        navigate('/');
    };

    if (!isAuthenticated) return null;

    const navItems = [
        { path: '/feed', label: 'Home', icon: <FiHome className="text-lg" /> },
        { path: '/explore', label: 'Explore', icon: <FiCompass className="text-lg" /> },
        { path: '/reels', label: 'Reels', icon: <FiFilm className="text-lg" /> },
        { path: '/messages', label: 'Messages', icon: <FiMessageSquare className="text-lg" /> },
        { path: '/notifications', label: 'Notifications', icon: <FiBell className="text-lg" /> },
        { path: '/submit', label: 'Create', icon: <FiPlusSquare className="text-lg" /> },
        { path: '/verification-dashboard', label: 'Verification', icon: <FiShield className="text-lg" /> },
        { path: '/settings', label: 'Settings', icon: <FiSettings className="text-lg" /> },
    ];

    return (
        <aside 
            className="fixed left-6 top-[calc(var(--nav-height)+24px)] bottom-6 w-[72px] hover:w-[230px] flex flex-col justify-between p-3.5 z-40 transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] rounded-[28px] overflow-hidden group/sidebar shadow-xl"
            style={{
                background: 'var(--glass-bg)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid var(--glass-border)',
            }}
        >
            {/* Sidebar Navigation Items */}
            <div className="flex flex-col gap-1.5">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path || (item.path.startsWith('/u/') && location.pathname.startsWith('/u/'));
                    return (
                        <Link 
                            key={item.path}
                            to={item.path} 
                            className={`flex items-center gap-4 px-3.5 py-3 rounded-[16px] font-medium tracking-wide transition-all duration-200 relative group/item ${
                                isActive 
                                    ? 'text-[var(--brand-color)] bg-[var(--surface-color)]/30 border border-[var(--border-color)]' 
                                    : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]/30 hover:text-[var(--text-primary)] border border-transparent'
                            }`}
                        >
                            {/* Linear Active Indicator Pill */}
                            {isActive && (
                                <div className="absolute left-0 w-1 h-5 rounded-r-full bg-[var(--brand-color)]" />
                            )}
                            <span className={`transition-transform duration-200 group-hover/item:scale-105 flex-shrink-0 ${isActive ? 'text-[var(--brand-color)]' : 'text-[var(--text-secondary)]'}`}>
                                {item.icon}
                            </span>
                            <span className="text-[13px] font-bold tracking-tight whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300">
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>

            {/* Bottom Actions & User Profile Card */}
            <div className="flex flex-col gap-2.5 mt-auto pt-3 border-t border-[var(--border-color)]">
                {/* Theme Toggle Button */}
                <button 
                    onClick={toggleTheme}
                    className="flex items-center gap-4 px-3.5 py-3 rounded-[16px] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]/30 hover:text-[var(--text-primary)] transition-all font-medium border border-transparent"
                >
                    {theme === 'dark' ? (
                        <>
                            <FiSun className="text-lg text-yellow-500 flex-shrink-0" />
                            <span className="text-[13px] font-bold tracking-tight whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300">Light Mode</span>
                        </>
                    ) : (
                        <>
                            <FiMoon className="text-lg text-indigo-500 flex-shrink-0" />
                            <span className="text-[13px] font-bold tracking-tight whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300">Dark Mode</span>
                        </>
                    )}
                </button>

                {/* Logout Button */}
                <button 
                    onClick={onLogout}
                    className="flex items-center gap-4 px-3.5 py-3 rounded-[16px] text-red-500 hover:bg-red-500/5 transition-all font-medium border border-transparent"
                >
                    <FiLogOut className="text-lg flex-shrink-0" />
                    <span className="text-[13px] font-bold tracking-tight whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300">Logout</span>
                </button>

                {/* Micro User Detail Card */}
                <Link 
                    to={`/u/${user?.username}`}
                    className="flex items-center gap-3 p-1.5 rounded-[18px] hover:bg-[var(--surface-hover)] transition-all border border-[var(--border-color)] bg-[var(--surface-color)]/20"
                >
                    <div className="w-[38px] h-[38px] rounded-full bg-[var(--brand-color)] flex items-center justify-center overflow-hidden border border-[var(--border-color)] flex-shrink-0">
                        {user?.avatar ? (
                            <img src={user.avatar} className="w-full h-full object-cover" alt="" />
                        ) : (
                            <span className="text-white font-bold text-xs uppercase">{user?.username?.[0]}</span>
                        )}
                    </div>
                    <div className="flex flex-col min-w-0 opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300">
                        <span className="text-[12px] font-bold text-[var(--text-primary)] truncate">{user?.username}</span>
                        <span className="text-[9.5px] text-[var(--verified-color)] font-bold uppercase tracking-wider">Human Verified</span>
                    </div>
                </Link>
            </div>
        </aside>
    );
}
