import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getCommunity } from '../services/communityService';
import CommunityHeader from '../components/community/CommunityHeader';
import PostFeed from '../components/posts/PostFeed';
import PostEditor from '../components/posts/PostEditor';
import Spinner from '../components/ui/Spinner';
import { motion } from 'framer-motion';

export default function CommunityPage() {
    const { slug } = useParams();
    const [community, setCommunity] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadPage = async () => {
            setLoading(true);
            try {
                // Fetch mapping
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

    if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
    if (!community) return <div className="text-center py-20 text-brand-muted text-xl">Community not found.</div>;

    return (
        <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="w-full max-w-5xl mx-auto"
        >
            <CommunityHeader community={community} />
            
            <div className="grid md:grid-cols-4 gap-8 mt-8">
                <div className="md:col-span-3 space-y-6">
                    <PostEditor communityId={community._id} />
                    <PostFeed communityId={community._id} />
                </div>
                
                <div className="hidden md:block">
                     {/* Dynamic Rules sidebar block essentially scaling cleanly visually structurally representing platform guidelines dynamically inherently natively smoothly */}
                     <div className="sticky top-24 glass rounded-xl border border-white/5 p-5">
                          <h4 className="font-playfair font-bold text-white text-lg border-b border-white/10 pb-3 mb-4">Community Rules</h4>
                          <ol className="text-brand-muted text-sm space-y-3 font-jakarta pl-4 list-decimal marker:text-brand-gold">
                               {community.rules?.length > 0 ? community.rules.map((r, i) => <li key={i}>{r}</li>) : (
                                  <>
                                     <li>Be human.</li>
                                     <li>No AI generated content.</li>
                                     <li>Discuss respectfully.</li>
                                  </>
                               )}
                          </ol>
                     </div>
                </div>
            </div>
        </motion.div>
    );
}
