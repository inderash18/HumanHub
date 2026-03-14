import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function VoteButton({ initialScore = 0, targetId, targetType, horizontal = false }) {
    const [score, setScore] = useState(initialScore);
    const [voted, setVoted] = useState(null); // 'up' | 'down' | null

    const handleVote = (dir) => {
        if (voted === dir) {
            // Undo vote
            setVoted(null);
            setScore(initialScore);
        } else if (voted && voted !== dir) {
            // Switch vote
            setVoted(dir);
            setScore(dir === 'up' ? initialScore + 1 : initialScore - 1);
        } else {
            setVoted(dir);
            setScore(dir === 'up' ? initialScore + 1 : initialScore - 1);
        }
    };

    const formatScore = (n) => {
        if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
        return n;
    };

    const scoreColor = voted === 'up' ? '#ff4500' : voted === 'down' ? '#7193ff' : '#878a8c';

    if (horizontal) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button onClick={() => handleVote('up')} className={`vote-btn ${voted === 'up' ? 'upvoted' : ''}`} title="Upvote">
                    <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path d="M10 3l7 7H3l7-7z"/></svg>
                </button>
                <span style={{ fontSize: '12px', fontWeight: 700, color: scoreColor, minWidth: '20px', textAlign: 'center' }}>
                    {formatScore(score)}
                </span>
                <button onClick={() => handleVote('down')} className={`vote-btn ${voted === 'down' ? 'downvoted' : ''}`} title="Downvote">
                    <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path d="M10 17l-7-7h14l-7 7z"/></svg>
                </button>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', padding: '8px 4px' }}>
            <button onClick={() => handleVote('up')} className={`vote-btn ${voted === 'up' ? 'upvoted' : ''}`} title="Upvote">
                <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18"><path d="M10 3l7 7H3l7-7z"/></svg>
            </button>
            <span style={{ fontSize: '12px', fontWeight: 700, color: scoreColor, lineHeight: 1 }}>
                {formatScore(score)}
            </span>
            <button onClick={() => handleVote('down')} className={`vote-btn ${voted === 'down' ? 'downvoted' : ''}`} title="Downvote">
                <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18"><path d="M10 17l-7-7h14l-7 7z"/></svg>
            </button>
        </div>
    );
}
