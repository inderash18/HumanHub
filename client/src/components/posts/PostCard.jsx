import { Link } from 'react-router-dom';
import VoteButton from './VoteButton';
import VerificationBadge from './VerificationBadge';
import { formatRelativeTime } from '../../utils/formatters';
import { FaCommentAlt, FaShare } from 'react-icons/fa';

export default function PostCard({ post, isDetail = false }) {
    if (!post) return null;

    const renderBody = () => {
        if (!post.body) return null;
        
        const plainText = post.body.replace(/<[^>]*>?/gm, '');
        if (!plainText.trim() && !isDetail) return null;

        if (isDetail) {
            return (
                <div 
                    className="text-white/90 text-sm leading-relaxed ql-editor p-0"
                    dangerouslySetInnerHTML={{ __html: post.body }} 
                />
            );
        }

        const isLong = plainText.length > 300;
        return (
            <p className="text-zinc-400 text-sm leading-relaxed line-clamp-3">
                {isLong ? `${plainText.substring(0, 300)}...` : plainText}
            </p>
        );
    };

    const renderMedia = () => {
        if (!post.mediaUrls || post.mediaUrls.length === 0) return null;

        const count = post.mediaUrls.length;
        
        if (count === 1) {
            return (
                <div className="rounded-2xl overflow-hidden border border-white/5 bg-black mt-3">
                    <img 
                        src={post.mediaUrls[0]} 
                        alt="Post media" 
                        className="w-full max-h-[600px] object-contain block hover:scale-[1.01] transition-transform duration-500" 
                    />
                </div>
            );
        }

        // Reddit-style grid for multiple images
        return (
            <div className={`grid gap-1 mt-3 rounded-2xl overflow-hidden border border-white/5 ${count === 2 ? 'grid-cols-2' : 'grid-cols-2'}`}>
                {post.mediaUrls.slice(0, 4).map((url, idx) => (
                    <div key={idx} className={`relative aspect-square bg-black ${idx === 0 && count === 3 ? 'row-span-2 h-full' : ''}`}>
                        <img src={url} alt="" className="w-full h-full object-cover" />
                        {idx === 3 && count > 4 && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                <span className="text-white font-black text-xl">+{count - 4}</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className={`reddit-card ${!isDetail && 'hover:border-white/20 hover:bg-white/[0.02]'} transition-all p-4 flex flex-col gap-3 group border-white/5`}>
            {/* Header */}
            <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-zinc-500">
                {post.community && (
                    <>
                        <div className="w-5 h-5 rounded-md bg-reddit-orange flex items-center justify-center text-[10px] overflow-hidden">
                            {post.community.iconUrl ? <img src={post.community.iconUrl} className="w-full h-full object-cover" /> : '🌐'}
                        </div>
                        <Link to={`/c/${post.community.slug}`} className="text-white hover:underline">d/{post.community.slug}</Link>
                        <span>•</span>
                    </>
                )}
                <span>{formatRelativeTime(post.createdAt)}</span>
                <div className="ml-auto">
                    <VerificationBadge scores={post.detectionScores} status={post.status} />
                </div>
            </div>

            {/* Content */}
            <div className="flex flex-col gap-2">
                <Link to={`/p/${post._id}`}>
                    <h3 className={`font-outfit font-bold text-white leading-tight ${isDetail ? 'text-2xl' : 'text-lg group-hover:text-reddit-orange transition-colors'}`}>
                        {post.title}
                    </h3>
                </Link>
                {renderBody()}
                {renderMedia()}
            </div>

            {/* Action Bar */}
            <div className="flex items-center gap-2 mt-2">
                <div className="bg-white/5 rounded-full px-1 flex items-center">
                    <VoteButton
                        initialScore={post.upvotes - post.downvotes}
                        targetId={post._id}
                        targetType="post"
                        horizontal={true}
                    />
                </div>

                <Link to={`/p/${post._id}`} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all border border-white/5">
                    <FaCommentAlt className="text-xs" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{post.comments?.length || 0}</span>
                </Link>

                <button className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all border border-white/5">
                    <FaShare className="text-xs" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Share</span>
                </button>
            </div>
        </div>
    );
}
