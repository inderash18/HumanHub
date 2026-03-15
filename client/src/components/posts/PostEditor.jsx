import { useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css'; // Relies on external styles to be overridden in main css
import { createPost } from '../../services/postService';
import { useAuthStore } from '../../store/authStore';
import Button from '../ui/Button';
import { toast } from 'react-hot-toast';

export default function PostEditor({ communityId = null, onSuccess }) {
    const { isAuthenticated } = useAuthStore();
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [media, setMedia] = useState(null);
    const [loading, setLoading] = useState(false);

    if (!isAuthenticated) {
        return <div className="p-4 bg-white/5 border border-white/10 rounded-xl text-center text-brand-muted text-sm">Sign in to publish human-verified ideas.</div>
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim() || !body.trim()) {
            toast.error("A genuine human post requires both a title and some context.");
            return;
        }

        if (!communityId) {
            toast.error("Please select a valid sub-hub to push this into.");
            return;
        }

        setLoading(true);
        try {
            // Simulated form data builder internally through postService wrapper realistically if media mapped
            const payload = {
                 title,
                 body,
                 communityId,
                 mediaUrls: [] // Mocked without AWS S3 / Cloudinary strict multipart binds for initial run limits
            };

            await createPost(payload);
            toast.success("Post submitted to verification pipeline.");
            setTitle('');
            setBody('');
            if(onSuccess) onSuccess();
        } catch (err) {
            toast.error("Submission failed. Network limits reached potentially.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="glass rounded-xl p-4 border border-white/10 flex flex-col gap-4">
            <input 
                type="text" 
                placeholder="Title" 
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="bg-transparent border-none text-xl font-playfair font-bold text-white focus:outline-none placeholder:opacity-40 px-2"
                maxLength={300}
            />
            {/* The React Quill editor */}
            <div className="text-white/80 font-jakarta border border-white/5 rounded-lg overflow-hidden bg-brand-surface">
                 <ReactQuill 
                     theme="snow" 
                     value={body} 
                     onChange={setBody} 
                     placeholder="Share your thoughts. Bots will be blocked instantly..."
                     className="min-h-[120px]"
                 />
            </div>

            <div className="flex justify-between items-center px-2 pt-2 border-t border-white/5">
                <div className="text-xs text-brand-muted font-mono flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-gold animate-pulse"></span>
                    Protected by Detection API
                </div>
                <Button type="submit" size="sm" disabled={loading}>
                    {loading ? 'Verifying...' : 'Post'}
                </Button>
            </div>
        </form>
    );
}
