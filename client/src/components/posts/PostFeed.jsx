import { useEffect } from 'react';
import { usePosts } from '../../hooks/usePosts';
import PostCard from './PostCard';
import Spinner from '../ui/Spinner';
import { useIntersection } from '../../hooks/useIntersection';

export default function PostFeed({ communityId = null }) {
    const { posts, loading, error, hasMore, loadPosts } = usePosts(communityId);
    const [loaderRef, isIntersecting] = useIntersection({ threshold: 0.1 });

    // Initial load
    useEffect(() => {
        loadPosts(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [communityId]);

    // Infinite scroll trigger
    useEffect(() => {
        if (isIntersecting && hasMore && !loading) {
            loadPosts(false);
        }
    }, [isIntersecting, hasMore, loading, loadPosts]);

    if (error) {
        return <div className="p-8 text-center text-brand-danger bg-brand-danger/10 rounded-xl border border-brand-danger/20">{error}</div>;
    }

    if (!loading && posts.length === 0) {
        return (
            <div className="p-16 text-center border border-white/5 rounded-xl border-dashed">
                <div className="text-4xl mb-4">🏜️</div>
                <h3 className="text-xl font-playfair font-bold text-white mb-2">No posts here yet.</h3>
                <p className="text-brand-muted text-sm">Be the first human to leave a mark in this community.</p>
            </div>
        );
    }

    return (
        <div className="w-full flex w-full flex-col">
            {posts.map(post => (
                <PostCard key={post._id} post={post} />
            ))}
            
            <div ref={loaderRef} className="py-8 flex justify-center">
                {loading && <Spinner size="sm" />}
                {!hasMore && posts.length > 0 && (
                    <span className="text-brand-muted text-xs font-mono tracking-widest uppercase">End of feed</span>
                )}
            </div>
        </div>
    );
}
