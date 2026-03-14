import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useAuth } from '../../hooks/useAuth';
import { RiNotification3Line, RiUser3Line } from 'react-icons/ri';
import Button from '../ui/Button';

export default function Navbar() {
  const { isAuthenticated, user } = useAuthStore();
  const { handleLogout } = useAuth();
  const navigate = useNavigate();

  const onLogout = async () => {
    await handleLogout();
    navigate('/');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-brand-bg/80 backdrop-blur-md border-b border-white/5 h-16 flex items-center">
      <div className="max-w-[1400px] w-full mx-auto px-4 lg:px-8 flex items-center">
        
        {/* Left: Logo */}
        <Link to="/" className="flex items-center gap-2 group w-64 shrink-0">
           <svg className="w-8 h-8 text-[#ff4500] group-hover:rotate-12 transition-transform duration-300" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>
           <span className="text-xl font-bold tracking-tight text-white group-hover:text-white transition-colors">humanit</span>
        </Link>

        {/* Center: Search Bar (Hidden on very small screens) */}
        <div className="hidden md:flex flex-1 justify-center px-4 max-w-2xl mx-auto">
            <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                </div>
                <input 
                    type="text" 
                    placeholder="Search HumanHub" 
                    className="block w-full pl-10 pr-3 py-2 border border-transparent rounded-full leading-5 bg-white/10 text-white placeholder-gray-400 focus:outline-none focus:bg-white/15 focus:border-white/20 hover:bg-white/15 sm:text-sm transition-colors"
                />
            </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-6 shrink-0 ml-auto md:ml-0">
           
           {isAuthenticated ? (
             <div className="flex items-center gap-4">
               <button className="text-brand-text hover:bg-white/10 p-2 rounded-full transition-colors relative">
                 <RiNotification3Line size={24} />
               </button>
               <div className="relative group cursor-pointer">
                  <div className="flex items-center gap-2 hover:bg-white/10 p-1 pr-2 rounded-md transition-colors">
                     <div className="w-8 h-8 rounded-full bg-brand-surface overflow-hidden">
                       {user?.avatar ? <img src={user.avatar} className="object-cover" alt="Avatar"/> : <RiUser3Line className="text-brand-text w-full h-full p-1"/>}
                     </div>
                     <span className="text-sm font-bold hidden lg:block text-brand-text w-20 truncate">{user?.username}</span>
                  </div>
                  <div className="absolute right-0 top-full mt-2 w-48 bg-brand-bg border border-white/10 rounded-lg shadow-xl py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                     <Link to={`/u/${user?.username}`} className="block px-4 py-2 text-sm text-brand-text hover:bg-white/5">Profile</Link>
                     <button onClick={onLogout} className="w-full text-left px-4 py-2 text-sm text-brand-text hover:bg-white/5">Logout</button>
                  </div>
               </div>
             </div>
           ) : (
             <div className="flex items-center gap-3">
               <Button variant="ghost" className="text-sm bg-white/10 hover:bg-white/20 text-white font-bold rounded-full px-4" onClick={() => navigate('/login')}>Log In</Button>
             </div>
           )}
        </div>

      </div>
    </nav>
  );
}
