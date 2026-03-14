import { useState } from 'react';
import Avatar from '../ui/Avatar';
import VoteButton from '../posts/VoteButton';
import { formatRelativeTime } from '../../utils/formatters';
import { RiReplyLine, RiFlagLine, RiRobot2Line } from 'react-icons/ri';

export default function CommentCard({ comment, onReply }) {
    const [collapsed, setCollapsed] = useState(false);

    if (collapsed) {
        return (
            <div 
               className="text-xs text-brand-muted font-mono bg-white/5 py-1 px-3 rounded-md inline-flex items-center gap-2 cursor-pointer hover:bg-white/10"
               onClick={() => setCollapsed(false)}
            >
               <span>[+]</span> {comment.author?.username} • {formatRelativeTime(comment.createdAt)}
            </div>
        );
    }

    return (
        <div className="flex gap-3 text-sm font-jakarta group">
             {/* Left Rail */}
             <div className="flex flex-col items-center">
                 <Avatar src={comment.author?.avatar} size="sm" />
                 <div 
                     className="w-0.5 bg-white/5 group-hover:bg-white/10 flex-1 my-2 cursor-pointer transition-colors"
                     onClick={() => setCollapsed(true)}
                 ></div>
             </div>

             {/* Right content */}
             <div className="flex-1 pb-4">
                 <div className="flex items-center gap-2 mb-1">
                     <span className="font-bold text-brand-text text-[13px]">{comment.author?.username}</span>
                     
                     {/* Trust score visual dot */}
                     {comment.author?.trustScore > 0.8 && (
                         <span className="w-1.5 h-1.5 rounded-full bg-brand-gold shadow-[0_0_5px_rgba(201,168,76,0.6)]" title="High Trust Status"></span>
                     )}
                     
                     <span className="text-brand-muted text-xs mx-1">•</span>
                     <span className="text-brand-muted text-xs">{formatRelativeTime(comment.createdAt)}</span>
                 </div>

                 <div className={`text-white/90 leading-relaxed ${comment.isRemoved ? 'italic text-brand-danger/80 bg-brand-danger/5 py-1 px-2 rounded-md border border-brand-danger/20 w-max' : ''}`}>
                     {comment.body}
                 </div>

                 <div className="flex items-center gap-3 mt-2 text-brand-muted font-medium text-[11px] uppercase tracking-wider">
                      <div className="flex items-center gap-1 scale-90 origin-left">
                          <VoteButton initialScore={comment.upvotes - comment.downvotes} targetId={comment._id} targetType="comment" horizontal />
                      </div>
                      
                      <button onClick={() => onReply(comment._id)} className="flex items-center gap-1 hover:text-white transition-colors">
                          <RiReplyLine size={14} /> Reply
                      </button>

                      <button className="flex items-center gap-1 hover:text-brand-danger transition-colors opacity-0 group-hover:opacity-100 ml-2">
                          <RiFlagLine size={13} /> Report
                      </button>

                      {comment.detectionScores?.bot?.score > 0.2 && (
                          <div className="flex items-center gap-1 text-brand-danger ml-auto" title="Low bot probability warning">
                              <RiRobot2Line size={13} /> {(comment.detectionScores.bot.score * 100).toFixed(0)}% Bot Likelihood
                          </div>
                      )}
                 </div>
             </div>
        </div>
    );
}
