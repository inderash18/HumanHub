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
        <Card className={`mb-4 relative group ${isDetail ? 'border-none bg-transparent shadow-none p-0' : 'hover:border-white/20'}`}>
            <div className={`flex flex-col sm:flex-row gap-4 ${isDetail ? '' : ''}`}>
                 {/* Sidebar strictly for Vote Column on Desktop */}
                 <div className="hidden sm:flex flex-col items-center gap-1 w-10 shrink-0">
                     <VoteButton 
                         initialScore={post.upvotes - post.downvotes} 
                         targetId={post._id} 
                         targetType="post" 
                     />
                 </div>

                 {/* Main Content Area */}
                 <div className="flex-1 min-w-0">
                     <div className="flex flex-wrap items-center gap-2 text-xs text-brand-muted mb-2">
                          {post.community && (
                              <Link to={`/c/${post.community.slug}`} className="font-bold text-brand-text hover:underline flex items-center gap-1">
                                  {post.community.iconUrl && <img src={post.community.iconUrl} className="w-4 h-4 rounded-sm" />}
                                  h/{post.community.slug}
                              </Link>
                          )}
                          <span className="opacity-50">•</span>
                          <span className="flex items-center gap-1">
                              Posted by <Link to={`/u/${post.author?.username}`} className="hover:text-brand-text">{post.author?.username}</Link>
                          </span>
                          <span className="opacity-50">•</span>
                          <span>{formatRelativeTime(post.createdAt)}</span>
                          
                          <div className="ml-auto">
                              <VerificationBadge scores={post.detectionScores} status={post.status} />
                          </div>
                     </div>

                     <Link to={`/p/${post._id}`}>
                         <h2 className={`font-playfair font-bold text-white mb-2 ${isDetail ? 'text-3xl' : 'text-xl'}`}>{post.title}</h2>
                     </Link>

                     <div className={`text-brand-text/90 font-jakarta whitespace-pre-wrap leading-relaxed ${isDetail ? 'text-base' : 'text-sm'}`}>
                         {bodyContent}
                         {isTrimmed && <Link to={`/p/${post._id}`} className="text-brand-gold hover:underline text-sm ml-1">Read more</Link>}
                     </div>

                     {/* Media Block rendering conditionally */}
                     {post.mediaUrls?.length > 0 && (
                         <div className="mt-4 rounded-xl overflow-hidden border border-white/5 bg-black/50">
                             {/* Simplistic singular image render mapping for brevity */}
                             <img src={post.mediaUrls[0]} alt="Post Media" className="w-full h-auto max-h-[500px] object-contain" />
                         </div>
                     )}

                     {/* Action Strip */}
                     <div className="flex items-center gap-6 mt-4 pt-4 border-t border-white/5 text-brand-muted text-sm font-jakarta font-medium">
                         <div className="sm:hidden flex items-center gap-1 mr-4">
                             <VoteButton initialScore={post.upvotes - post.downvotes} targetId={post._id} targetType="post" horizontal />
                         </div>

                         <Link to={`/p/${post._id}`} className="flex items-center gap-2 hover:bg-white/5 px-2 py-1 rounded-md transition-colors">
                             <RiChat3Line size={18} />
                             <span>{Math.floor(Math.random() * 20)} Comments</span> {/* Placeholder count map */}
                         </Link>
                         <button className="flex items-center gap-2 hover:bg-white/5 px-2 py-1 rounded-md transition-colors">
                             <RiShareForwardLine size={18} />
                             <span>Share</span>
                         </button>
                         <button className="hidden sm:flex items-center gap-2 hover:bg-white/5 px-2 py-1 rounded-md transition-colors group-hover:opacity-100 opacity-0 ml-auto text-brand-danger/70 hover:text-brand-danger">
                             <RiFlagLine size={18} />
                             <span>Report</span>
                         </button>
                     </div>
                 </div>
            </div>
        </Card>
    );
}
