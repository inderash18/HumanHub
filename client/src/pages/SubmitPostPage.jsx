import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaFileAlt, FaImage, FaLink, FaPoll, FaRegEdit } from 'react-icons/fa';

import toast from 'react-hot-toast';

import api from '../services/api';
import { fetchCommunities } from '../services/communityService';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import MediaUpload from '../components/media/MediaUpload';

const TABS = [
    { key: 'text', icon: <FaFileAlt />, label: 'Post' },
    { key: 'image', icon: <FaImage />, label: 'Images & Video' },
    { key: 'link', icon: <FaLink />, label: 'Link' },
    { key: 'poll', icon: <FaPoll />, label: 'Poll' , disabled: true },
];

export default function SubmitPostPage() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('text');
    const [loading, setLoading] = useState(false);
    
    // Core State
    const [communities, setCommunities] = useState([]);
    const [selectedCommunity, setSelectedCommunity] = useState('');
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [mediaFiles, setMediaFiles] = useState([]); // Array of { id, preview, file }

    useEffect(() => {
        const load = async () => {
            try {
                const data = await fetchCommunities();
                if (data?.length > 0) {
                    setCommunities(data);
                    setSelectedCommunity(data[0]._id);
                }
            } catch (err) {
                console.error(err);
            }
        };
        load();
    }, []);

    const handlePublish = async () => {
        if (!selectedCommunity) return toast.error("Select a community first");
        if (!title.trim()) return toast.error("Title is required");

        setLoading(true);
        const toastId = toast.loading('Publishing to the human network...');

        try {
            let finalMediaUrls = [];

            // 1. Upload media if any
            if (mediaFiles.length > 0) {
                const formData = new FormData();
                mediaFiles.forEach(m => formData.append('images', m.file));
                
                const { data: uploadData } = await api.post('/posts/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                finalMediaUrls = uploadData.urls;
            }

            // 2. Create Post
            const postPayload = {
                title,
                body: activeTab === 'text' ? body : '',
                communityId: selectedCommunity,
                mediaUrls: finalMediaUrls,
                status: 'pending'
            };

            await api.post('/posts', postPayload);
            toast.success("Identity verified. Post queued.", { id: toastId });
            navigate('/feed');
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || "Transmission failed", { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-[780px] mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6 border-b border-reddit-dark-border pb-4">
                <h1 className="text-xl font-bold text-white tracking-tight">Create a post</h1>
                <button className="text-xs font-black text-reddit-text-dim hover:text-white uppercase tracking-widest flex items-center gap-2">
                    <FaRegEdit /> Drafts
                </button>

            </div>

            {/* Community Picker */}
            <div className="mb-6 relative group">
                <select 
                    value={selectedCommunity}
                    onChange={(e) => setSelectedCommunity(e.target.value)}
                    className="w-[300px] bg-reddit-dark-surface border border-reddit-dark-border rounded-xl p-3 text-sm font-bold text-white focus:outline-none focus:border-white transition-all appearance-none cursor-pointer"
                >
                    <option value="" disabled>Select a community</option>
                    {communities.map(c => (
                        <option key={c._id} value={c._id}>r/{c.slug}</option>
                    ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">▼</div>
            </div>

            {/* Main Editor Card */}
            <div className="reddit-card border-none bg-reddit-dark-bg flex flex-col overflow-hidden">
                {/* Tabs */}
                <div className="flex border-b border-reddit-dark-border bg-reddit-dark-surface/30">
                    {TABS.map(tab => (
                        <button
                            key={tab.key}
                            disabled={tab.disabled}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex-1 p-4 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${
                                activeTab === tab.key 
                                ? 'text-reddit-orange border-reddit-orange bg-reddit-orange/5' 
                                : 'text-reddit-text-dim border-transparent hover:bg-reddit-dark-surface/50 grayscale'
                            } ${tab.disabled && 'opacity-20 cursor-not-allowed'}`}
                        >
                            <span className="text-sm">{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="p-4 bg-reddit-dark-surface/20 flex flex-col gap-4">
                    {/* Title (Always present) */}
                    <div className="relative">
                        <input 
                            type="text" 
                            placeholder="Title*" 
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            maxLength={300}
                            className="w-full bg-reddit-dark-surface border border-reddit-dark-border rounded-xl p-4 text-sm font-medium text-white placeholder:text-zinc-600 focus:outline-none focus:border-white transition-all"
                        />
                        <div className="absolute right-4 bottom-2 text-[10px] font-black text-zinc-600 uppercase tracking-widest">
                            {title.length}/300
                        </div>
                    </div>

                    {/* Content Area */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            transition={{ duration: 0.15 }}
                        >
                            {activeTab === 'text' && (
                                <div className="premium-editor">
                                    <ReactQuill 
                                        theme="snow" 
                                        value={body} 
                                        onChange={setBody} 
                                        placeholder="Body text (optional)"
                                        style={{ minHeight: '180px' }}
                                    />
                                    <style>{`
                                        .premium-editor .ql-container { border: 1px solid var(--border-color) !important; border-radius: 0 0 12px 12px !important; color: white !important; font-family: inherit; font-size: 14px; min-height: 180px; }
                                        .premium-editor .ql-toolbar { background: var(--surface-elevated) !important; border: 1px solid var(--border-color) !important; border-radius: 12px 12px 0 0 !important; }
                                        .premium-editor .ql-editor.ql-blank::before { color: var(--text-muted) !important; font-style: normal; }
                                        .premium-editor .ql-stroke { stroke: #d7dadc !important; }
                                        .premium-editor .ql-fill { fill: #d7dadc !important; }
                                        .premium-editor .ql-picker { color: #d7dadc !important; }
                                    `}</style>
                                </div>
                            )}

                            {activeTab === 'image' && (
                                <MediaUpload value={mediaFiles} onChange={setMediaFiles} />
                            )}

                            {activeTab === 'link' && (
                                <input 
                                    type="url" 
                                    placeholder="Url"
                                    className="w-full bg-reddit-dark-surface border border-reddit-dark-border rounded-xl p-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-white transition-all"
                                />
                            )}
                        </motion.div>
                    </AnimatePresence>

                    {/* Action Bar */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-reddit-dark-border mt-2">
                        <button 
                            onClick={() => navigate('/feed')}
                            className="px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest text-reddit-orange border border-reddit-orange hover:bg-reddit-orange/5 transition-all"
                        >
                            Cancel
                        </button>
                        <button 
                            disabled={loading || !title.trim()}
                            onClick={handlePublish}
                            className="px-8 py-2.5 rounded-full text-xs font-black uppercase tracking-widest text-white bg-reddit-orange hover:bg-reddit-orange-hover disabled:opacity-20 transition-all shadow-lg"
                        >
                            {loading ? 'Verifying...' : 'Post'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="mt-6 flex items-center justify-between p-4 reddit-card bg-reddit-dark-surface/10">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-brand-success animate-pulse" />
                    <span className="text-[10px] font-black text-brand-muted uppercase tracking-[0.2em]">Signal encrypted & anonymized</span>
                </div>
                <div className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Reddit Protocol v2.4</div>
            </div>
        </div>
    );
}
