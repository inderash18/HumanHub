import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useAuth } from '../hooks/useAuth';
import { useUIStore } from '../store/uiStore';
import api from '../services/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUser, FiShield, FiEye, FiMoon, FiSun, FiTrash2, FiSliders, FiHelpCircle } from 'react-icons/fi';

export default function SettingsPage() {
    const { user, setUser } = useAuthStore();
    const { handleLogout } = useAuth();
    const { theme, toggleTheme } = useUIStore();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState('account');
    const [loading, setLoading] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Form inputs state
    const [formData, setFormData] = useState({
        username: user?.username || '',
        bio: user?.bio || '',
        avatar: user?.avatar || ''
    });

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        const toastId = toast.loading('Syncing identity controls...');
        try {
            const { data } = await api.put('/users/me', formData);
            setUser(data);
            toast.success('Identity sync successful!', { id: toastId });
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || 'Identity sync failed', { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        setLoading(true);
        const toastId = toast.loading('Initiating account termination protocol...');
        try {
            await api.delete('/users/me');
            toast.success("Identity purged. Disconnected.", { id: toastId });
            await handleLogout();
            navigate('/');
        } catch (err) {
            console.error(err);
            toast.error("Termination protocol failed.", { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        { id: 'account', label: 'Account Profile', icon: <FiUser /> },
        { id: 'privacy', label: 'Privacy & Security', icon: <FiShield /> },
        { id: 'appearance', label: 'Appearance', icon: <FiSliders /> },
        { id: 'danger', label: 'Danger Zone', icon: <FiTrash2 /> },
    ];

    return (
        <div className="w-full max-w-[1000px] mx-auto flex flex-col md:flex-row gap-8 py-2 px-1">
            {/* Left Tab Sidebar list */}
            <div className="w-full md:w-64 flex-shrink-0 flex flex-col gap-2 premium-card p-4 bg-[var(--surface-color)] self-start border border-[var(--border-color)]">
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-[var(--text-secondary)] px-3 mb-2">Controls</span>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => {
                            setActiveTab(tab.id);
                            setShowDeleteConfirm(false);
                        }}
                        className={`flex items-center gap-3 px-3.5 py-3 rounded-[18px] text-xs font-bold transition-all ${
                            activeTab === tab.id
                                ? 'text-[var(--brand-color)] bg-[var(--surface-hover)]/30 border border-[var(--border-color)] shadow-sm'
                                : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] border border-transparent'
                        }`}
                    >
                        <span className="text-sm flex-shrink-0">{tab.icon}</span>
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Right Panel details */}
            <div className="flex-1 premium-card p-6 md:p-8 bg-[var(--surface-color)] border border-[var(--border-color)]">
                <AnimatePresence mode="wait">
                    {activeTab === 'account' && (
                        <motion.form 
                            key="account"
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            onSubmit={handleUpdateProfile} 
                            className="flex flex-col gap-6"
                        >
                            <div className="border-b border-[var(--border-color)] pb-3">
                                <h2 className="text-lg font-black font-brand text-[var(--text-primary)]">Account Profile</h2>
                                <p className="text-[11px] text-[var(--text-secondary)] font-medium">Manage your public human identifier metrics.</p>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-secondary)]">Username</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.username}
                                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                                    className="premium-input text-xs font-semibold"
                                    placeholder="Username"
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-secondary)]">Avatar Image Link</label>
                                <input
                                    type="text"
                                    value={formData.avatar}
                                    onChange={e => setFormData({ ...formData, avatar: e.target.value })}
                                    className="premium-input text-xs font-semibold"
                                    placeholder="https://example.com/avatar.jpg"
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-secondary)]">Identity Bio</label>
                                <textarea
                                    value={formData.bio}
                                    onChange={e => setFormData({ ...formData, bio: e.target.value })}
                                    className="premium-input text-xs font-semibold min-h-[100px] resize-none leading-relaxed"
                                    placeholder="Write a brief biographical profile..."
                                />
                            </div>

                            <button 
                                type="submit" 
                                disabled={loading}
                                className="btn-premium py-3 text-xs uppercase tracking-wider font-extrabold self-start"
                            >
                                {loading ? 'Saving Changes...' : 'Save Profile Details'}
                            </button>
                        </motion.form>
                    )}

                    {activeTab === 'privacy' && (
                        <motion.div 
                            key="privacy"
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            className="flex flex-col gap-6"
                        >
                            <div className="border-b border-[var(--border-color)] pb-3">
                                <h2 className="text-lg font-black font-brand text-[var(--text-primary)]">Privacy & Security</h2>
                                <p className="text-[11px] text-[var(--text-secondary)] font-medium">Adjust your human biological key verification permissions.</p>
                            </div>

                            <div className="flex flex-col gap-4">
                                <div className="p-4 rounded-[18px] bg-[var(--surface-hover)]/30 border border-[var(--border-color)] flex justify-between items-center">
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-xs font-bold text-[var(--text-primary)]">Biological Scanner Ingest</span>
                                        <span className="text-[10px] text-[var(--text-secondary)]">Run metadata validation checks before each publishing pipeline.</span>
                                    </div>
                                    <div className="w-9 h-5 rounded-full bg-[var(--verified-color)] p-0.5 flex justify-end cursor-pointer">
                                        <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
                                    </div>
                                </div>

                                <div className="p-4 rounded-[18px] bg-[var(--surface-hover)]/30 border border-[var(--border-color)] flex justify-between items-center">
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-xs font-bold text-[var(--text-primary)]">Incognito Humanity Index</span>
                                        <span className="text-[10px] text-[var(--text-secondary)]">Hide your trust rating percentage from search results.</span>
                                    </div>
                                    <div className="w-9 h-5 rounded-full bg-[var(--border-color)] p-0.5 flex justify-start cursor-pointer">
                                        <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'appearance' && (
                        <motion.div 
                            key="appearance"
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            className="flex flex-col gap-6"
                        >
                            <div className="border-b border-[var(--border-color)] pb-3">
                                <h2 className="text-lg font-black font-brand text-[var(--text-primary)]">Appearance</h2>
                                <p className="text-[11px] text-[var(--text-secondary)] font-medium">Personalize your visual system workspace theme.</p>
                            </div>

                            <div className="flex flex-col gap-4">
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-secondary)]">Selected Theme</span>
                                <div className="flex gap-4">
                                    <button 
                                        onClick={toggleTheme}
                                        className={`flex-1 flex flex-col items-center gap-3 p-5 rounded-[24px] border ${
                                            theme === 'light' 
                                                ? 'border-[var(--brand-color)] bg-[var(--surface-hover)]/30' 
                                                : 'border-[var(--border-color)] bg-transparent'
                                        } transition-all`}
                                    >
                                        <FiSun className="text-2xl text-yellow-500" />
                                        <span className="text-xs font-bold">Light Glass</span>
                                    </button>

                                    <button 
                                        onClick={toggleTheme}
                                        className={`flex-1 flex flex-col items-center gap-3 p-5 rounded-[24px] border ${
                                            theme === 'dark' 
                                                ? 'border-[var(--brand-color)] bg-[var(--surface-hover)]/30' 
                                                : 'border-[var(--border-color)] bg-transparent'
                                        } transition-all`}
                                    >
                                        <FiMoon className="text-2xl text-indigo-400" />
                                        <span className="text-xs font-bold">Deep Cinematic</span>
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'danger' && (
                        <motion.div 
                            key="danger"
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            className="flex flex-col gap-6"
                        >
                            <div className="border-b border-[var(--border-color)] pb-3">
                                <h2 className="text-lg font-black font-brand text-red-500">Deactivate Human Account</h2>
                                <p className="text-[11px] text-[var(--text-secondary)] font-medium">Irreversibly terminate your HumanHub account.</p>
                            </div>

                            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                                Purging your profile terminates all human authenticity scores, removes access parameters from your registered email address, and deletes publication files permanently.
                            </p>

                            {!showDeleteConfirm ? (
                                <button 
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="btn-premium-outline py-3 border-red-500/20 hover:border-red-500 text-red-500 hover:bg-red-500/5 text-xs uppercase tracking-wider font-extrabold self-start"
                                >
                                    Deactivate Account
                                </button>
                            ) : (
                                <div className="p-5 rounded-[24px] border border-red-500/20 bg-red-500/5 flex flex-col gap-4 animate-in">
                                    <h4 className="text-xs font-bold text-[var(--text-primary)]">Are you absolutely sure you want to deactivate?</h4>
                                    <div className="flex gap-3">
                                        <button 
                                            onClick={handleDeleteAccount}
                                            disabled={loading}
                                            className="btn-premium py-2.5 px-6 text-xs bg-red-500 hover:bg-red-600 text-white font-extrabold uppercase tracking-wide"
                                        >
                                            {loading ? 'Purging...' : 'Yes, Delete Identity'}
                                        </button>
                                        <button 
                                            onClick={() => setShowDeleteConfirm(false)}
                                            className="btn-premium-outline py-2.5 px-6 text-xs text-[var(--text-primary)] font-extrabold uppercase tracking-wide border-[var(--border-color)] hover:bg-[var(--surface-hover)]"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
