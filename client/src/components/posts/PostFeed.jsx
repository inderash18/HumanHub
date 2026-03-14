import { useEffect } from 'react';
import { usePosts } from '../../hooks/usePosts';
import PostCard from './PostCard';
import { useIntersection } from '../../hooks/useIntersection';

function PostSkeleton() {
    return (
        <div className="reddit-card" style={{ display: 'flex', marginBottom: '10px', overflow: 'hidden' }}>
            <div style={{ width: '40px', background: '#f6f7f8', flexShrink: 0, borderRight: '1px solid #edeff1' }} />
            <div style={{ flex: 1, padding: '12px' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#edeff1' }} />
                    <div style={{ width: '120px', height: '10px', borderRadius: '4px', background: '#edeff1' }} />
                </div>
                <div style={{ width: '80%', height: '16px', borderRadius: '4px', background: '#edeff1', marginBottom: '8px' }} />
                <div style={{ width: '60%', height: '16px', borderRadius: '4px', background: '#edeff1', marginBottom: '12px' }} />
                <div style={{ display: 'flex', gap: '8px' }}>
                    {[80, 70, 60].map((w, i) => (
                        <div key={i} style={{ width: `${w}px`, height: '26px', borderRadius: '2px', background: '#edeff1' }} />
                    ))}
                </div>
            </div>
        </div>
    );
}

export default function PostFeed({ communityId = null, sort = 'hot' }) {
    const { posts, loading, error, hasMore, loadPosts } = usePosts(communityId);
    // Pass no options so hook uses stable default
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
            <div className="reddit-card" style={{ padding: '24px', textAlign: 'center', color: '#ff4500' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>⚠️</div>
                <div style={{ fontWeight: 700 }}>Failed to load posts</div>
                <div style={{ fontSize: '13px', color: '#878a8c', marginTop: '4px' }}>{error}</div>
                <button onClick={() => loadPosts(true)} className="btn-reddit-orange" style={{ marginTop: '12px', fontFamily: 'inherit' }}>
                    Retry
                </button>
            </div>
        );
    }

    if (!loading && posts.length === 0) {
        return (
            <div className="reddit-card" style={{ padding: '48px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>🏜️</div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1c1c1c', marginBottom: '8px', fontFamily: 'IBM Plex Sans, sans-serif' }}>
                    No posts here yet
                </h3>
                <p style={{ fontSize: '14px', color: '#878a8c', marginBottom: '16px' }}>
                    Be the first human to leave a mark in this community.
                </p>
            </div>
        );
    }

    return (
        <div style={{ width: '100%' }}>
            {loading && posts.length === 0 ? (
                [1, 2, 3, 4].map(i => <PostSkeleton key={i} />)
            ) : (
                posts.map(post => (
                    <PostCard key={post._id} post={post} />
                ))
            )}

            <div ref={loaderRef} style={{ padding: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '48px' }}>
                {loading && posts.length > 0 && (
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        {[0, 1, 2].map(i => (
                            <div key={i} style={{
                                width: '8px', height: '8px', borderRadius: '50%', background: '#ff4500',
                                animation: `bounce 0.6s ${i * 0.2}s infinite alternate`
                            }} />
                        ))}
                        <style>{`@keyframes bounce { to { transform: translateY(-6px); opacity: 0.5; } }`}</style>
                    </div>
                )}
                {!hasMore && posts.length > 0 && (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '24px', marginBottom: '6px' }}>🎉</div>
                        <div style={{ fontSize: '12px', color: '#878a8c', fontWeight: 700 }}>
                            You've reached the end
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
