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
      <div className="max-w-[1400px] w-full mx-auto px-4 lg:px-8 flex justify-between items-center">
        
        <Link to="/" className="flex items-center gap-2 group">
           <svg className="w-6 h-6 text-brand-gold" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>
           <span className="text-xl font-playfair font-bold tracking-tight text-brand-text group-hover:text-brand-gold transition-colors">HumanHub</span>
        </Link>

        <div className="flex items-center gap-6">
           <Link to="/feed" className="text-sm font-jakarta text-brand-muted hover:text-brand-text transition-colors">Feed</Link>
           <Link to="/communities" className="text-sm font-jakarta text-brand-muted hover:text-brand-text transition-colors">Communities</Link>
           
           {isAuthenticated ? (
             <div className="flex items-center gap-4 ml-4 pl-4 border-l border-white/10">
               <button className="text-brand-muted hover:text-brand-text transition-colors relative">
                 <RiNotification3Line size={20} />
               </button>
               <div className="relative group cursor-pointer">
                  <div className="flex items-center gap-2">
                     <div className="w-8 h-8 rounded-full bg-brand-surface border border-brand-gold/20 flex items-center justify-center overflow-hidden">
                       {user?.avatar ? <img src={user.avatar} className="object-cover" alt="Avatar"/> : <RiUser3Line className="text-brand-gold/50"/>}
                     </div>
                  </div>
                  <div className="absolute right-0 top-full mt-2 w-48 bg-brand-surface border border-white/10 rounded-lg shadow-xl py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                     <Link to={`/u/${user?.username}`} className="block px-4 py-2 text-sm text-brand-text hover:bg-white/5">Profile</Link>
                     <button onClick={onLogout} className="w-full text-left px-4 py-2 text-sm text-brand-danger hover:bg-white/5">Logout</button>
                  </div>
               </div>
             </div>
           ) : (
             <div className="flex items-center gap-3">
               <Button variant="ghost" className="text-sm" onClick={() => navigate('/login')}>Sign in</Button>
               <Button variant="primary" className="text-sm" onClick={() => navigate('/register')}>Join Waitlist</Button>
             </div>
           )}
        </div>

      </div>
    </nav>
  );
}
