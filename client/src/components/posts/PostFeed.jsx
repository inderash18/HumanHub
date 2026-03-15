import { useEffect } from 'react';
import { usePosts } from '../../hooks/usePosts';
import PostCard from './PostCard';
import { useIntersection } from '../../hooks/useIntersection';

function PostSkeleton() {
    return (
        <div className="reddit-card" style={{ 
            display: 'flex', marginBottom: '12px', overflow: 'hidden', padding: '16px',
            background: 'var(--surface-color)', border: '1px solid var(--border-color)',
            flexDirection: 'column', gap: '12px'
        }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--surface-elevated)', animation: 'pulse 1.5s infinite' }} />
                <div style={{ width: '120px', height: '10px', borderRadius: '4px', background: 'var(--surface-elevated)', animation: 'pulse 1.5s 0.2s infinite' }} />
            </div>
            <div style={{ width: '90%', height: '20px', borderRadius: '4px', background: 'var(--surface-elevated)', animation: 'pulse 1.5s 0.3s infinite' }} />
            <div style={{ width: '70%', height: '14px', borderRadius: '4px', background: 'var(--surface-elevated)', animation: 'pulse 1.5s 0.4s infinite' }} />
            <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                {[1, 2, 3].map(i => (
                    <div key={i} style={{ width: '60px', height: '28px', borderRadius: '20px', background: 'var(--surface-elevated)', animation: 'pulse 1.5s 0.5s infinite' }} />
                ))}
            </div>
            <style>{`@keyframes pulse { 0% { opacity: 0.5; } 50% { opacity: 1; } 100% { opacity: 0.5; } }`}</style>
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
            <div className="reddit-card" style={{ padding: '32px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>⚠️</div>
                <div style={{ fontWeight: 800, color: 'white', fontSize: '18px', fontFamily: 'Outfit, sans-serif' }}>Connection Interrupted</div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px', lineHeight: 1.5 }}>{error}</div>
                <button 
                  onClick={() => loadPosts(true)} 
                  className="btn-dhruvit" 
                  style={{ marginTop: '20px', padding: '10px 24px' }}
                >
                    Retry Connection
                </button>
            </div>
        );
    }

    if (!loading && posts.length === 0) {
        return (
            <div className="reddit-card" style={{ padding: '64px 32px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '48px', marginBottom: '20px' }}>🌵</div>
                <h3 style={{ fontSize: '22px', fontWeight: 800, color: 'white', marginBottom: '8px', fontFamily: 'Outfit, sans-serif' }}>
                    Tumbleweeds...
                </h3>
                <p style={{ fontSize: '15px', color: 'var(--text-muted)', marginBottom: '24px', maxWidth: '300px', margin: '0 auto' }}>
                    This human space is quiet. Be the first to start a conversation.
                </p>
                <button className="btn-dhruvit" style={{ padding: '12px 28px' }}>Create First Post</button>
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
