import { useState } from 'react';
import Button from '../ui/Button';
import { banUserAction } from '../../services/moderationService';
import toast from 'react-hot-toast';

export default function BanPanel({ targetUserId, onBanComplete }) {
    const [loading, setLoading] = useState(false);

    const handleBan = async () => {
        if (!window.confirm("Are you sure you want to permanently ban this human?")) return;
        
        setLoading(true);
        try {
             await banUserAction(targetUserId);
             toast.success('User shadow-banned cleanly.');
             if(onBanComplete) onBanComplete();
        } catch (err) {
             toast.error('Ban application failed.');
        } finally {
             setLoading(false);
        }
    };

    return (
        <div className="p-4 border border-brand-danger/20 bg-brand-danger/5 rounded-xl w-full max-w-sm">
             <h4 className="text-brand-danger font-bold text-sm uppercase mb-2">Administrative Control</h4>
             <p className="text-xs text-brand-text/60 mb-4 line-clamp-2 leading-relaxed">By triggering a ban, this users trust score plummets to 0.0, rejecting all future pipeline requests.</p>
             <Button variant="danger" size="sm" onClick={handleBan} disabled={loading} className="w-full">
                 {loading ? 'Executing Ban...' : 'Permanently Ban User'}
             </Button>
        </div>
    );
}
