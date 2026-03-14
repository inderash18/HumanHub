import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getPost } from '../services/postService';
import PostCard from '../components/posts/PostCard';
import CommentThread from '../components/comments/CommentThread';
import CommentEditor from '../components/comments/CommentEditor';
import Spinner from '../components/ui/Spinner';
import VoteButton from '../components/posts/VoteButton';

const SORT_OPTIONS = ['Best', 'Top', 'New', 'Controversial', 'Old', 'Q&A'];

export default function PostDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [commentSort, setCommentSort] = useState('Best');

    const loadData = async () => {
        try {
            const data = await getPost(id);
            setPost(data);
        } catch(e) {
            navigate('/feed');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, [id]);

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
            <Spinner />
        </div>
    );
    if (!post) return null;

    return (
        <div style={{ display: 'flex', gap: '24px' }}>
            {/* Main content */}
            <div style={{ flex: 1, minWidth: 0 }}>
                {/* Post */}
                <div className="reddit-card" style={{ marginBottom: '10px' }}>
                    <PostCard post={post} isDetail={true} />
                </div>

                {/* Comment actions bar */}
                <div className="reddit-card" style={{ padding: '8px 12px', marginBottom: '10px' }}>
                    <CommentEditor postId={post._id} onSubmitSuccess={loadData} />
                </div>

                {/* Comment sort */}
                <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#1c1c1c', marginRight: '4px' }}>Sort by:</span>
                    {SORT_OPTIONS.map(opt => (
                        <button
                            key={opt}
                            onClick={() => setCommentSort(opt)}
                            style={{
                                padding: '4px 10px', borderRadius: '20px', border: 'none', cursor: 'pointer',
                                fontSize: '12px', fontWeight: 700, fontFamily: 'inherit',
                                background: commentSort === opt ? '#e8f0fe' : 'transparent',
                                color: commentSort === opt ? '#0079d3' : '#878a8c',
                                transition: 'background .1s'
                            }}
                        >
                            {opt}
                        </button>
                    ))}
                </div>

                {/* Comments */}
                <div className="reddit-card" style={{ padding: '16px' }}>
                    <CommentThread
                        comments={[]}
                        onReply={(parentId) => console.log('Reply to', parentId)}
                    />
                    {/* Placeholder when empty */}
                    <div style={{ textAlign: 'center', padding: '24px', color: '#878a8c' }}>
                        <div style={{ fontSize: '32px', marginBottom: '8px' }}>💬</div>
                        <div style={{ fontWeight: 700, fontSize: '14px', color: '#1c1c1c', marginBottom: '4px' }}>No Comments Yet</div>
                        <div style={{ fontSize: '13px' }}>Be the first to share what you think!</div>
                    </div>
                </div>
            </div>

            {/* Right sidebar */}
            <div style={{ width: '312px', flexShrink: 0, display: 'none' }} className="post-detail-sidebar">
                <style>{`@media(min-width:1100px){.post-detail-sidebar{display:block!important}}`}</style>

                {/* Community info */}
                {post.community && (
                    <div className="reddit-widget" style={{ marginBottom: '16px' }}>
                        <div style={{ padding: '10px 12px', background: 'linear-gradient(135deg, #ff4500, #ff6534)', color: 'white', fontWeight: 700 }}>
                            About r/{post.community.slug}
                        </div>
                        <div style={{ padding: '12px' }}>
                            <p style={{ fontSize: '13px', color: '#1c1c1c', lineHeight: 1.5, marginBottom: '12px' }}>
                                {post.community.description || `A community for humans on HumanHub.`}
                            </p>
                            <button className="btn-reddit-blue" style={{ width: '100%', fontFamily: 'inherit', marginBottom: '8px' }}>
                                Join Community
                            </button>
                            <Link to={`/c/${post.community.slug}`} className="btn-reddit-outline" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', fontFamily: 'inherit' }}>
                                View Community
                            </Link>
                        </div>
                    </div>
                )}

                {/* Post stats */}
                <div className="reddit-widget" style={{ marginBottom: '16px' }}>
                    <div style={{ padding: '10px 12px', fontWeight: 700, fontSize: '14px', borderBottom: '1px solid #edeff1' }}>
                        Post Stats
                    </div>
                    <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {[
                            { label: 'Upvote Ratio', value: '94%', icon: '⬆️' },
                            { label: 'Total Votes', value: `${(post.upvotes + post.downvotes) || 0}`, icon: '🗳️' },
                            { label: 'Human Score', value: `${Math.round((1 - (post.detectionScores?.text?.score || 0)) * 100)}%`, icon: '✅' },
                        ].map(stat => (
                            <div key={stat.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#878a8c' }}>
                                    <span>{stat.icon}</span> {stat.label}
                                </div>
                                <span style={{ fontWeight: 700, fontSize: '13px', color: '#1c1c1c' }}>{stat.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
