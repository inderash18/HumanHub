import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import { useSocket } from '../hooks/useSocket';
import { fetchConversations, fetchMessages } from '../services/messageService';
import api from '../services/api';
import { FiMessageSquare, FiSend, FiImage, FiMic, FiPhone, FiVideo, FiInfo, FiCircle, FiPlay, FiSmile } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export default function MessagesPage() {
    const { user } = useAuthStore();
    const socket = useSocket();

    const [conversations, setConversations] = useState([]);
    const [activeChatIdx, setActiveChatIdx] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMsg, setNewMsg] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [isTyping, setIsTyping] = useState(false);
    const [messageReactions, setMessageReactions] = useState({}); // { msgId: emoji }

    const messagesEndRef = useRef(null);
    const activeChat = activeChatIdx !== null ? conversations[activeChatIdx] : null;

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const loadConversations = async () => {
        try {
            const data = await fetchConversations();
            setConversations(data);
            if (data.length > 0) {
                setActiveChatIdx(0);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const loadSuggestions = async () => {
        try {
            const res = await api.get('/users/suggested/list');
            setSuggestions(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        loadConversations();
        loadSuggestions();
    }, []);

    useEffect(() => {
        if (!activeChat) return;
        const loadMessages = async () => {
            try {
                const data = await fetchMessages(activeChat.user._id);
                setMessages(data);
            } catch (err) {
                console.error(err);
            }
        };
        loadMessages();
    }, [activeChatIdx, activeChat?.user?._id]);

    useEffect(() => {
        if (!socket) return;

        const handleIncomingMessage = (msg) => {
            const activeUser = activeChat?.user;
            if (activeUser && (msg.sender._id === activeUser._id || msg.receiver._id === activeUser._id)) {
                setMessages(prev => {
                    if (prev.some(m => m._id === msg._id)) return prev;
                    return [...prev, msg];
                });
            }
            // Sync thread
            setConversations(prev => {
                const otherUserObj = msg.sender._id === user._id ? msg.receiver : msg.sender;
                const matchIdx = prev.findIndex(c => c.user._id === otherUserObj._id);

                if (matchIdx !== -1) {
                    const updated = [...prev];
                    updated[matchIdx] = {
                        ...updated[matchIdx],
                        lastMsg: msg.text || 'Shared media attachments',
                        time: msg.createdAt,
                        unread: msg.sender._id !== user._id && activeChatIdx !== matchIdx
                    };
                    return updated;
                } else {
                    return [{
                        id: msg._id,
                        user: otherUserObj,
                        lastMsg: msg.text || 'Shared media attachments',
                        unread: msg.sender._id !== user._id,
                        time: msg.createdAt
                    }, ...prev];
                }
            });
        };

        socket.on('message:receive', handleIncomingMessage);
        return () => {
            socket.off('message:receive', handleIncomingMessage);
        };
    }, [socket, activeChatIdx, activeChat?.user?._id, user._id]);

    const startNewChat = (targetUser) => {
        const existingIdx = conversations.findIndex(c => c.user._id === targetUser._id);
        if (existingIdx !== -1) {
            setActiveChatIdx(existingIdx);
        } else {
            const newThread = {
                id: `new_${Date.now()}`,
                user: targetUser,
                lastMsg: 'Start typing to begin...',
                unread: false,
                time: new Date()
            };
            setConversations(prev => [newThread, ...prev]);
            setActiveChatIdx(0);
            setMessages([]);
        }
    };

    const handleSend = (e) => {
        e.preventDefault();
        if (!newMsg.trim() || !activeChat) return;

        const tempClientId = Math.random().toString();
        const clientMsgObj = {
            _id: tempClientId,
            sender: { _id: user._id },
            receiver: { _id: activeChat.user._id },
            text: newMsg,
            createdAt: new Date().toISOString()
        };

        setMessages(prev => [...prev, clientMsgObj]);
        setNewMsg('');

        // Socket integration
        if (socket) {
            socket.emit('message:send', {
                senderId: user._id,
                receiverId: activeChat.user._id,
                text: newMsg
            });
        }

        // Simulated high-fidelity typing reply after 2 seconds
        setTimeout(() => {
            setIsTyping(true);
            setTimeout(() => {
                setIsTyping(false);
                const replyObj = {
                    _id: Math.random().toString(),
                    sender: activeChat.user,
                    receiver: { _id: user._id },
                    text: `Hey! Your message resolved securely. Let's align on HumanHub metrics soon! 🌿`,
                    createdAt: new Date().toISOString()
                };
                setMessages(prev => [...prev, replyObj]);
            }, 1500);
        }, 1000);
    };

    // Shared mock voice note
    const handleVoiceRecord = () => {
        toast.success("Voice note recording synced...");
        setTimeout(() => {
            const voiceMsg = {
                _id: Math.random().toString(),
                sender: { _id: user._id },
                isVoice: true,
                duration: '0:12',
                createdAt: new Date().toISOString()
            };
            setMessages(prev => [...prev, voiceMsg]);
        }, 1200);
    };

    // Shared mock image files
    const handleImageShare = () => {
        toast.success("Syncing camera snapshots...");
        setTimeout(() => {
            const imageMsg = {
                _id: Math.random().toString(),
                sender: { _id: user._id },
                isImage: true,
                imageUrl: 'https://images.unsplash.com/photo-1504051771394-dd2e66b2e08f?w=400',
                createdAt: new Date().toISOString()
            };
            setMessages(prev => [...prev, imageMsg]);
        }, 1000);
    };

    const handleReaction = (msgId, emoji) => {
        setMessageReactions(prev => ({
            ...prev,
            [msgId]: prev[msgId] === emoji ? null : emoji
        }));
    };

    return (
        <div className="w-full max-w-[1000px] mx-auto flex gap-6 py-2 px-1">
            {/* Left: Chats Thread list */}
            <div className="w-80 flex-shrink-0 flex flex-col gap-4 premium-card p-4 h-[75vh] bg-[var(--surface-color)] border border-[var(--border-color)]">
                <div className="flex items-center gap-2 border-b border-[var(--border-color)] pb-3.5">
                    <FiMessageSquare className="text-xl text-[var(--brand-color)]" />
                    <h2 className="font-brand text-md font-black tracking-tight text-[var(--text-primary)]">Messages</h2>
                </div>

                <div className="flex flex-col gap-2 overflow-y-auto no-scrollbar flex-1">
                    {conversations.length === 0 ? (
                        <div className="text-center py-6">
                            <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider block mb-4">Suggested contacts</span>
                            <div className="flex flex-col gap-2">
                                {suggestions.map(s => (
                                    <div 
                                        key={s._id}
                                        onClick={() => startNewChat(s)}
                                        className="flex items-center gap-2.5 p-2 rounded-xl bg-[var(--surface-hover)] border border-[var(--border-color)] cursor-pointer hover:border-[var(--brand-color)] transition-all"
                                    >
                                        <div className="w-7 h-7 rounded-full bg-[var(--brand-color)] flex items-center justify-center overflow-hidden">
                                            {s.avatar ? (
                                                <img src={s.avatar} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-white text-[10px] font-bold uppercase">{s.username?.[0]}</span>
                                            )}
                                        </div>
                                        <span className="text-xs font-bold text-[var(--text-primary)] truncate">{s.username}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        conversations.map((chat, idx) => (
                            <div 
                                key={chat.id}
                                onClick={() => {
                                    setActiveChatIdx(idx);
                                    setConversations(prev => prev.map((c, i) => i === idx ? { ...c, unread: false } : c));
                                }}
                                className={`flex items-center gap-3 p-3 rounded-[16px] cursor-pointer transition-all ${
                                    activeChatIdx === idx 
                                    ? 'bg-[var(--surface-hover)] border border-[var(--border-color)] shadow-sm' 
                                    : 'hover:bg-[var(--surface-hover)] border border-transparent'
                                }`}
                            >
                                <div className="relative flex-shrink-0">
                                    <div className="w-10 h-10 rounded-full bg-[var(--brand-color)] flex items-center justify-center overflow-hidden border border-[var(--border-color)]">
                                        {chat.user?.avatar ? (
                                            <img src={chat.user.avatar} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-white text-xs font-bold uppercase">{chat.user?.username?.[0]}</span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex-1 min-w-0 flex flex-col">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold text-[var(--text-primary)] truncate">{chat.user?.username}</span>
                                        <span className="text-[8.5px] text-[var(--text-muted)] font-mono">
                                            {chat.time ? new Date(chat.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                        </span>
                                    </div>
                                    <span className={`text-[11px] truncate mt-0.5 ${chat.unread ? 'text-[var(--text-primary)] font-bold' : 'text-[var(--text-secondary)]'}`}>
                                        {chat.lastMsg}
                                    </span>
                                </div>

                                {chat.unread && (
                                    <FiCircle className="text-[10px] text-[var(--brand-color)] fill-current flex-shrink-0" />
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Right: Dialogue screen */}
            <div className="flex-1 flex flex-col justify-between premium-card h-[75vh] bg-[var(--surface-color)] border border-[var(--border-color)] overflow-hidden">
                {activeChat ? (
                    <>
                        {/* Header metadata details */}
                        <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-[var(--brand-color)] flex items-center justify-center overflow-hidden">
                                    {activeChat.user?.avatar ? (
                                        <img src={activeChat.user.avatar} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-white text-xs font-bold uppercase">{activeChat.user?.username?.[0]}</span>
                                    )}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-[var(--text-primary)]">{activeChat.user?.username}</span>
                                    <span className="text-[9.5px] text-[var(--verified-color)] font-semibold flex items-center gap-1 uppercase tracking-wider">
                                        Human Verified
                                    </span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button className="p-2 hover:bg-[var(--surface-hover)] rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all">
                                    <FiPhone className="text-sm" />
                                </button>
                                <button className="p-2 hover:bg-[var(--surface-hover)] rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all">
                                    <FiVideo className="text-sm" />
                                </button>
                                <button className="p-2 hover:bg-[var(--surface-hover)] rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all">
                                    <FiInfo className="text-sm" />
                                </button>
                            </div>
                        </div>

                        {/* Dialogue Bubbles container */}
                        <div className="flex-1 p-5 overflow-y-auto no-scrollbar flex flex-col gap-5 bg-[var(--bg-color)]/25">
                            {messages.map((msg) => {
                                const isSelf = msg.sender?._id === user._id || msg.sender === user._id;
                                const activeReaction = messageReactions[msg._id];
                                return (
                                    <div 
                                        key={msg._id}
                                        className={`flex w-full relative ${isSelf ? 'justify-end' : 'justify-start'} group/bubble`}
                                    >
                                        {/* Hover reactions glass bar */}
                                        <div 
                                            className={`absolute bottom-full mb-1 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-full px-2 py-1 gap-1.5 z-20 shadow-lg hidden group-hover/bubble:flex items-center transition-all ${
                                                isSelf ? 'right-0' : 'left-0'
                                            }`}
                                            style={{ backdropFilter: 'blur(10px)' }}
                                        >
                                            {['❤️', '😂', '🔥', '😮', '👍', '😢'].map(emoji => (
                                                <span 
                                                    key={emoji}
                                                    onClick={() => handleReaction(msg._id, emoji)}
                                                    className="cursor-pointer hover:scale-130 transition-transform text-xs"
                                                >
                                                    {emoji}
                                                </span>
                                            ))}
                                        </div>

                                        <div className="relative flex flex-col">
                                            {/* Renders image message */}
                                            {msg.isImage ? (
                                                <div className="rounded-[18px] overflow-hidden border border-[var(--border-color)] max-w-[200px] shadow-sm bg-zinc-900">
                                                    <img src={msg.imageUrl} className="w-full object-cover" alt="" />
                                                </div>
                                            ) : msg.isVoice ? (
                                                /* Renders premium audio wave note bubble */
                                                <div 
                                                    className={`px-4 py-2.5 rounded-[18px] flex items-center gap-3 min-w-[180px] shadow-sm border ${
                                                        isSelf 
                                                            ? 'bg-[var(--brand-color)] border-transparent text-white rounded-tr-[4px]' 
                                                            : 'bg-[var(--surface-hover)] border-[var(--border-color)] text-[var(--text-primary)] rounded-tl-[4px]'
                                                    }`}
                                                >
                                                    <button className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs">
                                                        <FiPlay className="fill-current text-white text-[9px]" />
                                                    </button>
                                                    <div className="flex gap-0.5 items-end h-5">
                                                        {[3, 5, 2, 6, 4, 7, 3, 5, 2, 4].map((h, i) => (
                                                            <div 
                                                                key={i} 
                                                                className={`w-[2.5px] rounded-full ${isSelf ? 'bg-white/70' : 'bg-[var(--text-secondary)]'}`}
                                                                style={{ height: `${h * 2}px` }}
                                                            />
                                                        ))}
                                                    </div>
                                                    <span className="text-[9px] font-mono opacity-80">{msg.duration}</span>
                                                </div>
                                            ) : (
                                                /* Renders standard text bubble card */
                                                <div 
                                                    className={`max-w-[260px] px-4 py-2.5 rounded-[18px] text-xs font-semibold shadow-sm leading-relaxed ${
                                                        isSelf 
                                                        ? 'bg-[var(--brand-color)] text-white rounded-tr-[4px]' 
                                                        : 'bg-[var(--surface-hover)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-tl-[4px]'
                                                    }`}
                                                >
                                                    {msg.text}
                                                </div>
                                            )}

                                            {/* Applied reaction badge */}
                                            {activeReaction && (
                                                <div className="absolute -bottom-2 right-2 bg-[var(--surface-hover)] border border-[var(--border-color)] rounded-full px-1 py-0.5 text-[9px] shadow-sm select-none">
                                                    {activeReaction}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Typing indicator dots */}
                            {isTyping && (
                                <div className="flex w-full justify-start items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-[var(--brand-color)] flex items-center justify-center overflow-hidden flex-shrink-0">
                                        <img src={activeChat.user?.avatar} className="w-full h-full object-cover" alt="" />
                                    </div>
                                    <div className="bg-[var(--surface-hover)] border border-[var(--border-color)] rounded-[18px] rounded-tl-[4px] px-4 py-3 flex gap-1 items-center">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--text-secondary)] animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--text-secondary)] animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--text-secondary)] animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input bar controls */}
                        <form onSubmit={handleSend} className="p-4 border-t border-[var(--border-color)] flex gap-2 items-center bg-[var(--surface-color)]">
                            <button 
                                type="button" 
                                onClick={handleImageShare}
                                className="p-2 hover:bg-[var(--surface-hover)] rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
                                title="Share Media"
                            >
                                <FiImage className="text-md" />
                            </button>
                            <button 
                                type="button" 
                                onClick={handleVoiceRecord}
                                className="p-2 hover:bg-[var(--surface-hover)] rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
                                title="Record Voice"
                            >
                                <FiMic className="text-md" />
                            </button>
                            <input 
                                type="text"
                                placeholder="Message..."
                                value={newMsg}
                                onChange={e => setNewMsg(e.target.value)}
                                className="flex-1 bg-[var(--surface-hover)] border border-[var(--border-color)] rounded-full px-4 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--brand-color)]"
                            />
                            <button 
                                type="submit"
                                disabled={!newMsg.trim()}
                                className="p-2.5 bg-[var(--brand-color)] text-white rounded-full hover:bg-[var(--brand-hover)] transition-colors disabled:opacity-20 flex items-center justify-center cursor-pointer"
                            >
                                <FiSend className="text-xs" />
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 gap-3">
                        <FiMessageSquare className="text-4xl text-[var(--text-muted)]" />
                        <h3 className="font-brand font-bold text-md text-[var(--text-primary)]">No Active Chat</h3>
                        <p className="text-xs text-[var(--text-secondary)] max-w-xs leading-relaxed">
                            Select a thread from the list or start a new chat with one of our suggested verified humans.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
