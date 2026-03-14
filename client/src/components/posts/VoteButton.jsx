import { useVote } from '../../hooks/useVote';
import { RiArrowUpSLine, RiArrowDownSLine } from 'react-icons/ri';

export default function VoteButton({ initialScore, targetId, targetType = 'post', horizontal = false }) {
    const { score, status, handleVote, loading } = useVote(initialScore, targetId, targetType);

    const btnBase = "transition-colors cursor-pointer disabled:opacity-50 p-1 rounded-md flex items-center justify-center";
    
    // Optimistic coloring mapping
    const upColor = status === 1 ? "text-brand-gold bg-brand-gold/10" : "text-brand-muted hover:bg-white/5 hover:text-brand-gold";
    const downColor = status === -1 ? "text-brand-danger bg-brand-danger/10" : "text-brand-muted hover:bg-white/5 hover:text-brand-danger";
    const totalColor = status === 1 ? "text-brand-gold font-bold" : status === -1 ? "text-brand-danger font-bold" : "text-brand-text font-bold";

    return (
        <div className={`flex ${horizontal ? 'flex-row items-center gap-1 rounded-full bg-black/40 border border-white/5 px-1 py-0.5' : 'flex-col items-center gap-1'}`}>
            <button 
                onClick={() => handleVote(1)} 
                disabled={loading}
                className={`${btnBase} ${upColor}`}
                aria-label="Upvote"
            >
               <RiArrowUpSLine size={horizontal ? 20 : 24} />
            </button>
            <span className={`text-xs font-mono w-6 text-center select-none ${totalColor}`}>
               {score || 0}
            </span>
            <button 
                onClick={() => handleVote(-1)} 
                disabled={loading}
                className={`${btnBase} ${downColor}`}
                aria-label="Downvote"
            >
               <RiArrowDownSLine size={horizontal ? 20 : 24} />
            </button>
        </div>
    );
}
