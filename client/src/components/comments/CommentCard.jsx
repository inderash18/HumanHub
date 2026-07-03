import { useState } from 'react';
import { formatRelativeTime } from '../../utils/formatters';
import { FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';
import { FaHeart, FaSmile } from 'react-icons/fa';
import CommentEditor from './CommentEditor';

const ReplyIcon = () => (
  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
  </svg>
);

const translations = {
    "This is a comment.": "This is a comment.",
    "No AI noise.": "No AI noise."
};

export default function CommentCard({ comment, postId, onReply, onSubmitSuccess }) {
    const [collapsed, setCollapsed] = useState(false);
    const [translated, setTranslated] = useState(false);
    const [showReplyForm, setShowReplyForm] = useState(false);
    const [reactions, setReactions] = useState([]); // Array of emojis

    if (collapsed) {
        return (
            <div 
               className="text-[10px] font-extrabold uppercase tracking-wider bg-[var(--surface-hover)]/30 py-1.5 px-4 rounded-[12px] inline-flex items-center gap-2 cursor-pointer hover:bg-[var(--surface-hover)] transition-all border border-[var(--border-color)]"
               onClick={() => setCollapsed(false)}
            >
               <span>[+]</span> {comment.author?.username} • {formatRelativeTime(comment.createdAt)}
            </div>
        );
    }

    const handleTranslate = () => {
        setTranslated(!translated);
    };

    const handleReaction = (emoji) => {
        setReactions(prev => 
            prev.includes(emoji) ? prev.filter(e => e !== emoji) : [...prev, emoji]
        );
    };

    // Simulated premium English translation text
    const getTranslatedText = () => {
        if (translations[comment.body]) return translations[comment.body];
        return `[Translated from Latin]: This is a verified human response. Splendid insight! 🌿`;
    };

    return (
        <div className="flex gap-4 text-xs group/card relative py-2">
             {/* Left Rail Avatar */}
             <div className="flex flex-col items-center flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-[var(--surface-hover)] border border-[var(--border-color)] flex items-center justify-center overflow-hidden">
                      {comment.author?.avatar ? (
                          <img src={comment.author.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                          <span className="text-[var(--text-primary)] font-bold text-xs uppercase">{comment.author?.username?.[0]}</span>
                      )}
                  </div>
                  <div 
                      className="w-[1.5px] bg-[var(--border-color)] hover:bg-[var(--text-muted)] flex-1 my-2.5 cursor-pointer transition-colors"
                      onClick={() => setCollapsed(true)}
                      title="Collapse Thread"
                  />
             </div>

             {/* Right content */}
             <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                      <span className="font-extrabold text-[var(--text-primary)]">{comment.author?.username}</span>
                      
                      {/* Green Shield trust indicator */}
                      {comment.author?.trustScore > 0.7 && (
                          <FiCheckCircle className="text-[var(--verified-color)] text-[10px] fill-current" title="High Trust Status" />
                      )}
                      
                      <span className="text-[var(--text-muted)] font-mono text-[9px]">{formatRelativeTime(comment.createdAt)}</span>
                  </div>

                  <div className="text-[12.5px] text-[var(--text-primary)] leading-relaxed font-medium">
                      {translated ? getTranslatedText() : comment.body}
                  </div>

                  {/* Actions Floor */}
                  <div className="flex flex-wrap items-center gap-4 text-[9px] font-extrabold uppercase tracking-widest text-[var(--text-secondary)] mt-1 select-none">
                       {/* Reply */}
                       <button 
                           onClick={() => setShowReplyForm(!showReplyForm)} 
                           className="flex items-center gap-1 hover:text-[var(--text-primary)] transition-colors"
                       >
                           <ReplyIcon /> Reply
                       </button>

                       {/* Translate */}
                       <button 
                           onClick={handleTranslate} 
                           className="hover:text-[var(--brand-color)] transition-colors"
                       >
                           {translated ? 'Show Original' : 'Translate'}
                       </button>

                       {/* Emoji Reaction Drawer */}
                       <div className="flex items-center gap-1 relative group/reaction">
                           <button className="hover:text-[var(--text-primary)] transition-colors flex items-center gap-0.5">
                               <FaSmile /> React
                           </button>
                           {/* Popover reactions */}
                           <div className="absolute left-0 bottom-full mb-1 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-full px-2 py-1 gap-1.5 shadow-lg hidden group-hover/reaction:flex items-center z-20" style={{ backdropFilter: 'blur(10px)' }}>
                               {['❤️', '🔥', '👏', '😮', '👍'].map(emoji => (
                                   <span 
                                       key={emoji}
                                       onClick={() => handleReaction(emoji)}
                                       className="cursor-pointer hover:scale-130 transition-transform text-xs"
                                   >
                                       {emoji}
                                   </span>
                               ))}
                           </div>
                       </div>
                       
                       <button className="hover:text-[var(--rejected-color)] transition-colors opacity-0 group-hover/card:opacity-100">
                           Report
                       </button>

                       {/* Bot probability detection flag warnings */}
                       {comment.detectionScores?.bot?.score > 0.35 && (
                           <div className="flex items-center gap-1 text-[var(--rejected-color)] ml-auto" title="Flagged synthetic perplexity anomalies">
                               <FiAlertTriangle /> {(comment.detectionScores.bot.score * 100).toFixed(0)}% Bot Likelihood
                           </div>
                       )}
                  </div>

                  {/* Render reactions list */}
                  {reactions.length > 0 && (
                      <div className="flex gap-1 mt-1.5">
                          {reactions.map(emoji => (
                              <span 
                                  key={emoji}
                                  onClick={() => handleReaction(emoji)}
                                  className="text-[10px] bg-[var(--surface-hover)]/30 border border-[var(--border-color)] px-1.5 py-0.5 rounded-full cursor-pointer hover:scale-105 transition-transform"
                              >
                                  {emoji}
                              </span>
                          ))}
                      </div>
                  )}

                  {/* Inline Reply Form */}
                  {showReplyForm && (
                      <div className="mt-2.5">
                          <CommentEditor 
                              postId={postId} 
                              parentId={comment._id} 
                              onCancel={() => setShowReplyForm(false)} 
                              onSubmitSuccess={() => {
                                  setShowReplyForm(false);
                                  if (onSubmitSuccess) onSubmitSuccess();
                              }}
                          />
                      </div>
                  )}
             </div>
        </div>
    );
}
