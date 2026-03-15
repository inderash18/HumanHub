import { useState, useEffect } from 'react';
import PostEditor from '../components/posts/PostEditor';
import { fetchCommunities } from '../services/communityService';
import { motion } from 'framer-motion';

const TABS = [
    { key: 'text', icon: '📝', label: 'Post' },
    { key: 'image', icon: '🖼️', label: 'Images' },
    { key: 'link', icon: '🔗', label: 'Link' },
];

export default function SubmitPostPage() {
    const [activeTab, setActiveTab] = useState('text');
    const [communities, setCommunities] = useState([]);
    const [selectedCommunity, setSelectedCommunity] = useState('');

    const [loadingCommunities, setLoadingCommunities] = useState(true);

    useEffect(() => {
        const loadCommunities = async () => {
            try {
                const data = await fetchCommunities();
                if (data && data.length > 0) {
                    setCommunities(data);
                    setSelectedCommunity(data[0]._id);
                } else {
                    const defaults = [
                        { _id: '65f4268e0f1a2c001f000001', name: 'Technology', slug: 'technology' },
                        { _id: '65f4268e0f1a2c001f000002', name: 'Science', slug: 'science' },
                        { _id: '65f4268e0f1a2c001f000003', name: 'Creativity', slug: 'creativity' }
                    ];
                    setCommunities(defaults);
                    setSelectedCommunity(defaults[0]._id);
                }
            } catch (err) {
                const defaults = [
                    { _id: '65f4268e0f1a2c001f000001', name: 'Technology', slug: 'technology' }
                ];
                setCommunities(defaults);
                setSelectedCommunity(defaults[0]._id);
            } finally {
                setLoadingCommunities(false);
            }
        };
        loadCommunities();
    }, []);

    return (
        <div style={{ maxWidth: '780px', margin: '0 auto', padding: '0 16px' }}>
            {/* Header Area */}
            <div style={{ padding: '24px 0', borderBottom: '1px solid var(--border-color)', marginBottom: '24px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'white', fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.5px' }}>
                    Create a Human Post
                </h1>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px', alignItems: 'start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Community Selector */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <select 
                            className="community-selector"
                            value={selectedCommunity}
                            onChange={(e) => setSelectedCommunity(e.target.value)}
                        >
                            <option value="" disabled>Choose a community</option>
                            {communities.map(c => (
                                <option key={c._id} value={c._id}>d/{c.slug}</option>
                            ))}
                        </select>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 700 }}>VERIFIED HUMAN ZONE</span>
                    </div>

                    {/* Tab Navigation */}
                    <div className="reddit-card" style={{ display: 'flex', background: 'var(--surface-color)', borderRadius: '12px' }}>
                        {TABS.map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                style={{
                                    flex: 1, padding: '14px',
                                    border: 'none', borderBottom: `2.5px solid ${activeTab === tab.key ? 'var(--brand-color)' : 'transparent'}`,
                                    background: 'transparent', cursor: 'pointer',
                                    color: activeTab === tab.key ? 'white' : 'var(--text-secondary)',
                                    fontWeight: 800, fontSize: '13px', fontFamily: 'Outfit, sans-serif',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                    transition: 'var(--tr-fast)',
                                    textTransform: 'uppercase', letterSpacing: '0.5px'
                                }}
                            >
                                <span style={{ fontSize: '16px' }}>{tab.icon}</span>
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Main Content Editor */}
                    <motion.div 
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="reddit-card" 
                        style={{ padding: '20px', borderRadius: '16px' }}
                    >
                        {loadingCommunities ? (
                            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                Preparing human-verified workspace...
                            </div>
                        ) : (
                            <PostEditor 
                                communityId={selectedCommunity} 
                                onSuccess={() => window.location.href = '/feed'} 
                            />
                        )}
                    </motion.div>
                </div>

                {/* Sidebar Widgets */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="reddit-card" style={{ overflow: 'hidden', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                        <div className="widget-header">
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--brand-color)' }} />
                            <span style={{ fontWeight: 800, fontSize: '12px', color: 'white', textTransform: 'uppercase' }}>Human Protocol</span>
                        </div>
                        <ul style={{ margin: 0, padding: '0 16px', listStyle: 'none' }}>
                            {[
                                'Remember the human behind the screen.',
                                'AI-generated text is strictly prohibited.',
                                'Verify facts before publishing.',
                                'Respect community boundaries.',
                                'Maintain authentic creativity.'
                            ].map((rule, idx) => (
                                <li key={idx} className="rule-item">
                                    <span style={{ color: 'var(--brand-color)', fontWeight: 800, marginRight: '8px' }}>{idx + 1}.</span>
                                    {rule}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px dashed var(--border-color)' }}>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                            All content on DHRUVIT is scanned for machine patterns. Anonymous human verification is applied to every post.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
