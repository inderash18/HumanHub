import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPost } from '../services/postService';
import PostCard from '../components/posts/PostCard';
import CommentThread from '../components/comments/CommentThread';
import CommentEditor from '../components/comments/CommentEditor';
import Spinner from '../components/ui/Spinner';
import { motion } from 'framer-motion';

export default function PostDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
         try {
             const data = await getPost(id);
             setPost(data);
         } catch(e) {
             console.error("No post map");
             navigate('/feed');
         } finally {
             setLoading(false);
         }
    };

    useEffect(() => {
        loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    if (loading) return <div className="flex justify-center p-20"><Spinner /></div>;
    if (!post) return null;

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-[800px] mx-auto py-6">
             <div className="bg-brand-surface rounded-xl border border-white/5 p-4 md:p-6 mb-6 mt-4">
                <PostCard post={post} isDetail={true} />
             </div>

             <div className="px-4">
                 <h4 className="font-playfair text-xl font-bold text-white mb-6 border-b border-white/10 pb-4 flex justify-between">
                     <span>Discussion</span>
                     <span className="text-brand-gold font-mono text-sm">(Verified Block)</span>
                 </h4>
                 
                 <div className="max-w-2xl">
                    <CommentEditor postId={post._id} onSubmitSuccess={loadData} />
                 </div>

                 <div className="mt-12 w-full">
                    {/* Simulated dummy data passing mapping array conceptually realistically if backend fetched explicitly */}
                    <CommentThread comments={[]} onReply={(parentId) => console.log('Mock reply trigger', parentId)} />
                 </div>
             </div>
        </motion.div>
    )
}
