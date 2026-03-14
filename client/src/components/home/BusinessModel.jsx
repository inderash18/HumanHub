import { motion } from 'framer-motion';
import { useIntersection } from '../../hooks/useIntersection';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { FADE_UP_VARIANTS } from '../../utils/constants';

export default function BusinessModel() {
    const [ref, isVisible] = useIntersection({ threshold: 0.2 });

    const data = [
        { name: 'API Services', value: 50 },
        { name: 'SaaS Premium', value: 30 },
        { name: 'White-Label', value: 20 },
    ];
    const COLORS = ['#c9a84c', '#4caf7d', '#528de0'];

    return (
        <section className="py-24 bg-brand-surface border-y border-white/5" ref={ref}>
             <div className="max-w-[1400px] mx-auto px-4 lg:px-8">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <motion.div initial="hidden" animate={isVisible ? 'visible' : 'hidden'} variants={FADE_UP_VARIANTS}>
                         <div className="text-xs font-mono text-brand-gold uppercase tracking-widest mb-4">Monetization</div>
                         <h2 className="text-3xl md:text-4xl font-playfair font-bold mb-6">A clear path to ₹10,000 Cr holding standing.</h2>
                         <p className="text-brand-muted mb-8 leading-relaxed">
                             Our core community platform is free, establishing the dataset and cultural moat. We monetize the infrastructure behind it.
                         </p>

                         <div className="space-y-6">
                             <div className="flex gap-4">
                                 <div className="mt-1 font-mono text-brand-gold">01</div>
                                 <div>
                                     <h4 className="font-bold text-white mb-1">B2B Detection API</h4>
                                     <p className="text-sm text-brand-muted">Charging platforms per-request to verify their own input data integrity.</p>
                                 </div>
                             </div>
                             <div className="flex gap-4">
                                 <div className="mt-1 font-mono text-brand-gold">02</div>
                                 <div>
                                     <h4 className="font-bold text-white mb-1">HumanHub Premium</h4>
                                     <p className="text-sm text-brand-muted">Consumer SaaS subscription for power users wanting advanced analytics and custom badges.</p>
                                 </div>
                             </div>
                             <div className="flex gap-4">
                                 <div className="mt-1 font-mono text-brand-gold">03</div>
                                 <div>
                                     <h4 className="font-bold text-white mb-1">White-Label Forums</h4>
                                     <p className="text-sm text-brand-muted">Turn-key secure community spaces leased by enterprises and brands.</p>
                                 </div>
                             </div>
                         </div>
                    </motion.div>

                    <motion.div 
                        initial="hidden" animate={isVisible ? 'visible' : 'hidden'} variants={FADE_UP_VARIANTS}
                        className="h-[400px] glass rounded-2xl border border-white/10 p-6 flex flex-col items-center justify-center relative"
                    >
                        <h4 className="absolute top-6 left-6 font-mono text-sm text-brand-muted">Projected Revenue Spreads</h4>
                        <ResponsiveContainer width="100%" height="80%">
                            <PieChart>
                                <Pie 
                                   data={data} 
                                   innerRadius={80} 
                                   outerRadius={120} 
                                   paddingAngle={5} 
                                   dataKey="value"
                                   stroke="none"
                                >
                                    {data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#111115', borderColor: '#333', borderRadius: '8px', color: '#fff' }} 
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Legend verticalAlign="bottom" height={36}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </motion.div>
                </div>
             </div>
        </section>
    );
}
