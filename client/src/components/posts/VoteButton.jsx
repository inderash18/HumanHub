import { useState, useEffect } from 'react';
import { votePost } from '../../services/postService';
import toast from 'react-hot-toast';

export default function VoteButton({ initialScore = 0, initialVote = null, targetId, targetType, horizontal = false }) {
    const parseInitialVote = (v) => {
        if (v === 1 || v === 'up') return 'up';
        if (v === -1 || v === 'down') return 'down';
        return null;
    };

    const [score, setScore] = useState(initialScore);
    const [voted, setVoted] = useState(parseInitialVote(initialVote));
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setScore(initialScore);
        setVoted(parseInitialVote(initialVote));
    }, [initialScore, initialVote]);

    const handleVote = async (dir) => {
        if (loading) return;
        setLoading(true);
        try {
            const val = dir === voted ? 0 : (dir === 'up' ? 1 : -1);
            await votePost(targetId, val);
            // Toggle or change vote
            if (voted === dir) {
                setVoted(null);
                setScore(voted === 'up' ? Math.max(0, score - 1) : score + 1);
            } else {
                const diff = voted ? (dir === 'up' ? 2 : -2) : (dir === 'up' ? 1 : -1);
                setVoted(dir);
                setScore(Math.max(0, score + diff));
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
