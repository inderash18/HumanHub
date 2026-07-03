import { useState, useEffect } from 'react';
import { FiCopy, FiShare, FiSend, FiX, FiCheck } from 'react-icons/fi';
import { motion } from 'framer-motion';
import api from '../../services/api';
import toast from 'react-hot-toast';

const QrIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <rect x="3" y="3" width="6" height="6" rx="1" />
    <rect x="15" y="3" width="6" height="6" rx="1" />
    <rect x="3" y="15" width="6" height="6" rx="1" />
    <rect x="15" y="15" width="6" height="6" rx="1" />
    <rect x="10" y="10" width="4" height="4" />
  </svg>
);

export default function ShareSheetModal({ isOpen, onClose, postId }) {
    const [contacts, setContacts] = useState([]);
    const [copied, setCopied] = useState(false);
    const [sentStatus, setSentStatus] = useState({}); // { contactId: boolean }
    const [showQr, setShowQr] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        const fetchContacts = async () => {
            try {
                const res = await api.get('/users/suggested/list');
                setContacts(res.data || []);
            } catch (e) {
                console.error(e);
            }
        };
        fetchContacts();
    }, [isOpen]);

    if (!isOpen) return null;

    const shareUrl = `${window.location.origin}/p/${postId}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        toast.success("Link copied to clipboard!");
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSendDirect = (contactId, name) => {
        setSentStatus(prev => ({ ...prev, [contactId]: true }));
        toast.success(`Post shared with @${name}!`);
    };

    const handleExternalShare = () => {
        if (navigator.share) {
            navigator.share({
                title: 'HumanHub Post',
                url: shareUrl
            }).catch(console.error);
        } else {
            toast.success("External share options mock initialized!");
        }
    };

    return (
        <div className="fixed inset-0 z-[20000] bg-black/60 flex items-center justify-center p-4 backdrop-blur-md">
            <motion.div 
                initial={{ opacity: 0, scale: 0.96, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 15 }}
                transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
                className="w-full max-w-sm p-6 rounded-[28px] overflow-hidden flex flex-col gap-5 relative shadow-2xl"
                style={{ 
                    background: 'var(--glass-bg)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid var(--glass-border)',
                }}
            >
                {/* Close Button */}
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1.5 hover:bg-[var(--surface-hover)] rounded-full text-[var(--text-secondary)] transition-colors"
                >
                    <FiX className="text-sm" />
                </button>

                {/* Header */}
                <div className="flex flex-col gap-1 pr-6">
                    <span className="text-[9px] font-extrabold uppercase tracking-widest text-[var(--text-secondary)]">Sharing Portal</span>
                    <h3 className="text-md font-black font-brand text-[var(--text-primary)]">Share verified publication</h3>
                </div>

                {/* Direct Action buttons */}
                <div className="grid grid-cols-3 gap-3 border-b border-[var(--border-color)] pb-4">
                    <button 
                        onClick={handleCopy}
                        className="flex flex-col items-center gap-2 p-3 rounded-[18px] bg-[var(--surface-hover)]/30 border border-[var(--border-color)] hover:border-[var(--brand-color)] transition-all group"
                    >
                        <span className="text-md text-[var(--text-secondary)] group-hover:text-[var(--brand-color)]">
                            {copied ? <FiCheck className="text-emerald-500" /> : <FiCopy />}
                        </span>
                        <span className="text-[9px] font-extrabold uppercase tracking-wider text-[var(--text-secondary)]">{copied ? 'Copied' : 'Copy'}</span>
                    </button>

                    <button 
                        onClick={() => setShowQr(!showQr)}
                        className={`flex flex-col items-center gap-2 p-3 rounded-[18px] transition-all group ${
                            showQr 
                                ? 'bg-[var(--brand-color)] border-transparent text-white' 
                                : 'bg-[var(--surface-hover)]/30 border border-[var(--border-color)] hover:border-[var(--brand-color)] text-[var(--text-secondary)]'
                        }`}
                    >
                        <QrIcon />
                        <span className="text-[9px] font-extrabold uppercase tracking-wider text-[var(--text-secondary)] group-hover:text-current">QR Code</span>
                    </button>

                    <button 
                        onClick={handleExternalShare}
                        className="flex flex-col items-center gap-2 p-3 rounded-[18px] bg-[var(--surface-hover)]/30 border border-[var(--border-color)] hover:border-[var(--brand-color)] transition-all group"
                    >
                        <FiShare className="text-md text-[var(--text-secondary)] group-hover:text-[var(--brand-color)]" />
                        <span className="text-[9px] font-extrabold uppercase tracking-wider text-[var(--text-secondary)]">External</span>
                    </button>
                </div>

                {/* QR Code display mode */}
                {showQr && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="flex flex-col items-center gap-2 py-4 bg-white rounded-[20px] border border-zinc-200"
                    >
                        {/* Mock QR SVG */}
                        <svg className="w-24 h-24 text-zinc-950" viewBox="0 0 100 100" fill="currentColor">
                            <rect x="10" y="10" width="20" height="20" />
                            <rect x="70" y="10" width="20" height="20" />
                            <rect x="10" y="70" width="20" height="20" />
                            <rect x="40" y="40" width="20" height="20" />
                            <rect x="70" y="70" width="10" height="10" />
                            <rect x="80" y="80" width="10" height="10" />
                        </svg>
                        <span className="text-[9px] font-bold text-zinc-400">humanhub-protocol://post/{postId.substring(0, 8)}</span>
                    </motion.div>
                )}

                {/* Send to Chats section */}
                <div className="flex flex-col gap-3">
                    <span className="text-[9px] font-extrabold uppercase tracking-wider text-[var(--text-secondary)]">Direct Message</span>
                    <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto pr-1 no-scrollbar">
                        {contacts.map(contact => {
                            const isSent = !!sentStatus[contact._id];
                            return (
                                <div key={contact._id} className="flex items-center gap-3 p-1.5 bg-[var(--surface-color)]/25 border border-[var(--border-color)] rounded-[18px]">
                                    {contact.avatar ? (
                                        <img src={contact.avatar} alt="" className="w-8 h-8 rounded-full object-cover border border-[var(--border-color)]" />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-[var(--surface-hover)] border border-[var(--border-color)] flex items-center justify-center font-bold text-[10px] text-[var(--text-primary)] uppercase select-none">
                                            {contact.username?.[0]}
                                        </div>
                                    )}
                                    <span className="text-xs font-bold text-[var(--text-primary)] truncate">@{contact.username}</span>
                                    <button 
                                        onClick={() => handleSendDirect(contact._id, contact.username)}
                                        className={`ml-auto text-[9px] font-extrabold px-3 py-1.5 rounded-full uppercase tracking-wider transition-all border ${
                                            isSent 
                                                ? 'bg-transparent border-[var(--border-color)] text-[var(--text-secondary)]' 
                                                : 'bg-[var(--brand-color)] border-transparent text-white'
                                        }`}
                                    >
                                        {isSent ? 'Sent' : 'Send'}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
