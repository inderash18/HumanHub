import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { useIntersection } from '../../hooks/useIntersection';

export default function LiveDemo() {
    const [ref, isVisible] = useIntersection({ threshold: 0.2 });
    const [mode, setMode] = useState('human'); // 'human' | 'ai'
    const [verifying, setVerifying] = useState(false);
    const [status, setStatus] = useState(null); // 'approved' | 'rejected'

    const handlePost = () => {
        setVerifying(true);
        setStatus(null);
        
        // Simulate pipeline delay
        setTimeout(() => {
            setVerifying(false);
            setStatus(mode === 'human' ? 'approved' : 'rejected');
        }, 2000);
    };

    const reset = () => {
        setStatus(null);
    };

    const content = {
        human: {
            title: "I rebuilt an old wooden canoe with my grandpa this weekend",
            body: "It took us about 14 hours of sanding and varnishing. The smell of cedar was incredible. My hands are still covered in sap, but we're taking it out on the lake tomorrow morning."
        },
        ai: {
            title: "10 Mind-Blowing Ways AI Will Change Canoeing Forever",
            body: "The intersection of artificial intelligence and maritime recreation is rapidly evolving. From algorithmic paddle optimization to neural-network driven hull design, the future of canoeing is undoubtedly automated."
        }
    };

    return (
        <section className="py-24 bg-brand-surface border-y border-white/5" ref={ref}>
            <div className="max-w-5xl mx-auto px-4 lg:px-8">
                
                <div className="text-center mb-12">
                     <h2 className="text-3xl font-playfair font-bold mb-4">See It In Action</h2>
                     <p className="text-brand-muted">Try submitting a post through the HumanHub verification gateway.</p>
                </div>

                <div className="glass rounded-2xl border border-white/10 overflow-hidden">
                    {/* Fake Browser Chrome */}
                    <div className="bg-brand-bg px-4 py-3 border-b border-white/5 flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-brand-danger"></div>
                        <div className="w-3 h-3 rounded-full bg-brand-gold"></div>
                        <div className="w-3 h-3 rounded-full bg-brand-success"></div>
                        <div className="ml-4 bg-brand-surface border border-white/10 text-xs px-3 py-1 text-brand-muted font-mono rounded-md">app.humanhub.com/submit</div>
                    </div>

                    <div className="p-8">
                        {/* Toggle */}
                        <div className="flex justify-center gap-4 mb-8">
                             <Button variant={mode === 'human' ? 'primary' : 'secondary'} size="sm" onClick={() => { setMode('human'); reset(); }}>Organic Content</Button>
                             <Button variant={mode === 'ai' ? 'primary' : 'secondary'} size="sm" onClick={() => { setMode('ai'); reset(); }}>AI Output</Button>
                        </div>

                        {/* Editor Mock */}
                        <div className="border border-white/10 rounded-xl bg-brand-bg p-6 mb-6">
                            <h3 className="text-xl font-bold text-white mb-2">{content[mode].title}</h3>
                            <p className="text-brand-muted">{content[mode].body}</p>
                        </div>

                        <div className="flex items-center justify-between">
                             <Button onClick={handlePost} disabled={verifying || status !== null}>Submit to Hub</Button>
                             
                             <div className="flex-1 flex justify-end">
                                 <AnimatePresence mode="wait">
                                     {verifying && (
                                         <motion.div key="verifying" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-3 text-brand-gold font-mono text-sm">
                                             <span className="w-4 h-4 rounded-full border-2 border-brand-gold border-t-transparent animate-spin"></span>
                                             <span>Running Multi-Layer Integrity Checks...</span>
                                         </motion.div>
                                     )}
                                     {status === 'approved' && (
                                         <motion.div key="approved" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center gap-3">
                                            <Badge variant="success">0.02% AI Likelihood</Badge>
                                            <span className="text-brand-success font-medium">Verified Human. Published.</span>
                                         </motion.div>
                                     )}
                                     {status === 'rejected' && (
                                         <motion.div key="rejected" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center gap-3">
                                            <Badge variant="danger">99.8% AI Likelihood</Badge>
                                            <span className="text-brand-danger font-medium">Blocked. Account flagged.</span>
                                         </motion.div>
                                     )}
                                 </AnimatePresence>
                             </div>
                        </div>
                    </div>
                </div>

            </div>
        </section>
    );
}
