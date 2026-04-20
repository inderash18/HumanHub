import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import Avatar from '../components/ui/Avatar';
import PostCard from '../components/posts/PostCard';
import Spinner from '../components/ui/Spinner';
import { scoreToPercentage } from '../utils/formatters';
import { motion } from 'framer-motion';

export default function UserProfilePage() {
   const { username } = useParams();
   const [user, setUser] = useState(null);
   const [posts, setPosts] = useState([]);
   const [loading, setLoading] = useState(true);

   useEffect(() => {
        const load = async () => {
             try {
                // Using the unified /users/:id endpoint which handles username or ID
                const res = await api.get(`/users/${username}`);
                setUser(res.data.profile);
                setPosts(res.data.posts);
             } catch (err) {
                console.error(err);
             } finally {
                setLoading(false);
             }
        }
        load();
   }, [username]);

   if (loading) return (
       <div className="flex flex-col items-center justify-center p-40 gap-4">
           <Spinner size="lg" />
           <p className="text-brand-muted text-xs font-bold uppercase tracking-[0.2em]">Retrieving Human Identity...</p>
       </div>
   );

   if (!user) return (
       <div className="text-center p-20">
           <div className="text-brand-danger text-4xl mb-4">⚠️</div>
           <h2 className="text-white text-xl font-bold mb-2">Subject Not Found</h2>
           <p className="text-brand-muted text-sm">This identity has not been registered or is currently under quarantine.</p>
       </div>
   );

   return (
        <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            className="max-w-4xl mx-auto px-4"
        >
             {/* Profile Header Card */}
             <div className="reddit-card p-8 mb-8 border-none bg-gradient-to-br from-reddit-dark-surface to-transparent shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-brand-gold/5 blur-[100px] pointer-events-none" />
                  
                  <div className="flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10">
                      <div className="relative group">
                          <Avatar src={user.avatar} className="w-32 h-32 md:w-40 md:h-40 border-4 border-brand-gold/20 group-hover:border-brand-gold/40 transition-all duration-300 shadow-xl" />
                          <div className="absolute -bottom-2 -right-2 bg-brand-success text-[10px] font-black px-2 py-1 rounded text-black rotate-3 shadow-lg">VERIFIED</div>
                      </div>
                      
                      <div className="flex-1 text-center md:text-left">
                          <h1 className="text-4xl font-bold text-white mb-2 tracking-tight uppercase font-outfit">{user.username}</h1>
                          
                          <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
                              <span className="text-brand-muted font-mono text-xs uppercase tracking-widest">
                                  Registry Date: {new Date(user.createdAt).toLocaleDateString()}
                              </span>
                          </div>
                          
                          <p className="text-white/70 text-base leading-relaxed max-w-2xl mb-6 font-medium">
                              {user.bio || "This human has not yet initialized their biographical protocol."}
                          </p>

                          <div className="flex flex-wrap justify-center md:justify-start gap-6">
                               <div className="flex flex-col">
                                   <span className="text-brand-muted uppercase text-[10px] font-black tracking-widest mb-1">Humanity Score</span>
                                   <span className="text-2xl font-bold text-brand-gold">{scoreToPercentage(user.trustScore)}</span>
                               </div>
                               <div className="w-[1px] h-10 bg-white/10 hidden md:block" />
                               <div className="flex flex-col">
                                   <span className="text-brand-muted uppercase text-[10px] font-black tracking-widest mb-1">Contributions</span>
                                   <span className="text-2xl font-bold text-white">{posts.length}</span>
                               </div>
                               <div className="w-[1px] h-10 bg-white/10 hidden md:block" />
                               <div className="flex flex-col">
                                   <span className="text-brand-muted uppercase text-[10px] font-black tracking-widest mb-1">Status</span>
                                   <span className="text-2xl font-bold text-brand-success uppercase">Active</span>
                               </div>
                          </div>
                      </div>
                  </div>
             </div>

             <div className="flex items-center gap-4 mb-8">
                <h2 className="text-xs font-black text-brand-muted uppercase tracking-[0.3em] whitespace-nowrap">Verified Publication Feed</h2>
                <div className="h-[1px] w-full bg-white/5" />
             </div>
             
             {posts.length === 0 ? (
                 <div className="reddit-card border-dashed border-2 p-20 text-center flex flex-col items-center gap-4">
                     <span className="text-4xl opacity-20 outline-none">📭</span>
                     <p className="text-brand-muted font-bold text-sm uppercase tracking-widest">No verified transmissions available.</p>
                 </div>
             ) : (
                 <div className="grid grid-cols-1 gap-6 mb-20">
                     {posts.map((post, idx) => (
                         <motion.div 
                            key={post._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                         >
                            <PostCard post={post} />
                         </motion.div>
                     ))}
                 </div>
             )}
        </motion.div>
   )
}
