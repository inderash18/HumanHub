import { motion } from 'framer-motion';
import PostEditor from '../components/posts/PostEditor';

export default function SubmitPostPage() {
    return (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="max-w-2xl mx-auto py-12">
             <div className="border-b border-white/10 pb-6 mb-8">
                 <h1 className="text-3xl font-playfair font-bold text-white mb-2">Create Post</h1>
                 <p className="text-brand-muted text-sm font-mono tracking-widest uppercase bg-brand-gold/10 inline-block px-2 text-brand-gold rounded border border-brand-gold/30">Detection Pipeline Active</p>
             </div>

             {/* Assuming communityId is passed via query params or selected inside the editor inherently */}
             <PostEditor onSuccess={() => window.history.back()} />

             <div className="mt-12 glass p-6 rounded-xl border-l-4 border-l-brand-gold text-sm font-jakarta text-brand-muted">
                 <h4 className="text-white font-bold mb-2">Posting Rules</h4>
                 <ul className="list-disc pl-5 space-y-2">
                     <li>Remember the human. All submissions are scanned continuously.</li>
                     <li>Generative AI content (ChatGPT, Claude, Gemini) will be silently rejected.</li>
                     <li>Repeat infractions lower your Trust Score resulting in permanent shadowbans.</li>
                 </ul>
             </div>
        </motion.div>
    );
}
