import { useState, useCallback } from 'react';
import { fetchPosts } from '../services/postService.js';
import { toast } from 'react-hot-toast';

export const usePosts = (community = null) => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const [cursor, setCursor] = useState(null);

    const loadPosts = useCallback(async (reset = false) => {
        if (!hasMore && !reset) return;

        setLoading(true);
        setError(null);
        try {
            const currentCursor = reset ? null : cursor;
            const data = await fetchPosts(currentCursor, community);
            
            setPosts(prev => reset ? data.data : [...prev, ...data.data]);
            setCursor(data.nextCursor);
            setHasMore(data.nextCursor !== null);
        } catch (err) {
            console.error('Fetch posts error', err);
            setError(err.message || 'Failed to fetch discussions.');
            toast.error('Failed to load organic content.');
        } finally {
            setLoading(false);
        }
    }, [cursor, hasMore, community]);

    return { posts, setPosts, loading, error, hasMore, loadPosts };
};
