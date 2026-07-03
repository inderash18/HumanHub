import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiBell, FiShield, FiHeart, FiMessageSquare, FiUserPlus, FiTrash2 } from 'react-icons/fi';
import api from '../services/api';
import Spinner from '../components/ui/Spinner';
import { formatRelativeTime } from '../utils/formatters';
import toast from 'react-hot-toast';

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications');
            setNotifications(res.data || []);
            // Mark all as read after fetching
            await api.post('/notifications/read-all');
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const handleClear = () => {
        setNotifications([]);
        toast.success("All notifications dismissed locally.");
    };

    // Filter logic
    const filtered = notifications.filter(n => {
        if (activeTab === 'all') return true;
        if (activeTab === 'clearance') return n.type === 'verification' || n.type === 'moderator';
        if (activeTab === 'engagement') return n.type === 'like' || n.type === 'comment' || n.type === 'follow';
        return true;
    });

    const getIcon = (type) => {
        switch (type) {
            case 'verification':
            case 'moderator':
                return <FiShield className="text-[var(--verified-color)] text-lg" />;
            case 'like':
                return <FiHeart className="text-[var(--rejected-color)] text-lg" />;
            case 'comment':
                return <FiMessageSquare className="text-sky-500 text-lg" />;
            case 'follow':
                return <FiUserPlus className="text-indigo-500 text-lg" />;
            default:
                return <FiBell className="text-[var(--text-secondary)] text-lg" />;
        }
    };

    return (
        <div className="w-full max-w-[700px] mx-auto flex flex-col gap-6 py-2 px-1">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
                <div className="flex items-center gap-2.5">
                    <FiBell className="text-2xl text-[var(--brand-color)]" />
                    <h1 className="font-brand text-2xl font-black tracking-tight text-[var(--text-primary)]">Notifications</h1>
                </div>
                {notifications.length > 0 && (
                    <button 
                        onClick={handleClear}
                        className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] hover:text-red-500 transition-colors"
                    >
                        <FiTrash2 />
                        <span>Clear All</span>
                    </button>
                )}
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-1.5 bg-[var(--surface-hover)] p-1 rounded-full border border-[var(--border-color)] self-start select-none">
                {[
                    { id: 'all', label: 'All Alerts' },
                    { id: 'clearance', label: 'Human Clearances' },
                    { id: 'engagement', label: 'Engagement' }
                ].map(t => (
                    <button
                        key={t.id}
                        onClick={() => setActiveTab(t.id)}
                        className={`text-[11px] font-bold uppercase tracking-wider px-5 py-1.5 rounded-full transition-all duration-200 ${
                            activeTab === t.id 
                                ? 'bg-[var(--surface-color)] text-[var(--brand-color)] shadow-sm' 
                                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                        }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Notification Stream */}
            <div className="flex flex-col gap-3">
                {loading ? (
                    <div className="flex flex-col items-center justify-center p-20 gap-3">
                        <Spinner size="md" />
                        <span className="text-[9px] font-extrabold text-[var(--text-secondary)] uppercase tracking-wider">Syncing ledger signals...</span>
                    </div>
                ) : (
                    <AnimatePresence mode="popLayout">
                        {filtered.length === 0 ? (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="premium-card p-12 text-center border border-[var(--border-color)] flex flex-col items-center gap-3 bg-[var(--surface-color)]"
                            >
                                <span className="text-3xl">📭</span>
                                <h3 className="font-brand font-bold text-md text-[var(--text-primary)]">Quiet Horizon</h3>
                                <p className="text-xs text-[var(--text-secondary)] max-w-xs leading-relaxed">
                                    You are completely up to date. No verification logs or social interactions are pending.
                                </p>
                            </motion.div>
                        ) : (
                            filtered.map((noti) => (
                                <motion.div
                                    key={noti._id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.98, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.98, y: -10 }}
                                    transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                                    className={`premium-card p-4 flex gap-4 bg-[var(--surface-color)] border border-[var(--border-color)] items-start transition-all hover:bg-[var(--surface-hover)] ${
                                        !noti.isRead ? 'border-l-4 border-l-[var(--brand-color)]' : ''
                                    }`}
                                >
                                    {/* Left icon bubble wrapper */}
                                    <div className="w-9 h-9 rounded-full bg-[var(--surface-hover)] flex items-center justify-center flex-shrink-0">
                                        {getIcon(noti.type)}
                                    </div>

                                    {/* Body */}
                                    <div className="flex-1 flex flex-col min-w-0">
                                        <span className="text-xs font-semibold text-[var(--text-primary)] leading-relaxed">
                                            {noti.body}
                                        </span>
                                    </div>

                                    {/* Timestamp */}
                                    <span className="text-[9px] text-[var(--text-muted)] font-mono self-start mt-0.5">{formatRelativeTime(noti.createdAt)}</span>
                                </motion.div>
                            ))
                        )}
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
}
