import { useState } from 'react';
import Button from '../ui/Button';
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
                status: 'published' // Auto-publish for now
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
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
            <textarea 
               value={body}
               onChange={e => setBody(e.target.value)}
               placeholder="Contribute your manual human thoughts..."
               className="w-full min-h-[120px] bg-reddit-dark-surface border border-white/5 rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-reddit-orange/40 font-ibm resize-y custom-scrollbar transition-all placeholder:text-zinc-600"
               required
            />
            <div className="flex justify-end gap-3 px-2">
               {onCancel && (
                   <button 
                        type="button" 
                        onClick={onCancel} 
                        disabled={loading}
                        className="text-xs font-bold text-zinc-500 hover:text-white transition-colors"
                   >
                       CANCEL
                   </button>
               )}
               <button 
                    type="submit" 
                    disabled={loading || !body.trim()}
                    className="bg-reddit-orange hover:bg-reddit-orange-hover text-white text-[11px] font-black tracking-widest px-6 py-2.5 rounded-full transition-all disabled:opacity-30 uppercase"
                >
                    {loading ? 'POSTING...' : 'PUBLISH RESPONSE'}
                </button>
            </div>
        </form>
    );
}
