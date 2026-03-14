import { useAuthStore } from '../store/authStore';
import { Navigate } from 'react-router-dom';
import ModerationQueue from '../components/moderation/ModerationQueue';
import BanPanel from '../components/moderation/BanPanel';

export default function ModeratorDashboard() {
     const { user } = useAuthStore();

     if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
          return <Navigate to="/feed" replace />;
     }

     return (
          <div className="max-w-6xl mx-auto py-8">
               <div className="mb-10 pb-6 border-b border-white/5">
                    <h1 className="text-3xl font-playfair font-bold text-brand-danger mb-2 flex items-center gap-3">
                        Moderation Command
                        <span className="text-xs bg-brand-danger/20 px-2 py-1 rounded font-mono uppercase tracking-widest text-brand-danger border border-brand-danger/30">Secure Area</span>
                    </h1>
                    <p className="text-brand-muted font-jakarta">Review borderline pipeline triggers, issue bans, and monitor platform integrity signals live.</p>
               </div>

               <div className="grid lg:grid-cols-3 gap-10">
                    <div className="lg:col-span-2 space-y-8">
                         <h3 className="font-playfair text-xl font-bold text-white mb-4 pl-3 border-l-2 border-brand-danger">Active Queue</h3>
                         <ModerationQueue />
                    </div>

                    <div className="space-y-8">
                         <h3 className="font-playfair text-xl font-bold text-white mb-4 pl-3 border-l-2 border-brand-danger/50">Rapid Actions</h3>
                         <div className="glass p-6 rounded-xl border border-white/5">
                             <h4 className="font-bold text-sm text-brand-muted uppercase mb-4 font-mono">Direct User Neutralization</h4>
                             <BanPanel targetUserId={"placeholder-id"} />
                         </div>

                         <div className="glass p-6 rounded-xl border border-brand-gold/20">
                             <h4 className="font-bold text-sm text-brand-gold uppercase mb-4 font-mono">System Integrity Metrics</h4>
                             <ul className="space-y-3 font-mono text-sm">
                                 <li className="flex justify-between text-brand-text/70"><span>Pipeline Load</span> <span className="text-brand-success font-bold">Stable</span></li>
                                 <li className="flex justify-between text-brand-text/70"><span>Redis Tasks</span> <span>142 req/min</span></li>
                                 <li className="flex justify-between text-brand-text/70"><span>Avg Response</span> <span>420ms</span></li>
                                 <li className="flex justify-between text-brand-text/70"><span>Bans (24h)</span> <span className="text-brand-danger">2,104</span></li>
                             </ul>
                         </div>
                    </div>
               </div>
          </div>
     );
}
