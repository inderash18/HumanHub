import { useState } from 'react';

export default function VoteButton({ initialScore = 0, targetId, targetType, horizontal = false }) {
    const [score, setScore] = useState(initialScore);
    const [voted, setVoted] = useState(null); // 'up' | 'down' | null

    const handleVote = (dir) => {
        if (voted === dir) {
            setVoted(null);
            setScore(initialScore);
        } else if (voted && voted !== dir) {
            setVoted(dir);
            setScore(dir === 'up' ? initialScore + 1 : initialScore - 1);
        } else {
            setVoted(dir);
            setScore(dir === 'up' ? initialScore + 1 : initialScore - 1);
        }
    };

    const formatScore = (n) => {
        if (Math.abs(n) >= 1000) return `${(n / 1000).toFixed(1)}k`;
        return n;
    };

    const scoreColor = voted === 'up' ? 'var(--brand-color)' : voted === 'down' ? '#7193ff' : 'var(--text-primary)';

    if (horizontal) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button onClick={() => handleVote('up')} className={`vote-btn ${voted === 'up' ? 'upvoted' : ''}`} title="Upvote">
                    <svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20"><path d="M10 3l7 7H3l7-7z"/></svg>
                </button>
                <span style={{ fontSize: '13px', fontWeight: 800, color: scoreColor, minWidth: '24px', textAlign: 'center' }}>
                    {formatScore(score)}
                </span>
                <button onClick={() => handleVote('down')} className={`vote-btn ${voted === 'down' ? 'downvoted' : ''}`} title="Downvote">
                    <svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20"><path d="M10 17l-7-7h14l-7 7z"/></svg>
                </button>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <button onClick={() => handleVote('up')} className={`vote-btn ${voted === 'up' ? 'upvoted' : ''}`} title="Upvote">
                <svg viewBox="0 0 20 20" fill="currentColor" width="22" height="22"><path d="M10 3l7 7H3l7-7z"/></svg>
            </button>
            <span style={{ fontSize: '13px', fontWeight: 800, color: scoreColor, lineHeight: 1 }}>
                {formatScore(score)}
            </span>
            <button onClick={() => handleVote('down')} className={`vote-btn ${voted === 'down' ? 'downvoted' : ''}`} title="Downvote">
                <svg viewBox="0 0 20 20" fill="currentColor" width="22" height="22"><path d="M10 17l-7-7h14l-7 7z"/></svg>
            </button>
        </div>
    );
}
