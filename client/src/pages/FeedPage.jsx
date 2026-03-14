import PostFeed from '../components/posts/PostFeed';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { RiImageLine, RiLinkM } from 'react-icons/ri';
import { useAuthStore } from '../store/authStore';
import Card from '../components/ui/Card';

export default function FeedPage() {
    const { user, isAuthenticated } = useAuthStore();
    const navigate = useNavigate();

    return (
        <motion.div 
           initial={{ opacity: 0, y: 10 }} 
           animate={{ opacity: 1, y: 0 }} 
           className="w-full max-w-[1000px] mx-auto flex flex-col lg:flex-row gap-6 pb-12"
        >
            {/* Main Feed Column */}
            <div className="flex-1 w-full lg:max-w-[640px] space-y-4">
                {/* Create Post Bar */}
                {isAuthenticated && (
                    <Card noPadding className="mb-4 bg-brand-bg border border-white/5 hover:border-white/20 flex items-center gap-3 p-2">
                        <div className="w-10 h-10 rounded-full bg-brand-surface border border-white/10 overflow-hidden shrink-0 flex items-center justify-center">
                            {user?.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : <span className="text-xl">🤖</span>}
                        </div>
                        <input 
                            type="text" 
                            placeholder="Create Post" 
                            className="flex-1 bg-brand-surface border border-white/10 hover:border-white/20 hover:bg-white/5 rounded-md px-4 py-2 text-sm text-white placeholder-brand-muted focus:outline-none focus:border-white/30 transition-colors cursor-pointer"
                            onClick={() => navigate('/submit')}
                            readOnly
                        />
                        <button onClick={() => navigate('/submit')} className="p-2 text-brand-muted hover:bg-white/10 hover:text-brand-text rounded-md transition-colors"><RiImageLine size={24} /></button>
                        <button onClick={() => navigate('/submit')} className="p-2 text-brand-muted hover:bg-white/10 hover:text-brand-text rounded-md transition-colors"><RiLinkM size={24} /></button>
                    </Card>
                )}

                <div className="flex items-center gap-4 border border-white/5 bg-brand-bg mb-4 rounded-md p-3 text-sm font-bold text-brand-muted">
                    <button className="text-brand-text bg-white/10 px-3 py-1.5 rounded-full flex items-center gap-2">🔥 Hot</button>
                    <button className="hover:bg-white/5 px-3 py-1.5 rounded-full flex items-center gap-2">✨ New</button>
                    <button className="hover:bg-white/5 px-3 py-1.5 rounded-full flex items-center gap-2">⬆️ Top</button>
                </div>

                <PostFeed />
            </div>

            {/* Right Sidebar - typical of Desktop Reddit */}
            <div className="hidden lg:block w-[312px] shrink-0 space-y-4">
                <Card noPadding className="bg-brand-bg border border-white/5 overflow-hidden">
                    <div className="h-10 bg-gradient-to-r from-[#ff4500]/20 to-[#7193ff]/20"></div>
                    <div className="p-3">
                        <div className="w-12 h-12 rounded-lg bg-brand-surface border-2 border-brand-bg -mt-8 mb-2 flex items-center justify-center text-2xl relative z-10">
                            🛡️
                        </div>
                        <h2 className="font-bold text-white mb-2 font-playfair text-lg">HumanHub Premium</h2>
                        <p className="text-[13px] text-brand-text/80 mb-3 font-jakarta">The best algorithmic timeline, 100% human verified. Premium features currently running at full capacity.</p>
                        <button className="w-full bg-brand-gold hover:bg-brand-gold/80 text-brand-bg font-bold py-1.5 rounded-full transition-colors text-sm">
                            Try Premium
                        </button>
                    </div>
                </Card>

                <Card noPadding className="bg-brand-bg border border-white/5 p-3">
                    <div className="text-xs font-bold text-brand-muted uppercase tracking-wider mb-3">Trending Communities</div>
                    <div className="space-y-3">
                        {[1,2,3].map(i => (
                            <div key={i} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-white/10"></div>
                                    <div>
                                        <div className="text-sm font-bold text-white">h/technology</div>
                                        <div className="text-[12px] text-brand-muted">1.2m members</div>
                                    </div>
                                </div>
                                <button className="bg-white/10 hover:bg-white/20 text-white font-bold px-3 py-1 rounded-full text-xs transition-colors">Join</button>
                            </div>
                        ))}
                    </div>
                </Card>

                <div className="flex flex-wrap gap-2 text-[12px] text-brand-muted px-2">
                    <Link to="/" className="hover:underline">User Agreement</Link>
                    <Link to="/" className="hover:underline">Privacy Policy</Link>
                    <span>•</span>
                    <Link to="/" className="hover:underline">HumanHub Inc © 2026</Link>
                </div>
            </div>
        </motion.div>
    );
}
