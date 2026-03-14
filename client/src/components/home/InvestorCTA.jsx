import { motion } from 'framer-motion';
import Button from '../ui/Button';
import { useIntersection } from '../../hooks/useIntersection';

export default function InvestorCTA({ onEmailDeckClick }) {
    const [ref, isVisible] = useIntersection({ threshold: 0.3 });

    return (
        <section id="investors" className="py-32 relative border-t border-white/5" ref={ref}>
            <div className="absolute inset-0 bg-gradient-to-b from-brand-surface to-brand-bg pointer-events-none"></div>

            <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
                <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={isVisible ? { scale: 1, opacity: 1 } : { scale: 0.95, opacity: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="inline-flex px-3 py-1 bg-white/5 border border-white/10 rounded-full text-brand-gold text-xs font-mono uppercase mb-8">
                        Seed Round Active
                    </div>
                    
                    <h2 className="text-4xl md:text-5xl font-playfair font-bold text-white mb-6">Invest in the future of trust.</h2>
                    <p className="text-xl text-brand-muted mb-10 max-w-2xl mx-auto border-l-2 border-brand-gold/50 pl-6 italic">
                        We are currently raising our Seed round to scale our detection microservices architecture and expand the moderation operations team.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                         <Button size="lg" onClick={onEmailDeckClick} className="w-full sm:w-auto px-8">Submit Investor Inquiry</Button>
                         <Button variant="ghost" className="text-brand-muted underline">Download Summary One-Pager</Button>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
