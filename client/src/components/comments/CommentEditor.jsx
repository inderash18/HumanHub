import { useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function CommentEditor({ postId, parentId = null, onCancel, onSubmitSuccess }) {
    const [body, setBody] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if(!body.trim()) return;

        setLoading(true);
        const toastId = toast.loading('Publishing human response...');
        try {
            await api.post('/comments', { 
                body, 
                postId, 
                parentId,
                status: 'published'
            });
            
            setBody('');
            toast.success("Response published successfully", { id: toastId });
            if (onSubmitSuccess) onSubmitSuccess();
        } catch (error) {
             console.error(error);
             toast.error("Failed to publish comment", { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <textarea 
               value={body}
               onChange={e => setBody(e.target.value)}
               placeholder="Contribute your manual human thoughts..."
               className="premium-input text-xs font-semibold min-h-[100px] resize-none leading-relaxed"
               required
            />
            <div className="flex justify-end gap-3.5 px-1">
               {onCancel && (
                    <button 
                         type="button" 
                         onClick={onCancel} 
                         disabled={loading}
                         className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                    >
                        Cancel
                    </button>
               )}
               <button 
                    type="submit" 
                    disabled={loading || !body.trim()}
                    className="btn-premium text-[10px] uppercase tracking-wider font-extrabold py-2 px-6"
                >
                    {loading ? 'Posting...' : 'Publish Response'}
                </button>
            </div>
        </form>
    );
}
