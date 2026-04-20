import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { FaUserShield, FaExclamationTriangle, FaTrash } from 'react-icons/fa';

export default function SettingsPage() {
    const { user, token } = useAuthStore();
    const { handleLogout } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const handleDeleteAccount = async () => {
        setLoading(true);
        const toastId = toast.loading('Initiating account termination protocol...');
        try {
            await api.delete('/users/me');
            toast.success("Identity purged. You have been disconnected.", { id: toastId });
            handleLogout();
            navigate('/');
        } catch (err) {
            console.error(err);
            toast.error("Termination protocol failed. Connectivity required.", { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto px-4 py-12">
            <h1 className="text-3xl font-bold text-white mb-8 font-outfit">Identity Controls</h1>

            <div className="flex flex-col gap-8">
                {/* Profile Section */}
                <div className="reddit-card p-8 bg-reddit-dark-surface/30">
                    <h2 className="text-xs font-black text-brand-muted uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                        <FaUserShield className="text-brand-gold" /> General Profile
                    </h2>
                    
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 rounded-full bg-reddit-orange flex items-center justify-center text-3xl font-black border-4 border-white/5">
                            {user?.username?.[0]?.toUpperCase()}
                        </div>
                        <div>
                            <div className="text-xl font-bold text-white mb-1">{user?.username}</div>
                            <div className="text-sm text-brand-muted">Subject ID: {user?._id}</div>
                        </div>
                    </div>
                </div>

                {/* Privacy & Safety */}
                <div className="reddit-card p-8 bg-reddit-dark-surface/10 border-brand-danger/20">
                    <h2 className="text-xs font-black text-brand-danger uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                        <FaExclamationTriangle /> Danger Zone
                    </h2>
                    
                    <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                        Deleting your account will permanently remove your human-verified identity from the HumanHub network. 
                        This action is irreversible and will disconnect all published publications from your metadata.
                    </p>

                    {!showDeleteConfirm ? (
                        <button 
                            onClick={() => setShowDeleteConfirm(true)}
                            className="flex items-center gap-2 text-brand-danger font-bold text-xs uppercase tracking-widest hover:bg-brand-danger/10 p-4 rounded-xl transition-all border border-brand-danger/20"
                        >
                            <FaTrash /> Deactivate Human Account
                        </button>
                    ) : (
                        <div className="bg-brand-danger/5 border border-brand-danger/20 p-6 rounded-2xl flex flex-col gap-4 animate-in">
                            <h3 className="text-white font-bold">Are you absolutely sure?</h3>
                            <div className="flex gap-3">
                                <button 
                                    onClick={handleDeleteAccount}
                                    disabled={loading}
                                    className="bg-brand-danger hover:bg-red-700 text-white font-black text-[11px] px-6 py-3 rounded-full transition-all tracking-widest uppercase"
                                >
                                    {loading ? 'PURGING...' : 'YES, PERMANENTLY DELETE'}
                                </button>
                                <button 
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="text-white font-black text-[11px] px-6 py-3 rounded-full hover:bg-white/5 transition-all tracking-widest uppercase"
                                >
                                    CANCEL
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
