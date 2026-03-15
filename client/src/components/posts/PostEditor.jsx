import { useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { createPost } from '../../services/postService';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'react-hot-toast';

export default function PostEditor({ communityId = null, onSuccess }) {
    const { isAuthenticated } = useAuthStore();
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isAuthenticated) {
        return (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
                Join the human community to share your thoughts.
            </div>
        );
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim() || body === '<p><br></p>' || !body.trim()) {
            toast.error("Authentic human expressions require both a title and context.");
            return;
        }

        if (!communityId) {
            toast.error("Choose a community to verify your post within.");
            return;
        }

        setLoading(true);
        try {
            const payload = { title, body, communityId, mediaUrls: [] };
            await createPost(payload);
            toast.success("Identity verified. Post published.");
            setTitle('');
            setBody('');
            if(onSuccess) onSuccess();
        } catch (err) {
            toast.error("Verification failed. Please check your connection.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <input 
                type="text" 
                placeholder="Title your creation..." 
                value={title}
                onChange={e => setTitle(e.target.value)}
                style={{
                    background: 'transparent',
                    border: 'none',
                    borderBottom: '1px solid var(--border-color)',
                    fontSize: '22px',
                    fontWeight: 800,
                    color: 'white',
                    padding: '8px 0',
                    outline: 'none',
                    fontFamily: 'Outfit, sans-serif'
                }}
                maxLength={300}
            />

            <div className="premium-editor">
                 <ReactQuill 
                     theme="snow" 
                     value={body} 
                     onChange={setBody} 
                     placeholder="Unleash your human creativity..."
                     style={{ height: '240px', marginBottom: '44px' }}
                 />
                 <style>{`
                    .premium-editor .ql-container {
                        border: none !important;
                        font-family: inherit;
                        font-size: 15px;
                        color: rgba(255,255,255,0.9);
                    }
                    .premium-editor .ql-toolbar {
                        background: var(--surface-elevated) !important;
                        border: 1px solid var(--border-color) !important;
                        border-radius: 8px !important;
                        margin-bottom: 12px;
                    }
                    .premium-editor .ql-editor.ql-blank::before {
                        color: var(--text-muted) !important;
                        font-family: 'Outfit';
                        font-style: normal;
                    }
                    .premium-editor .ql-stroke { stroke: var(--text-secondary) !important; }
                    .premium-editor .ql-fill { fill: var(--text-secondary) !important; }
                    .premium-editor .ql-picker { color: var(--text-secondary) !important; }
                 `}</style>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--brand-color)', animation: 'pulse 1.5s infinite' }} />
                    HUMAN-SCAN ACTIVE
                </div>
                <button 
                    type="submit" 
                    disabled={loading} 
                    className="btn-dhruvit"
                    style={{ padding: '10px 32px', fontSize: '14px', borderRadius: '30px' }}
                >
                    {loading ? 'VERIFYING...' : 'PUBLISH'}
                </button>
            </div>
        </form>
    );
}
