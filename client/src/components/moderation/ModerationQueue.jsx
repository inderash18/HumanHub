import { useState, useEffect } from 'react';
import { getModerationQueue, approveItemAction, rejectItemAction } from '../../services/moderationService';
import ScoreBreakdown from './ScoreBreakdown';
import Button from '../ui/Button';
import { toast } from 'react-hot-toast';

export default function ModerationQueue() {
    const [queue, setQueue] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadQueue = async () => {
        setLoading(true);
        try {
            const data = await getModerationQueue();
            setQueue(data);
        } catch (err) {
            toast.error('Failed to load moderation pipeline.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadQueue();
    }, []);

    const handleAction = async (id, type) => {
        try {
            if (type === 'approve') await approveItemAction(id);
            if (type === 'reject') await rejectItemAction(id, 'Admin override ban');

            toast.success(`Post ${type}d.`);
            setQueue(q => q.filter(item => item._id !== id));
        } catch (err) {
            toast.error('Failed admin action');
        }
    };

    if (loading) return <div className="p-8 text-center font-mono animate-pulse">Scanning DB queues...</div>;
    if (queue.length === 0) return <div className="p-8 text-center font-mono bg-brand-success/5 text-brand-success border border-brand-success/20 rounded-lg">Queue empty. All active systems verified.</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-black/50 p-4 border border-white/5 rounded-xl text-xs font-mono uppercase text-brand-muted">
                <div>Pending Items: <span className="text-white ml-2">{queue.length}</span></div>
                <button onClick={loadQueue} className="hover:text-white transition-colors">[ Refresh Queue ]</button>
            </div>

            {queue.map(item => (
                <div key={item._id} className="glass rounded-xl p-6 border border-brand-danger/20">
                     <div className="flex justify-between items-start gap-8">
                         <div className="flex-1">
                             <div className="text-brand-muted text-xs mb-2">
                                 Flagged By Model • Author: <span className="text-white hover:underline cursor-pointer">{item.author?.username}</span>
                             </div>
                             <h4 className="text-lg font-bold text-white mb-2">{item.title}</h4>
                             <p className="text-sm font-jakarta text-white/70 bg-brand-bg/50 p-4 rounded-lg mb-6 max-h-[150px] overflow-y-auto custom-scrollbar">
                                 {item.body}
                             </p>
                         </div>
                         <div className="w-72 shrink-0">
                             <ScoreBreakdown scores={item.detectionScores} />
                         </div>
                     </div>

                     <div className="flex items-center gap-4 pt-4 border-t border-white/5 mt-4">
                         <Button onClick={() => handleAction(item._id, 'approve')} variant="secondary" className="hover:bg-brand-success hover:border-brand-success hover:text-black mt-2">
                             Overrule Model & Approve
                         </Button>
                         <Button onClick={() => handleAction(item._id, 'reject')} variant="danger" className="mt-2">
                             Confirm Reject & Ban
                         </Button>
                     </div>
                </div>
            ))}
        </div>
    );
}
