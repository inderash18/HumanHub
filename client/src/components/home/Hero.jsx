import { motion } from 'framer-motion';
import Button from '../ui/Button';
import { FADE_UP_VARIANTS } from '../../utils/constants';

export default function Hero({ onWaitlistClick }) {
    return (
        <section className="relative min-h-[90vh] flex flex-col items-center justify-center overflow-hidden pt-20 pb-16">
            {/* Background elements */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-gold/10 rounded-full blur-[120px] pointer-events-none"></div>

            <motion.div 
                initial="hidden" animate="visible" variants={FADE_UP_VARIANTS}
                className="relative z-10 text-center max-w-4xl mx-auto px-4"
            >
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand-gold/20 bg-brand-gold/5 text-brand-gold text-xs font-mono mb-8">
                    <span className="w-2 h-2 rounded-full bg-brand-success animate-pulse"></span>
                    Now detecting AI content globally
                </div>
                
                <h1 className="text-5xl md:text-7xl font-bold font-playfair tracking-tight mb-6">
                    The internet, <span className="text-brand-gold italic">verified.</span>
                </h1>
                
                <p className="text-lg md:text-xl text-brand-muted font-jakarta max-w-2xl mx-auto mb-10">
                    A Reddit-style community platform where every post, image, and video is guaranteed 100% human-created. Blocking AI-generated noise at the source.
                </p>
                
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Button size="lg" onClick={onWaitlistClick} className="w-full sm:w-auto">Join the Waitlist</Button>
                    <Button variant="secondary" size="lg" onClick={() => document.getElementById('investors').scrollIntoView({ behavior: 'smooth' })} className="w-full sm:w-auto">View Investor Deck</Button>
                </div>

                <div className="mt-16 pt-8 border-t border-white/5 flex flex-wrap justify-center gap-8 md:gap-16 opacity-60">
                     {/* Static metric display representing initial traction */}
                     <div className="text-center">
                         <div className="text-2xl font-playfair font-bold text-white mb-1">2.4M</div>
                         <div className="text-xs font-mono text-brand-muted uppercase">Bot Attempts Blocked</div>
                     </div>
                     <div className="text-center">
                         <div className="text-2xl font-playfair font-bold text-white mb-1">850k</div>
                         <div className="text-xs font-mono text-brand-muted uppercase">Verified Human Posts</div>
                     </div>
                     <div className="text-center">
                         <div className="text-2xl font-playfair font-bold text-white mb-1">100%</div>
                         <div className="text-xs font-mono text-brand-muted uppercase">Organic Communities</div>
                     </div>
                </div>
            </motion.div>
        </section>
    );
}
