import { motion } from 'framer-motion';
import { useIntersection } from '../../hooks/useIntersection';
import Card from '../ui/Card';
import { RiShieldStarLine, RiChat3Line, RiStockLine, RiGroupLine, RiSwordLine, RiCodeBoxLine } from 'react-icons/ri';
import { FADE_UP_VARIANTS } from '../../utils/constants';

export default function Features() {
    const [ref, isVisible] = useIntersection({ threshold: 0.1 });

    const features = [
       { icon: <RiGroupLine size={24}/>, title: 'Niche Sub-Hubs', desc: 'Create and moderate your own dedicated communities around hyper-specific interests.' },
       { icon: <RiChat3Line size={24}/>, title: 'Nested Threads', desc: 'Robust multi-level comment architecture designed for deep, nuanced organic discussions.' },
       { icon: <RiStockLine size={24}/>, title: 'HotScore Physics', desc: 'A proprietary chronological voting algorithm that keeps front-page content fresh and fair.' },
       { icon: <RiShieldStarLine size={24}/>, title: 'Trust Systems', desc: 'Dynamic user standing calculations. Good actors gain privileges; bad actors are silent-banned.' },
       { icon: <RiSwordLine size={24}/>, title: 'Moderator Tooling', desc: 'Comprehensive dashboards for manual overrides, ban issuance, and detailed audit logs.' },
       { icon: <RiCodeBoxLine size={24}/>, title: 'Enterprise API', desc: 'Headless access to our verification pipeline to secure your own platform from synthetic data.' },
    ];

    return (
        <section className="py-32" ref={ref}>
             <div className="max-w-[1400px] mx-auto px-4 lg:px-8">
                <div className="text-center mb-16">
                     <h2 className="text-3xl font-playfair font-bold mb-4">Complete Social Infrastructure</h2>
                     <p className="text-brand-muted max-w-2xl mx-auto">Everything you expect from a modern discussion platform, built from the ground up to support human authenticity natively.</p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((feature, idx) => (
                         <motion.div 
                             key={idx}
                             initial="hidden" animate={isVisible ? 'visible' : 'hidden'}
                             variants={{...FADE_UP_VARIANTS, transition: { delay: 0.1 * idx }}}
                         >
                             <Card hover className="h-full bg-brand-bg/50">
                                 <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center text-brand-gold mb-6 border border-white/10">
                                     {feature.icon}
                                 </div>
                                 <h4 className="text-lg font-bold text-white mb-2">{feature.title}</h4>
                                 <p className="text-brand-muted text-sm leading-relaxed">{feature.desc}</p>
                             </Card>
                         </motion.div>
                    ))}
                </div>
             </div>
        </section>
    );
}
