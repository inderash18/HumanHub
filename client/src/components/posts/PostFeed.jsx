import { useEffect } from 'react';
import { usePosts } from '../../hooks/usePosts';
import PostCard from './PostCard';
import { useIntersection } from '../../hooks/useIntersection';

function PostSkeleton() {
    return (
        <div className="premium-card p-5 mb-4 flex flex-col gap-4 bg-[var(--surface-color)] border border-[var(--border-color)]">
            <div className="flex gap-3 items-center">
                <div className="w-10 h-10 rounded-full bg-[var(--surface-hover)] animate-pulse" />
                <div className="flex flex-col gap-2">
                    <div className="w-24 h-3 rounded-full bg-[var(--surface-hover)] animate-pulse" />
                    <div className="w-16 h-2 rounded-full bg-[var(--surface-hover)] animate-pulse" />
                </div>
            </div>
            <div className="w-[85%] h-4 rounded-full bg-[var(--surface-hover)] animate-pulse" />
            <div className="w-[60%] h-3 rounded-full bg-[var(--surface-hover)] animate-pulse" />
            <div className="flex gap-4 border-t border-[var(--border-color)] pt-3.5 mt-1">
                <div className="w-12 h-6 rounded-full bg-[var(--surface-hover)] animate-pulse" />
                <div className="w-12 h-6 rounded-full bg-[var(--surface-hover)] animate-pulse" />
                <div className="w-12 h-6 rounded-full bg-[var(--surface-hover)] animate-pulse" />
            </div>
        </div>
    );
}

export default function PostFeed({ communityId = null, sort = 'hot' }) {
    const { posts, loading, error, hasMore, loadPosts } = usePosts(communityId);
    const [loaderRef, isIntersecting] = useIntersection();

    useEffect(() => {
        loadPosts(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [communityId, sort]);

    useEffect(() => {
        if (isIntersecting && hasMore && !loading) {
            loadPosts(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isIntersecting, hasMore, loading]);

    if (error) {
        return (
            <div className="premium-card p-8 text-center border border-[var(--border-color)] flex flex-col items-center gap-3">
                <div className="text-3xl text-[var(--rejected-color)]">⚠️</div>
                <h3 className="font-brand font-bold text-md text-[var(--text-primary)]">Connection Interrupted</h3>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed max-w-xs">{error}</p>
                <button 
                  onClick={() => loadPosts(true)} 
                  className="btn-premium text-xs mt-3 py-2 px-6"
                >
                    Retry Connection
                </button>
            </div>
        );
    }

    if (!loading && posts.length === 0) {
        return (
            <div className="premium-card p-16 text-center border border-[var(--border-color)] flex flex-col items-center gap-4">
                <div className="text-4xl">🌵</div>
                <h3 className="font-brand font-bold text-lg text-[var(--text-primary)]">Tumbleweeds...</h3>
                <p className="text-xs text-[var(--text-secondary)] max-w-xs leading-relaxed">
                    This human space is quiet. Be the first to start a conversation.
                </p>
                <button className="btn-premium text-xs mt-2 py-2 px-6">Create First Post</button>
            </div>
        );
    }

    return (
        <div style={{ width: '100%' }}>
            {loading && posts.length === 0 ? (
                [1, 2, 3].map(i => <PostSkeleton key={i} />)
            ) : (
                posts.map(post => (
                    <PostCard key={post._id} post={post} />
                ))
            )}

            <div ref={loaderRef} style={{ padding: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '64px' }}>
                {loading && posts.length > 0 && (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {[0, 1, 2].map(i => (
                            <div key={i} style={{
                                width: '10px', height: '10px', borderRadius: '50%', background: 'var(--brand-color)',
                                animation: `bounce 0.8s ${i * 0.2}s infinite cubic-bezier(0.45, 0.05, 0.55, 0.95) alternate`
                            }} />
                        ))}
                        <style>{`@keyframes bounce { to { transform: translateY(-10px); opacity: 0.3; } }`}</style>
                    </div>
                )}
                {!hasMore && posts.length > 0 && (
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                        <div style={{ fontSize: '20px', marginBottom: '8px' }}>🏁</div>
                        <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.5px' }}>
                            Human-verified content reached its limit.
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
