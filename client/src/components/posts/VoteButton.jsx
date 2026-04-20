import { useState } from 'react';
import { votePost } from '../../services/postService';
import toast from 'react-hot-toast';

export default function VoteButton({ initialScore = 0, targetId, targetType, horizontal = false }) {
    const [score, setScore] = useState(initialScore);
    const [voted, setVoted] = useState(null); // 'up' | 'down' | null
    const [loading, setLoading] = useState(false);

    const handleVote = async (dir) => {
        if (loading) return;
        setLoading(true);
        try {
            await votePost(targetId, dir);
            // Toggle or change vote
            if (voted === dir) {
                setVoted(null);
                setScore(voted === 'up' ? score - 1 : score + 1);
            } else {
                const diff = voted ? (dir === 'up' ? 2 : -2) : (dir === 'up' ? 1 : -1);
                setVoted(dir);
                setScore(score + diff);
            }
        } catch (err) {
            toast.error("Cloud connection required for persistent voting.");
        } finally {
            setLoading(false);
        }
    };

    const formatScore = (n) => {
        if (Math.abs(n) >= 1000) return `${(n / 1000).toFixed(1)}k`;
        return n;
    };

    const scoreColor = voted === 'up' ? 'text-reddit-orange' : voted === 'down' ? 'text-reddit-downvote' : 'text-white';

    return (
        <div className={`flex ${horizontal ? 'items-center gap-3 px-2' : 'flex-col items-center gap-1'}`}>
            <button 
                onClick={(e) => { e.preventDefault(); handleVote('up'); }} 
                className={`p-1 rounded-md transition-colors ${voted === 'up' ? 'text-reddit-orange bg-reddit-orange/10' : 'text-zinc-500 hover:text-reddit-orange hover:bg-reddit-orange/10'}`}
                disabled={loading}
            >
                <svg viewBox="0 0 20 20" fill="currentColor" width="22" height="22"><path d="M10 3l7 7H3l7-7z"/></svg>
            </button>
            <span className={`text-xs font-black min-w-[20px] text-center ${scoreColor}`}>
                {formatScore(score)}
            </span>
            <button 
                onClick={(e) => { e.preventDefault(); handleVote('down'); }} 
                className={`p-1 rounded-md transition-colors ${voted === 'down' ? 'text-reddit-downvote bg-reddit-downvote/10' : 'text-zinc-500 hover:text-reddit-downvote hover:bg-reddit-downvote/10'}`}
                disabled={loading}
            >
                <svg viewBox="0 0 20 20" fill="currentColor" width="22" height="22"><path d="M10 17l-7-7h14l-7 7z"/></svg>
            </button>
        </div>
    );
}
