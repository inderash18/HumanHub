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
            flexDirection: 'row',
            marginBottom: isDetail ? '0' : '10px',
            background: isDetail ? 'transparent' : undefined,
            border: isDetail ? 'none' : undefined,
        }}>
            {/* Vote column */}
            <div style={{
                width: '40px', flexShrink: 0,
                background: isDetail ? 'transparent' : '#f8f9fa',
                borderRadius: '4px 0 0 4px',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                borderRight: isDetail ? 'none' : '1px solid #edeff1',
            }}>
                <VoteButton
                    initialScore={post.upvotes - post.downvotes}
                    targetId={post._id}
                    targetType="post"
                />
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0, padding: '8px 8px 4px 8px' }}>
                {/* Meta row */}
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px', marginBottom: '6px', fontSize: '12px', color: '#878a8c' }}>
                    {post.community && (
                        <>
                            <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#ff4500', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', overflow: 'hidden', flexShrink: 0 }}>
                                {post.community.iconUrl
                                    ? <img src={post.community.iconUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    : '🌐'
                                }
                            </div>
                            <Link to={`/c/${post.community.slug}`} style={{ fontWeight: 700, color: '#1c1c1c', textDecoration: 'none', fontSize: '12px' }}
                                onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                                onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                            >
                                r/{post.community.slug}
                            </Link>
                            <span>•</span>
                        </>
                    )}
                    <span>Posted by</span>
                    <Link to={`/u/${post.author?.username}`} style={{ color: '#878a8c', textDecoration: 'none' }}
                        onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                        onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                    >
                        u/{post.author?.username}
                    </Link>
                    <span>{formatRelativeTime(post.createdAt)}</span>
                    <div style={{ marginLeft: 'auto' }}>
                        <VerificationBadge scores={post.detectionScores} status={post.status} />
                    </div>
                </div>

                {/* Title */}
                <Link to={`/p/${post._id}`} style={{ textDecoration: 'none' }}>
                    <h2 style={{
                        margin: '0 0 6px 0',
                        fontSize: isDetail ? '20px' : '18px',
                        fontWeight: 500,
                        color: '#222',
                        lineHeight: 1.3,
                        fontFamily: 'IBM Plex Sans, sans-serif',
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = '#0079d3'}
                    onMouseLeave={e => e.currentTarget.style.color = '#222'}
                    >
                        {post.title}
                    </h2>
                </Link>

                {/* Flair */}
                {post.flair && (
                    <span className="flair" style={{ background: '#0079d3', color: 'white', marginBottom: '6px', display: 'inline-block' }}>
                        {post.flair}
                    </span>
                )}

                {/* Body */}
                {bodyContent && (
                    <div style={{ fontSize: '14px', color: '#3c3c3c', lineHeight: 1.6, marginBottom: '8px', fontFamily: 'Noto Sans, sans-serif' }}>
                        {bodyContent}
                        {isTrimmed && (
                            <Link to={`/p/${post._id}`} style={{ color: '#0079d3', fontWeight: 700, marginLeft: '4px' }}>
                                Continue reading →
                            </Link>
                        )}
                    </div>
                )}

                {/* Media */}
                {post.mediaUrls?.length > 0 && (
                    <div style={{ marginBottom: '8px', borderRadius: '4px', overflow: 'hidden', background: '#000', maxHeight: '512px' }}>
                        <img src={post.mediaUrls[0]} alt="Post media" style={{ width: '100%', maxHeight: '512px', objectFit: 'contain', display: 'block' }} />
                    </div>
                )}

                {/* Action bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0', flexWrap: 'wrap', marginTop: '4px' }}>
                    {/* Mobile vote */}
                    <div style={{ marginRight: '8px' }} className="mobile-vote">
                        <VoteButton initialScore={post.upvotes - post.downvotes} targetId={post._id} targetType="post" horizontal />
                    </div>

                    <Link to={`/p/${post._id}`} className="reddit-action-btn" style={{ textDecoration: 'none' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                        {Math.floor(Math.random() * 150)} Comments
                    </Link>

                    <button className="reddit-action-btn">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                        Share
                    </button>

                    <button className="reddit-action-btn">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                        Save
                    </button>

                    <button className="reddit-action-btn">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
