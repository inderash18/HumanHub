import { motion } from 'framer-motion';
import { useIntersection } from '../../hooks/useIntersection';
import { FADE_UP_VARIANTS } from '../../utils/constants';

export default function Problem() {
    const [ref, isVisible] = useIntersection({ threshold: 0.2 });

    return (
        <section className="py-24 bg-brand-surface border-y border-white/5" ref={ref}>
            <div className="max-w-[1400px] mx-auto px-4 lg:px-8">
                <motion.div 
                    initial="hidden" animate={isVisible ? 'visible' : 'hidden'} variants={FADE_UP_VARIANTS}
                    className="grid md:grid-cols-2 gap-16 items-center"
                >
                    <div>
                        <h2 className="text-3xl md:text-5xl font-playfair font-bold mb-6">The Dead Internet Theory is <span className="text-brand-danger line-through opacity-80 decoration-2">Theory</span> Reality.</h2>
                        <p className="text-brand-muted text-lg mb-8 leading-relaxed">
                            By 2026, Europol estimates that 90% of online content will be synthetically generated. Communities are being overrun by bot farms, LLM spam, and deepfakes designed to farm karma and manipulate public opinion.
                        </p>
                        <p className="text-white font-medium text-xl">
                            We are losing the human connection.
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="glass p-6 rounded-xl border border-brand-danger/20 border-l-4 border-l-brand-danger flex flex-col justify-between h-40">
                            <div className="text-brand-danger font-mono text-sm uppercase">Currently</div>
                            <div className="text-4xl font-playfair text-white">47%</div>
                            <div className="text-xs text-brand-muted">Of ALL internet traffic is bots</div>
                        </div>
                        <div className="glass p-6 rounded-xl border border-brand-gold/20 border-l-4 border-l-brand-gold flex flex-col justify-between h-40 mt-8">
                            <div className="text-brand-gold font-mono text-sm uppercase">Trust</div>
                            <div className="text-4xl font-playfair text-white">12%</div>
                            <div className="text-xs text-brand-muted">Users trust social media info</div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
