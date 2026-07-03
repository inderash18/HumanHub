import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import PostCard from '../components/posts/PostCard';
import Spinner from '../components/ui/Spinner';
import { scoreToPercentage } from '../utils/formatters';
import { useAuthStore } from '../store/authStore';
import { motion } from 'framer-motion';
import { FiGrid, FiBookmark, FiAward, FiMapPin, FiLink, FiShield, FiHeart, FiMessageCircle, FiSliders } from 'react-icons/fi';
import toast from 'react-hot-toast';

const mockHighlights = [
    { id: 1, title: '🌿 Yosemite', cover: 'https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=100' },
    { id: 2, title: '🎨 Canvas', cover: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=100' },
    { id: 3, title: '⚡ Moments', cover: 'https://images.unsplash.com/photo-1504051771394-dd2e66b2e08f?w=100' }
];

export default function UserProfilePage() {
   const { username } = useParams();
   const { user: currentUser } = useAuthStore();
   const [user, setUser] = useState(null);
   const [posts, setPosts] = useState([]);
   const [loading, setLoading] = useState(true);
   const [activeTab, setActiveTab] = useState('posts');

   const loadProfile = async () => {
        try {
           const res = await api.get(`/users/${username}`);
           setUser(res.data.profile);
           setPosts(res.data.posts);
        } catch (err) {
           console.error(err);
        } finally {
           setLoading(false);
        }
   };

   useEffect(() => {
        loadProfile();
   }, [username]);

   if (loading) return (
       <div className="flex flex-col items-center justify-center p-40 gap-4">
           <Spinner size="lg" />
           <p className="text-[var(--text-secondary)] text-xs font-bold uppercase tracking-[0.2em] animate-pulse">Retrieving Human Identity...</p>
       </div>
   );

   if (!user) return (
       <div className="text-center p-20">
           <div className="text-[var(--rejected-color)] text-4xl mb-4">⚠️</div>
           <h2 className="text-[var(--text-primary)] text-xl font-bold mb-2">Subject Not Found</h2>
           <p className="text-[var(--text-secondary)] text-sm">This identity has not been registered or is currently under quarantine.</p>
       </div>
   );

   const mediaPosts = posts.filter(p => p.mediaUrls && p.mediaUrls.length > 0);

   const handleHighlightClick = (title) => {
       toast.success(`Opening archived highlight: ${title}`);
   };

   const isFollowing = user.followers?.includes(currentUser?._id);

   const handleFollowToggle = async () => {
       try {
           const res = await api.post(`/users/${user._id}/follow`);
           setUser(prev => ({
               ...prev,
               followers: res.data.isFollowing 
                   ? [...(prev.followers || []), currentUser._id] 
                   : (prev.followers || []).filter(id => id !== currentUser._id)
           }));
           toast.success(res.data.isFollowing ? `Following @${user.username}` : `Unfollowed @${user.username}`);
       } catch (err) {
           console.error(err);
           toast.error("Failed to sync follow state.");
       }
   };

   return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="max-w-3xl mx-auto px-4 py-2 flex flex-col gap-6"
        >
             {/* Dynamic Ambient Cover Banner */}
             <div className="h-44 sm:h-52 w-full rounded-[24px] relative overflow-hidden bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 border border-[var(--border-color)] shadow-sm">
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-purple-500/10 rounded-full blur-[70px] pointer-events-none" />
                 
                 {/* Floating verified shield cover overlay */}
                 <div 
                     className="absolute bottom-4 right-4 px-3 py-1.5 rounded-full text-[10px] font-bold text-white flex items-center gap-1.5 shadow-md"
                     style={{
                         background: 'rgba(255, 255, 255, 0.1)',
                         backdropFilter: 'blur(10px)',
                         border: '1px solid rgba(255, 255, 255, 0.15)',
                     }}
                 >
                     <FiShield className="text-[var(--verified-color)]" />
                     <span>Identity Shield Active</span>
                 </div>
             </div>

             {/* Profile Header Details block */}
             <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-10 border-b border-[var(--border-color)] pb-6 mt-[-60px] px-6 relative z-10">
                 {/* Avatar Area */}
                 <div className="relative flex-shrink-0">
                     <div className="w-[110px] h-[110px] sm:w-[130px] sm:h-[130px] rounded-full p-[2.5px] bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] shadow-lg">
                         <div className="w-full h-full rounded-full bg-[var(--bg-color)] p-[2.5px] flex items-center justify-center overflow-hidden">
                             {user.avatar ? (
                                 <img src={user.avatar} className="w-full h-full object-cover rounded-full" alt="" />
                             ) : (
                                 <span className="text-[var(--text-primary)] font-bold text-3xl uppercase select-none">{user.username?.[0]}</span>
                             )}
                         </div>
                     </div>
                     <div className="absolute bottom-0 right-1 bg-[var(--verified-color)] text-[8px] font-extrabold tracking-widest text-white px-2 py-0.5 rounded-full border border-[var(--bg-color)] shadow-md">
                         VERIFIED
                     </div>
                 </div>

                 {/* Identity Metadata & Stats */}
                 <div className="flex-1 flex flex-col gap-3.5 text-center sm:text-left pt-[60px] sm:pt-[50px]">
                     {/* Username and Badges row */}
                     <div className="flex flex-col sm:flex-row items-center gap-4">
                         <h1 className="font-brand text-2xl font-black text-[var(--text-primary)] leading-tight">{user.username}</h1>
                         <div className="flex gap-2">
                             <Link to="/verification-dashboard" className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-[var(--border-color)] bg-[var(--surface-color)] text-[10px] font-extrabold uppercase tracking-wider text-[var(--verified-color)] hover:scale-105 transition-transform">
                                 <FiShield />
                                 <span>{scoreToPercentage(user.trustScore)} Trust</span>
                             </Link>
                             {currentUser?._id === user._id ? (
                                 <Link to="/settings" className="flex items-center gap-1 px-3 py-1 rounded-full border border-[var(--border-color)] bg-[var(--surface-color)] text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-secondary)] hover:scale-105 transition-transform">
                                     <FiSliders />
                                     <span>Edit Profile</span>
                                 </Link>
                             ) : (
                                 <button 
                                     onClick={handleFollowToggle}
                                     className={`flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider transition-transform hover:scale-105 border ${
                                         isFollowing 
                                             ? 'bg-transparent border-[var(--border-color)] text-[var(--text-secondary)]' 
                                             : 'bg-[var(--brand-color)] border-transparent text-white shadow-sm'
                                     }`}
                                 >
                                     {isFollowing ? 'Following' : 'Follow'}
                                 </button>
                             )}
                         </div>
                     </div>

                     {/* Stats Counter columns */}
                     <div className="flex items-center justify-center sm:justify-start gap-8 text-xs text-[var(--text-primary)] font-semibold">
                         <div className="flex gap-1.5">
                             <span className="font-bold font-mono">{posts.length}</span>
                             <span className="text-[var(--text-secondary)]">posts</span>
                         </div>
                         <div className="flex gap-1.5">
                             <span className="font-bold font-mono">{user.followers?.length || 0}</span>
                             <span className="text-[var(--text-secondary)]">followers</span>
                         </div>
                         <div className="flex gap-1.5">
                             <span className="font-bold font-mono">{user.following?.length || 0}</span>
                             <span className="text-[var(--text-secondary)]">following</span>
                         </div>
                     </div>

                     {/* Bio, location, website links */}
                     <div className="flex flex-col gap-2 text-xs text-[var(--text-secondary)] max-w-md">
                         <p className="font-medium leading-relaxed text-[var(--text-primary)]">
                             {user.bio || "No biographical parameters initialized."}
                         </p>
                         <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-[var(--text-secondary)]">
                             <div className="flex items-center gap-1.5">
                                 <FiMapPin />
                                 <span>Earth</span>
                             </div>
                             <div className="flex items-center gap-1.5 hover:text-[var(--brand-color)] cursor-pointer">
                                 <FiLink />
                                 <span>humanhub.net/{user.username}</span>
                             </div>
                         </div>
                     </div>
                 </div>
             </div>

             {/* Highlights */}
             <div className="flex items-center gap-5 overflow-x-auto pb-2 select-none no-scrollbar px-2 border-b border-[var(--border-color)] pb-5">
                 {mockHighlights.map(h => (
                     <div 
                         key={h.id} 
                         onClick={() => handleHighlightClick(h.title)}
                         className="flex flex-col items-center gap-1.5 cursor-pointer flex-shrink-0 group/highlight"
                     >
                         <div className="w-[58px] h-[58px] rounded-full p-[2px] border border-[var(--border-color)] hover:border-[var(--brand-color)] bg-[var(--surface-color)]/20 transition-all flex items-center justify-center overflow-hidden">
                             <img src={h.cover} alt="" className="w-full h-full object-cover rounded-full transition-transform duration-300 group-hover/highlight:scale-105" />
                         </div>
                         <span className="text-[10px] text-[var(--text-secondary)] group-hover/highlight:text-[var(--text-primary)] font-bold transition-colors">{h.title}</span>
                     </div>
                 ))}
             </div>

             {/* Tab Switcher links */}
             <div className="flex justify-center border-b border-[var(--border-color)] mb-4">
                 {[
                     { id: 'posts', label: 'Posts', icon: <FiGrid className="text-sm" /> },
                     { id: 'saved', label: 'Saved', icon: <FiBookmark className="text-sm" /> },
                     { id: 'badges', label: 'Badges', icon: <FiAward className="text-sm" /> }
                 ].map(tab => (
                     <button 
                         key={tab.id}
                         onClick={() => setActiveTab(tab.id)}
                         className={`pb-3.5 px-6 text-[10px] font-extrabold uppercase tracking-widest flex items-center gap-2 border-b-2 transition-all ${
                             activeTab === tab.id 
                             ? 'text-[var(--text-primary)] border-[var(--text-primary)]' 
                             : 'text-[var(--text-secondary)] border-transparent hover:text-[var(--text-primary)]'
                         }`}
                     >
                         {tab.icon}
                         <span>{tab.label}</span>
                     </button>
                 ))}
             </div>

             {/* Content panels widgets */}
             {activeTab === 'posts' && (
                 posts.length === 0 ? (
                     <div className="p-16 text-center border border-[var(--border-color)] rounded-[24px] bg-[var(--surface-color)]">
                         <span className="text-3xl opacity-35">📭</span>
                         <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mt-3">No verified publications.</p>
                     </div>
                 ) : mediaPosts.length > 0 ? (
                     <div className="grid grid-cols-3 gap-3">
                         {mediaPosts.map(post => (
                             <Link 
                                 key={post._id} 
                                 to={`/p/${post._id}`}
                                 className="relative aspect-square rounded-[20px] overflow-hidden border border-[var(--border-color)] group bg-zinc-950 shadow-sm"
                             >
                                 <img 
                                     src={post.mediaUrls[0]} 
                                     alt="" 
                                     className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                 />
                                 <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                     <div className="flex gap-4 text-white text-xs font-bold">
                                         <span className="flex items-center gap-1.5"><FiHeart className="fill-current text-red-500" /> {post.upvotes}</span>
                                         <span className="flex items-center gap-1.5"><FiMessageCircle className="fill-current" /> {post.comments?.length || 0}</span>
                                     </div>
                                 </div>
                             </Link>
                         ))}
                     </div>
                 ) : (
                     <div className="flex flex-col gap-5">
                         {posts.map(post => <PostCard key={post._id} post={post} />)}
                     </div>
                 )
             )}

             {activeTab === 'saved' && (
                 <div className="p-16 text-center border border-[var(--border-color)] rounded-[24px] bg-[var(--surface-color)]">
                     <span className="text-3xl opacity-35">🔖</span>
                     <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mt-3">Your saved collection is empty.</p>
                 </div>
             )}

             {activeTab === 'badges' && (
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div className="premium-card p-5 flex items-center gap-4 bg-[var(--surface-color)] border border-[var(--border-color)]">
                         <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-[var(--verified-color)] flex items-center justify-center text-lg font-bold">✓</div>
                         <div className="flex flex-col">
                             <span className="text-xs font-bold text-[var(--text-primary)]">Founding Human</span>
                             <span className="text-[10px] text-[var(--text-secondary)]">Registered in verification block #01</span>
                         </div>
                     </div>
                     <div className="premium-card p-5 flex items-center gap-4 bg-[var(--surface-color)] border border-[var(--border-color)]">
                         <div className="w-10 h-10 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center text-lg font-bold">🛡️</div>
                         <div className="flex flex-col">
                             <span className="text-xs font-bold text-[var(--text-primary)]">Clean Footprint</span>
                             <span className="text-[10px] text-[var(--text-secondary)]">Zero flagged synthetic signals detected</span>
                         </div>
                     </div>
                 </div>
             )}
        </motion.div>
   )
}
