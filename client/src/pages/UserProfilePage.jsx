import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import PostCard from '../components/posts/PostCard';
import Spinner from '../components/ui/Spinner';
import { scoreToPercentage } from '../utils/formatters';

export default function UserProfilePage() {
   const { username } = useParams();
   const [user, setUser] = useState(null);
   const [posts, setPosts] = useState([]);
   const [loading, setLoading] = useState(true);

   useEffect(() => {
        const load = async () => {
             try {
                const res = await api.get(`/api/users/${username}`);
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

   if (loading) return <div className="flex justify-center p-20"><Spinner /></div>;
   if (!user) return <div className="text-center p-20 text-brand-muted">User not found or banned.</div>;

   return (
        <div className="max-w-4xl mx-auto">
             <div className="flex items-start gap-6 border-b border-white/5 pb-8 mb-8">
                  <Avatar src={user.avatar} size="xl" className="border-2 border-brand-gold/50" />
                  
                  <div className="flex-1">
                      <h1 className="text-3xl font-playfair font-bold text-white mb-1">{user.username}</h1>
                      <div className="text-brand-muted font-mono text-sm mb-4">
                          Member since {new Date(user.createdAt).getFullYear()}
                      </div>
                      
                      <p className="text-white/80 font-jakarta max-w-xl line-clamp-2">
                          {user.bio || "This human hasn't written a bio yet."}
                      </p>

                      <div className="flex gap-4 mt-6 text-sm">
                           <div className="glass px-4 py-2 rounded-lg border border-white/5 flex flex-col items-center">
                               <div className="text-brand-muted font-mono uppercase tracking-widest text-[10px] mb-1">Trust Score</div>
                               <div className="font-playfair text-xl text-brand-success font-bold">{scoreToPercentage(user.trustScore)}</div>
                           </div>
                           <div className="glass px-4 py-2 rounded-lg border border-white/5 flex flex-col items-center">
                               <div className="text-brand-muted font-mono uppercase tracking-widest text-[10px] mb-1">Human Posts</div>
                               <div className="font-playfair text-xl text-white font-bold">{posts.length}</div>
                           </div>
                      </div>
                  </div>
             </div>

             <h2 className="text-lg font-playfair font-bold text-white mb-6 pl-2 border-l-2 border-brand-gold/50">Verified Submissions</h2>
             
             {posts.length === 0 ? (
                 <div className="text-brand-muted border border-white/5 rounded-xl border-dashed p-12 text-center">
                     No verified posts yet.
                 </div>
             ) : (
                 <div className="flex flex-col gap-4">
                     {posts.map(post => <PostCard key={post._id} post={post} />)}
                 </div>
             )}
        </div>
   )
}
