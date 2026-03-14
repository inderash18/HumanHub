import { useState } from 'react';
import Button from '../ui/Button';

export default function CommentEditor({ postId, parentId = null, onCancel, onSubmitSuccess }) {
    const [body, setBody] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if(!body.trim()) return;

        setLoading(true);
        try {
            // Simulated call - real call passes postId, parentId implicitly
            // await api.post('/api/comments', { body, postId, parentId });
            setBody('');
            if (onSubmitSuccess) onSubmitSuccess();
        } catch (error) {
             console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-2">
            <textarea 
               value={body}
               onChange={e => setBody(e.target.value)}
               placeholder="What are your thoughts?"
               className="w-full min-h-[100px] bg-brand-surface border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-brand-gold font-jakarta resize-y custom-scrollbar transition-colors"
               required
            />
            <div className="flex justify-end gap-2">
               {onCancel && <Button variant="ghost" size="sm" onClick={onCancel} disabled={loading}>Cancel</Button>}
               <Button type="submit" size="sm" disabled={loading || !body.trim()}>{loading ? 'Posting...' : 'Post Reply'}</Button>
            </div>
        </form>
    );
}
