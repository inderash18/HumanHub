import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { RiFireLine, RiCompass3Line, RiSettings3Line } from 'react-icons/ri';
import Badge from '../ui/Badge';

export default function Sidebar() {
    const { isAuthenticated, user } = useAuthStore();

    if (!isAuthenticated) return null; // Don't show strictly when logged out conceptually

    return (
        <aside className="w-64 flex-shrink-0 hidden lg:block h-[calc(100vh-64px)] overflow-y-auto custom-scrollbar sticky top-16 pt-8 pr-6 border-r border-white/5">
            <div className="mb-8">
                <div className="px-3 mb-2 text-xs font-mono text-brand-muted uppercase tracking-wider">Discover</div>
                <nav className="space-y-1">
                    <Link to="/feed" className="flex items-center gap-3 px-3 py-2 rounded-lg text-brand-text hover:bg-white/5 transition-colors">
                        <RiFireLine className="text-brand-gold" />
                        <span className="font-jakarta text-sm">Hot Feed</span>
                    </Link>
                    <Link to="/communities" className="flex items-center gap-3 px-3 py-2 rounded-lg text-brand-muted hover:bg-white/5 hover:text-brand-text transition-colors">
                        <RiCompass3Line />
                        <span className="font-jakarta text-sm">Explore Hubs</span>
                    </Link>
                </nav>
            </div>

            <div className="mb-8">
                <div className="px-3 mb-2 text-xs font-mono text-brand-muted uppercase tracking-wider flex justify-between">
                    <span>Your Hubs</span>
                </div>
                <nav className="space-y-1">
                    {/* Placeholder static map for now */}
                    <Link to="/c/tech" className="flex items-center gap-3 px-3 py-2 rounded-lg text-brand-muted hover:bg-white/5 transition-colors">
                        <div className="w-5 h-5 rounded-md bg-gradient-to-br from-blue-500 to-purple-600"></div>
                        <span className="font-jakarta text-sm truncate">h/Technology</span>
                    </Link>
                    <Link to="/c/art" className="flex items-center gap-3 px-3 py-2 rounded-lg text-brand-muted hover:bg-white/5 transition-colors">
                        <div className="w-5 h-5 rounded-md bg-gradient-to-br from-orange-400 to-red-500"></div>
                        <span className="font-jakarta text-sm truncate">h/HumanArt</span>
                    </Link>
                </nav>
            </div>

            <div className="mt-auto mb-8 px-3">
                <div className="glass p-4 rounded-xl border border-brand-success/20 bg-brand-success/5 relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="text-xs text-brand-success font-mono uppercase mb-1 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-success animate-pulse"></span> Trust Score
                        </div>
                        <div className="text-2xl font-playfair font-bold text-white mb-2">{Math.round((user?.trustScore || 0) * 100)}%</div>
                        <Badge variant="success" className="text-[10px] w-full justify-center">Excellent Standing</Badge>
                    </div>
                </div>
            </div>
        </aside>
    );
}
