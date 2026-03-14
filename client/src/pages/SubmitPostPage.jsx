import { useState } from 'react';
import PostEditor from '../components/posts/PostEditor';

const TABS = [
    { key: 'text', icon: '📝', label: 'Post' },
    { key: 'image', icon: '🖼️', label: 'Image & Video' },
    { key: 'link', icon: '🔗', label: 'Link' },
    { key: 'poll', icon: '📊', label: 'Poll' },
];

export default function SubmitPostPage() {
    const [activeTab, setActiveTab] = useState('text');

    return (
        <div style={{ maxWidth: '740px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid #edeff1', paddingBottom: '12px' }}>
                <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1c1c1c', fontFamily: 'IBM Plex Sans, sans-serif' }}>
                    Create a Post
                </h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#0079d3', fontWeight: 700, cursor: 'pointer' }}>
                    📋 Drafts
                </div>
            </div>

            {/* Type tabs */}
            <div className="reddit-card" style={{ display: 'flex', marginBottom: '16px', overflow: 'hidden' }}>
                {TABS.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        style={{
                            flex: 1, padding: '12px 8px',
                            border: 'none', borderBottom: `2px solid ${activeTab === tab.key ? '#0079d3' : 'transparent'}`,
                            background: 'transparent', cursor: 'pointer',
                            color: activeTab === tab.key ? '#0079d3' : '#878a8c',
                            fontWeight: 700, fontSize: '13px', fontFamily: 'inherit',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                            transition: 'border-color .1s, color .1s',
                        }}
                        onMouseEnter={e => activeTab !== tab.key && (e.currentTarget.style.background = '#f6f7f8')}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                        <span>{tab.icon}</span>
                        <span style={{ display: 'none' }} className="tab-label">{tab.label}</span>
                        <style>{`@media(min-width:600px){.tab-label{display:inline!important}}`}</style>
                        <span className="tab-label">{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Editor */}
            <div className="reddit-card" style={{ padding: '16px', marginBottom: '16px' }}>
                <PostEditor onSuccess={() => window.history.back()} />
            </div>

            {/* Rules */}
            <div className="reddit-widget">
                <div style={{ padding: '10px 12px', background: 'linear-gradient(135deg, #ff4500, #ff6534)', color: 'white', fontWeight: 700, fontSize: '14px' }}>
                    🛡️ Posting Rules
                </div>
                <ol style={{ margin: 0, padding: '12px 24px 12px 36px', listStyle: 'decimal', fontSize: '13px', color: '#1c1c1c', lineHeight: 1.6 }}>
                    {[
                        'Remember the human — be respectful.',
                        'AI-generated text (ChatGPT, Claude, Gemini, etc.) is detected and rejected automatically.',
                        'No spam or repetitive posts.',
                        'Repeat violations lower your Trust Score and may result in a ban.',
                        'Post relevant content to the correct community.',
                    ].map((r, i) => (
                        <li key={i} style={{ paddingBottom: '6px', borderBottom: i < 4 ? '1px solid #edeff1' : 'none', paddingTop: '6px' }}>{r}</li>
                    ))}
                </ol>
                <div style={{ padding: '10px 12px', background: '#f6f7f8', fontSize: '12px', color: '#878a8c' }}>
                    ✅ All posts are scanned by our AI Detection Pipeline before publishing.
                </div>
            </div>
        </div>
    );
}
