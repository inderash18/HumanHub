import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getCommunity } from '../services/communityService';
import PostFeed from '../components/posts/PostFeed';
import PostEditor from '../components/posts/PostEditor';
import Spinner from '../components/ui/Spinner';

export default function CommunityPage() {
    const { slug } = useParams();
    const [community, setCommunity] = useState(null);
    const [loading, setLoading] = useState(true);
    const [joined, setJoined] = useState(false);

    useEffect(() => {
        const loadPage = async () => {
            setLoading(true);
            try {
                const data = await getCommunity(slug);
                setCommunity(data);
            } catch (err) {
                console.error('Community load failed');
            } finally {
                setLoading(false);
            }
        };
        loadPage();
    }, [slug]);

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
            <Spinner size="lg" />
        </div>
    );
    if (!community) return (
        <div style={{ textAlign: 'center', padding: '48px', color: '#878a8c', fontSize: '18px' }}>
            Community not found.
        </div>
    );

    const bannerColor = community.bannerColor || '#ff4500';

    return (
        <div>
            {/* Banner */}
            <div style={{ height: '128px', background: `linear-gradient(to bottom, ${bannerColor}, ${bannerColor}dd)`, marginTop: '-20px', marginLeft: '-24px', marginRight: '-24px' }}>
                {community.bannerUrl && (
                    <img src={community.bannerUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="banner" />
                )}
            </div>

            {/* Community header bar */}
            <div style={{ background: '#fff', borderBottom: '1px solid #edeff1', padding: '0 24px', marginLeft: '-24px', marginRight: '-24px' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'flex-end', gap: '16px', paddingBottom: '12px' }}>
                    <div style={{
                        width: '72px', height: '72px', borderRadius: '50%', border: '4px solid white',
                        background: bannerColor, marginTop: '-24px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '32px', overflow: 'hidden', flexShrink: 0, boxShadow: '0 2px 4px rgba(0,0,0,.2)'
                    }}>
                        {community.iconUrl ? <img src={community.iconUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🌐'}
                    </div>
                    <div style={{ flex: 1, paddingBottom: '4px' }}>
                        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1c1c1c', margin: '0 0 2px', fontFamily: 'IBM Plex Sans, sans-serif' }}>
                            r/{slug}
                        </h1>
                        <div style={{ fontSize: '14px', color: '#878a8c' }}>r/{slug}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', paddingBottom: '8px' }}>
                        <button
                            onClick={() => setJoined(!joined)}
                            className={`btn-join ${joined ? 'joined' : ''}`}
                            style={{ fontFamily: 'inherit', padding: '6px 24px', fontSize: '14px' }}
                        >
                            {joined ? 'Joined' : 'Join'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div style={{ display: 'flex', gap: '24px', marginTop: '20px', maxWidth: '1200px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <PostEditor communityId={community._id} />
                    <PostFeed communityId={community._id} />
                </div>

                {/* Right sidebar */}
                <div style={{ width: '312px', flexShrink: 0 }}>
                    {/* About */}
                    <div className="reddit-widget" style={{ marginBottom: '16px' }}>
                        <div style={{ padding: '10px 12px', background: bannerColor, color: 'white', fontWeight: 700, fontSize: '14px' }}>
                            About r/{slug}
                        </div>
                        <div style={{ padding: '12px' }}>
                            <p style={{ fontSize: '14px', color: '#1c1c1c', lineHeight: 1.5, marginBottom: '12px' }}>
                                {community.description || `Welcome to r/${slug}! A community for human discussion.`}
                            </p>
                            <div style={{ borderTop: '1px solid #edeff1', paddingTop: '10px', display: 'flex', gap: '16px' }}>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '16px', color: '#1c1c1c' }}>{community.memberCount?.toLocaleString() || '1,024'}</div>
                                    <div style={{ fontSize: '12px', color: '#878a8c' }}>Members</div>
                                </div>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '16px', color: '#1c1c1c' }}>🟢 {Math.floor(Math.random() * 200 + 50)}</div>
                                    <div style={{ fontSize: '12px', color: '#878a8c' }}>Online</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Rules */}
                    <div className="reddit-widget">
                        <div style={{ padding: '10px 12px', fontWeight: 700, fontSize: '14px', borderBottom: '1px solid #edeff1' }}>
                            r/{slug} Rules
                        </div>
                        <ol style={{ margin: 0, padding: '8px 12px 12px 28px', listStyle: 'decimal', color: '#1c1c1c', fontSize: '13px' }}>
                            {(community.rules?.length > 0 ? community.rules : [
                                'Be human.',
                                'No AI-generated content.',
                                'Discuss respectfully.',
                                'No spam or self-promotion.',
                                'Stay on topic.',
                            ]).map((r, i) => (
                                <li key={i} style={{ padding: '6px 0', borderBottom: '1px solid #edeff1' }}>{r}</li>
                            ))}
                        </ol>
                    </div>
                </div>
            </div>
        </div>
    );
}
