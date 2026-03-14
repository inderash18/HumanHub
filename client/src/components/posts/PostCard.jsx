import { Link } from 'react-router-dom';
import Card from '../ui/Card';
import Avatar from '../ui/Avatar';
import VoteButton from './VoteButton';
import VerificationBadge from './VerificationBadge';
import { formatRelativeTime } from '../../utils/formatters';
import { RiChat3Line, RiShareForwardLine, RiFlagLine } from 'react-icons/ri';

export default function PostCard({ post, isDetail = false }) {
    if (!post) return null;

    // We can conditionally track if we need to trim the body
    const isTrimmed = !isDetail && post.body.length > 250;
    const bodyContent = isTrimmed ? `${post.body.substring(0, 250)}...` : post.body;

    return (
        <Card noPadding className={`mb-4 relative group flex flex-col sm:flex-row bg-brand-bg ${isDetail ? 'border-none bg-transparent shadow-none p-0' : 'border border-white/5 hover:border-white/20'}`}>
             {/* Sidebar strictly for Vote Column on Desktop */}
             {!isDetail && (
                 <div className="hidden sm:flex flex-col items-center gap-1 w-12 shrink-0 bg-brand-surface pt-3 border-r border-white/5">
                     <VoteButton 
                         initialScore={post.upvotes - post.downvotes} 
                         targetId={post._id} 
                         targetType="post" 
                     />
                 </div>
             )}

             {/* Main Content Area */}
             <div className="flex-1 min-w-0 p-3 pt-2">
                 <div className="flex flex-wrap items-center gap-1.5 text-xs text-brand-muted mb-2 font-jakarta">
                      {post.community && (
                          <Link to={`/c/${post.community.slug}`} className="font-bold text-brand-text hover:underline flex items-center gap-1">
                              {post.community.iconUrl && <img src={post.community.iconUrl} className="w-5 h-5 rounded-full object-cover" />}
                              h/{post.community.slug}
                          </Link>
                      )}
                      <span className="opacity-50 mx-0.5">•</span>
                      <span className="flex items-center gap-1 text-[13px]">
                          Posted by <Link to={`/u/${post.author?.username}`} className="hover:text-brand-text/80">{post.author?.username}</Link>
                      </span>
                      <span className="opacity-50 mx-0.5">•</span>
                      <span className="text-[13px]">{formatRelativeTime(post.createdAt)}</span>
                      
                      <div className="ml-auto">
                          <VerificationBadge scores={post.detectionScores} status={post.status} />
                      </div>
                 </div>

                 <Link to={`/p/${post._id}`}>
                     <h2 className={`font-jakarta font-semibold text-white mb-2 leading-snug ${isDetail ? 'text-2xl mt-4' : 'text-lg'}`}>{post.title}</h2>
                 </Link>

                 <div className={`text-brand-text/90 font-jakarta whitespace-pre-wrap leading-relaxed ${isDetail ? 'text-base' : 'text-[14px]'}`}>
                     {bodyContent}
                     {isTrimmed && <Link to={`/p/${post._id}`} className="text-brand-gold hover:underline text-[14px] ml-1">Read more</Link>}
                 </div>

                 {/* Media Block rendering conditionally */}
                 {post.mediaUrls?.length > 0 && (
                     <div className="mt-4 rounded-lg overflow-hidden border border-white/5 bg-black/30">
                         {/* Simplistic singular image render mapping for brevity */}
                         <img src={post.mediaUrls[0]} alt="Post Media" className="w-full h-auto max-h-[500px] object-contain" />
                     </div>
                 )}

                 {/* Action Strip */}
                 <div className={`flex items-center gap-3 mt-3 text-brand-muted font-jakarta font-bold text-[13px] ${isDetail ? 'pt-4 border-t border-white/5' : ''}`}>
                     <div className="sm:hidden flex items-center mr-2">
                         <VoteButton initialScore={post.upvotes - post.downvotes} targetId={post._id} targetType="post" horizontal />
                     </div>

                     <Link to={`/p/${post._id}`} className="flex items-center gap-1.5 hover:bg-white/10 px-2 py-1.5 rounded-md transition-colors">
                         <RiChat3Line size={18} />
                         <span>{Math.floor(Math.random() * 20)} Comments</span> {/* Placeholder count map */}
                     </Link>
                     <button className="flex items-center gap-1.5 hover:bg-white/10 px-2 py-1.5 rounded-md transition-colors">
                         <RiShareForwardLine size={18} />
                         <span>Share</span>
                     </button>
                     <button className="flex items-center gap-1.5 hover:bg-white/10 px-2 py-1.5 rounded-md transition-colors">
                         <RiFlagLine size={18} />
                         <span className="hidden sm:inline">Report</span>
                     </button>
                 </div>
             </div>
        </Card>
    );
}
