import { motion } from 'framer-motion';
import { useIntersection } from '../../hooks/useIntersection';
import { RiTextWrap, RiImageLine, RiRobot2Line, RiArrowRightLine } from 'react-icons/ri';
import { FADE_UP_VARIANTS } from '../../utils/constants';
import Card from '../ui/Card';

export default function Solution() {
    const [ref, isVisible] = useIntersection({ threshold: 0.1 });

    const pipeline = [
        {
            icon: <RiTextWrap size={32} className="text-brand-gold mb-6" />,
            title: "Text Analysis",
            desc: "Detects perplexity, burstiness, and LLM watermarks across every post and comment instantly."
        },
        {
            icon: <RiImageLine size={32} className="text-brand-gold mb-6" />,
            title: "Media Validation",
            desc: "Pixel-level scanning for generative noise and manipulation markers in images and video uploads."
        },
        {
            icon: <RiRobot2Line size={32} className="text-brand-gold mb-6" />,
            title: "Behavior Metrics",
            desc: "Tracks human-computer interaction signatures like mouse movements and typing cadence."
        }
    ];

    return (
        <section className="py-32 relative" ref={ref}>
            <div className="max-w-[1400px] mx-auto px-4 lg:px-8">
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <motion.h2 
                        initial="hidden" animate={isVisible ? 'visible' : 'hidden'} 
                        variants={{...FADE_UP_VARIANTS, transition: { delay: 0.1 }}}
                        className="text-3xl md:text-5xl font-playfair font-bold mb-6"
                    >
                        The Trust-Tech Pipeline
                    </motion.h2>
                    <motion.p 
                        initial="hidden" animate={isVisible ? 'visible' : 'hidden'} 
                        variants={{...FADE_UP_VARIANTS, transition: { delay: 0.2 }}}
                        className="text-brand-muted text-lg"
                    >
                        Every piece of submitted content is filtered through our proprietary multi-layered AI detection microservices before it ever hits the feed.
                    </motion.p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 relative z-10">
                    {pipeline.map((item, idx) => (
                        <motion.div 
                            key={idx}
                            initial="hidden" animate={isVisible ? 'visible' : 'hidden'} 
                            variants={{...FADE_UP_VARIANTS, transition: { delay: 0.2 + (idx * 0.1) }}}
                        >
                            <Card className="h-full border-t border-t-brand-gold/20 hover:border-t-brand-gold transition-colors pt-8">
                                {item.icon}
                                <h3 className="text-xl font-medium text-white mb-3">{item.title}</h3>
                                <p className="text-brand-muted text-sm leading-relaxed">{item.desc}</p>
                            </Card>
                            
                            {/* Connector visual (hidden on mobile) */}
                            {idx < 2 && (
                                <div className="hidden md:flex absolute top-1/2 -right-4 translate-x-[50%] -translate-y-1/2 text-white/20">
                                    <RiArrowRightLine size={24} />
                                </div>
                            )}
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
