import { Link } from 'react-router-dom';
import VoteButton from './VoteButton';
import VerificationBadge from './VerificationBadge';
import { formatRelativeTime } from '../../utils/formatters';

export default function PostCard({ post, isDetail = false }) {
    if (!post) return null;

    const isTrimmed = !isDetail && post.body && post.body.length > 300;
    const bodyContent = isTrimmed ? `${post.body.substring(0, 300)}...` : post.body;

    return (
        <div className="reddit-card" style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            marginBottom: isDetail ? '0' : '16px',
            background: isDetail ? 'transparent' : 'var(--surface-color)',
            border: isDetail ? '1px solid var(--border-color)' : 'none',
            padding: '16px',
        }}>
            {/* Meta row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                {post.community && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--brand-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', overflow: 'hidden', flexShrink: 0 }}>
                            {post.community.iconUrl
                                ? <img src={post.community.iconUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                : '🌐'
                            }
                        </div>
                        <Link to={`/c/${post.community.slug}`} style={{ fontWeight: 700, color: 'white', textDecoration: 'none' }}>
                            d/{post.community.slug}
                        </Link>
                        <span>•</span>
                    </div>
                )}
                <span style={{ fontSize: '12px' }}>{formatRelativeTime(post.createdAt)}</span>
                <div style={{ marginLeft: 'auto' }}>
                    <VerificationBadge scores={post.detectionScores} status={post.status} />
                </div>
            </div>

            {/* Title */}
            <Link to={`/p/${post._id}`} style={{ textDecoration: 'none' }}>
                <h3 style={{
                    margin: '4px 0',
                    fontSize: isDetail ? '24px' : '18px',
                    fontWeight: 600,
                    color: 'white',
                    lineHeight: 1.4,
                }}>
                    {post.title}
                </h3>
            </Link>

            {/* Body */}
            {bodyContent && (
                <div style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.6, marginTop: '4px', opacity: 0.85 }}>
                    {bodyContent}
                </div>
            )}

            {/* Media */}
            {post.mediaUrls?.length > 0 && (
                <div style={{ marginTop: '12px', borderRadius: '16px', overflow: 'hidden', background: '#000', maxHeight: '512px', border: '1px solid var(--border-color)' }}>
                    <img src={post.mediaUrls[0]} alt="Post media" style={{ width: '100%', maxHeight: '512px', objectFit: 'contain', display: 'block' }} />
                </div>
            )}

            {/* Action bar - Latest Reddit style */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
                <div style={{ background: 'var(--surface-hover)', borderRadius: '9999px', display: 'flex', alignItems: 'center', padding: '0 4px' }}>
                    <VoteButton
                        initialScore={post.upvotes - post.downvotes}
                        targetId={post._id}
                        targetType="post"
                        horizontal={true}
                    />
                </div>

                <Link to={`/p/${post._id}`} className="sidebar-link" style={{ textDecoration: 'none', background: 'var(--surface-hover)', padding: '6px 12px', borderRadius: '9999px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    <span style={{ fontSize: '13px', fontWeight: 600 }}>{Math.floor(Math.random() * 20)}</span>
                </Link>

                <button className="sidebar-link" style={{ background: 'var(--surface-hover)', padding: '6px 12px', borderRadius: '9999px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                    <span style={{ fontSize: '13px', fontWeight: 600 }}>Share</span>
                </button>
            </div>
        </div>
    );
}
