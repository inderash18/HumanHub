import { useState } from 'react';
import api from '../services/api.js';

export const useVote = (initialScore, targetId, targetType = 'post') => {
    const [score, setScore] = useState(initialScore);
    const [status, setStatus] = useState(0); // 1 = upvote, -1 = downvote, 0 = none
    const [loading, setLoading] = useState(false);

    const handleVote = async (value) => {
        if (loading) return; // Debounce clicks safely
        
        let newStatus = value;
        if (status === value) newStatus = 0; // Clear vote if clicking same button
        
        const previousScore = score;
        const previousStatus = status;

        // Optimistic Update Math
        let delta = 0;
        if (status === 0 && newStatus === 1) delta = 1;
        if (status === 0 && newStatus === -1) delta = -1;
        if (status === 1 && newStatus === -1) delta = -2;
        if (status === -1 && newStatus === 1) delta = 2;
        if (status === 1 && newStatus === 0) delta = -1;
        if (status === -1 && newStatus === 0) delta = 1;

        setScore(prev => prev + delta);
        setStatus(newStatus);
        setLoading(true);

        try {
            // Note dynamic endpoint parsing via mergeParams in Express server config
            await api.post(`/api/${targetType}s/${targetId}/vote`, { value: newStatus });
        } catch (err) {
            // Revert on fail
            setScore(previousScore);
            setStatus(previousStatus);
            console.error('Vote failed securely');
        } finally {
            setLoading(false);
        }
    };

    return { score, status, handleVote, loading };
};
