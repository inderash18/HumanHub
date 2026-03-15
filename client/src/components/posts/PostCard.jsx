import { Link } from 'react-router-dom';
import VoteButton from './VoteButton';
import VerificationBadge from './VerificationBadge';
import { formatRelativeTime } from '../../utils/formatters';

export default function PostCard({ post, isDetail = false }) {
    if (!post) return null;

    // Improved body rendering for rich text
    const renderBody = () => {
        if (!post.body) return null;
        
        if (isDetail) {
            return <div 
                style={{ fontSize: '15px', color: 'var(--text-primary)', lineHeight: 1.6, opacity: 0.9 }}
                dangerouslySetInnerHTML={{ __html: post.body }} 
            />;
        }

        // For feed view: Strip HTML for the preview or show it if short
        // A simple regex to strip tags for the preview text
        const plainText = post.body.replace(/<[^>]*>?/gm, '');
        const isLong = plainText.length > 300;
        const previewText = isLong ? `${plainText.substring(0, 300)}...` : plainText;

        // If the body contains images but preview is text, we might want to show a 'Media' indicator
        const hasImages = post.body.includes('<img');

        if (!previewText && hasImages) {
            return (
                <div style={{ fontSize: '14px', color: 'var(--brand-color)', fontStyle: 'italic', opacity: 0.8 }}>
                    [Image Creation Published]
                </div>
            );
        }

        return (
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, opacity: 0.8 }}>
                {previewText}
                {hasImages && !isLong && <div style={{ marginTop: '8px', fontStyle: 'italic', fontSize: '12px', color: 'var(--brand-color)' }}>[Embedded Human Creation]</div>}
            </div>
        );
    };

    return (
        <div className="reddit-card" style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            marginBottom: isDetail ? '0' : '12px',
            background: isDetail ? 'transparent' : 'var(--surface-color)',
            border: isDetail ? '1px solid var(--border-color)' : '1px solid var(--border-color)',
            padding: '16px',
            borderRadius: isDetail ? '0' : '16px',
            transition: 'var(--tr-smooth)'
        }}>
            {/* Meta row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                {post.community && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: 'var(--brand-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', overflow: 'hidden', flexShrink: 0 }}>
                            {post.community.iconUrl
                                ? <img src={post.community.iconUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                : '🌐'
                            }
                        </div>
                        <Link to={`/c/${post.community.slug}`} style={{ fontWeight: 800, color: 'white', textDecoration: 'none', fontSize: '12px' }}>
                            d/{post.community.slug}
                        </Link>
                        <span style={{ opacity: 0.5 }}>•</span>
                    </div>
                )}
                <span style={{ fontSize: '12px', fontWeight: 500 }}>{formatRelativeTime(post.createdAt)}</span>
                <div style={{ marginLeft: 'auto' }}>
                    <VerificationBadge scores={post.detectionScores} status={post.status} />
                </div>
            </div>

            {/* Content Area */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Link to={`/p/${post._id}`} style={{ textDecoration: 'none' }}>
                    <h3 style={{
                        margin: 0,
                        fontSize: isDetail ? '26px' : '19px',
                        fontWeight: 800,
                        color: 'white',
                        lineHeight: 1.3,
                        letterSpacing: '-0.3px',
                        fontFamily: 'Outfit, sans-serif'
                    }}>
                        {post.title}
                    </h3>
                </Link>

                {renderBody()}
            </div>

            {/* Media */}
            {post.mediaUrls?.length > 0 && (
                <div style={{ marginTop: '8px', borderRadius: '12px', overflow: 'hidden', background: '#000', maxHeight: '512px', border: '1px solid var(--border-color)' }}>
                    <img src={post.mediaUrls[0]} alt="Post media" style={{ width: '100%', maxHeight: '512px', objectFit: 'contain', display: 'block' }} />
                </div>
            )}

            {/* Action bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <div style={{ background: 'var(--surface-elevated)', borderRadius: '9999px', display: 'flex', alignItems: 'center', padding: '0 2px' }}>
                    <VoteButton
                        initialScore={post.upvotes - post.downvotes}
                        targetId={post._id}
                        targetType="post"
                        horizontal={true}
                    />
                </div>

                <Link to={`/p/${post._id}`} className="sidebar-link" style={{ 
                    textDecoration: 'none', background: 'var(--surface-elevated)', border: '1px solid var(--border-color)',
                    padding: '6px 14px', borderRadius: '9999px', display: 'flex', alignItems: 'center', gap: '8px',
                    height: '34px'
                }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    <span style={{ fontSize: '12px', fontWeight: 800 }}>{Math.floor(Math.random() * 20)}</span>
                </Link>

                <button className="sidebar-link" style={{ 
                    background: 'var(--surface-elevated)', border: '1px solid var(--border-color)',
                    padding: '6px 14px', borderRadius: '9999px', display: 'flex', alignItems: 'center', gap: '8px',
                    height: '34px', cursor: 'pointer'
                }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                    <span style={{ fontSize: '12px', fontWeight: 800 }}>Share</span>
                </button>
            </div>
        </div>
    );
}
