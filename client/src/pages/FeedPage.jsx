import PostFeed from '../components/posts/PostFeed';
import PostEditor from '../components/posts/PostEditor';
import { motion } from 'framer-motion';

export default function FeedPage() {
    return (
        <motion.div 
           initial={{ opacity: 0, scale: 0.98 }} 
           animate={{ opacity: 1, scale: 1 }} 
           className="w-full max-w-3xl mx-auto space-y-8 pb-12"
        >
            <div className="flex items-end justify-between border-b border-white/5 pb-6">
                 <div>
                     <h1 className="text-3xl font-playfair font-bold text-white mb-2">Hot Feed</h1>
                     <p className="text-brand-muted text-sm font-mono uppercase tracking-widest">Algorithmic timeline, 100% human verified.</p>
                 </div>
                 
                 {/* Decorative Pulse */}
                 <div className="hidden sm:flex items-center gap-2 border border-brand-gold/20 bg-brand-gold/5 px-3 py-1.5 rounded-full text-xs font-mono text-brand-gold">
                    <span className="w-1.5 h-1.5 bg-brand-success rounded-full animate-pulse"></span>
                    Systems Online
                 </div>
            </div>

            <PostFeed />
        </motion.div>
    );
}
