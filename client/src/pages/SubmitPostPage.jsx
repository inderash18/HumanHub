import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiFileText, FiImage, FiLink, FiCheckSquare, FiLoader, FiShield, FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../services/api';
import { fetchCommunities } from '../services/communityService';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import MediaUpload from '../components/media/MediaUpload';

const TABS = [
    { key: 'text', icon: <FiFileText />, label: 'Write' },
    { key: 'image', icon: <FiImage />, label: 'Media' },
    { key: 'link', icon: <FiLink />, label: 'Link' },
    { key: 'poll', icon: <FiCheckSquare />, label: 'Poll' },
];

export default function SubmitPostPage() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('text');
    const [loading, setLoading] = useState(false);
    
    // Scan overlay states
    const [scanning, setScanning] = useState(false);
    const [scanMessage, setScanMessage] = useState('Checking image before publishing...');

    // Core Form State
    const [communities, setCommunities] = useState([]);
    const [selectedCommunity, setSelectedCommunity] = useState('');
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [mediaFiles, setMediaFiles] = useState([]); // Array of { id, preview, file }
    const [linkUrl, setLinkUrl] = useState('');
    
    // Poll options state
    const [pollOptions, setPollOptions] = useState(['', '']);

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

    const handlePublish = async (isDraft = false) => {
        if (!selectedCommunity) return toast.error("Please select a community zone.");
        if (!title.trim()) return toast.error("A post title is required.");

        setScanning(true);
        setScanMessage("Checking image before publishing...");

        try {
            let finalMediaUrls = [];
            let finalMediaIds = [];
            let isHeldForReview = false;

            // 1. Upload media if any and verify with server
            if (mediaFiles.length > 0) {
                for (const m of mediaFiles) {
                    const formData = new FormData();
                    formData.append('file', m.file);
                    
                    const { data: uploadRes } = await api.post('/v1/media/uploads', formData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });

                    if (uploadRes?.success) {
                        finalMediaUrls.push(uploadRes.url);
                        finalMediaIds.push(uploadRes.mediaId);

                        // Poll for analysis completion if pending (max 8 attempts)
                        let decision = uploadRes.publicationDecision || 'PENDING';
                        let reason = uploadRes.decisionReason || '';
                        let attempts = 0;

                        while ((decision === 'PENDING' || !decision) && attempts < 8) {
                            await new Promise(r => setTimeout(r, 1000));
                            attempts++;
                            try {
                                const checkRes = await api.get(`/v1/media/${uploadRes.mediaId}/analysis`);
                                if (checkRes.data?.data) {
                                    decision = checkRes.data.data.publicationDecision;
                                    reason = checkRes.data.data.decisionReason;
                                    if (decision === 'PENDING') {
                                        setScanMessage("Checking image origin and credentials...");
                                    }
                                }
                            } catch {}
                        }

                        if (decision === 'BLOCKED') {
                            throw new Error(`Google AI generation or editing detected (${reason}). Publication is blocked.`);
                        }

                        if (decision === 'HELD_FOR_REVIEW' || decision === 'CHECK_UNAVAILABLE' || decision === 'PENDING') {
                            isHeldForReview = true;
                        }
                    }
                }
            }

            // 2. Create Post
            const postPayload = {
                title,
                caption: title,
                body: activeTab === 'text' ? body : activeTab === 'poll' ? JSON.stringify({ pollOptions: pollOptions.filter(o => o.trim()) }) : '',
                communityId: selectedCommunity,
                mediaUrls: finalMediaUrls,
                mediaIds: finalMediaIds,
                status: isDraft ? 'draft' : (isHeldForReview ? 'pending_review' : 'published')
            };

            await api.post('/posts', postPayload);
            if (isDraft) {
                toast.success("Draft saved successfully!");
            } else if (isHeldForReview) {
                toast.success("Automated AI check is currently unavailable. Your post is held for manual review.", { duration: 5000 });
            } else {
                toast.success("Post published successfully!");
            }
            navigate('/feed');
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || err.message || "Post transmission interrupted.");
        } finally {
            setScanning(false);
        }
    };

    const handleAddPollOption = () => {
        if (pollOptions.length < 5) setPollOptions([...pollOptions, '']);
    };

    return (
        <div className="max-w-[700px] mx-auto px-2 py-4">
            <h1 className="font-brand text-2xl font-black tracking-tight text-[var(--text-primary)] mb-6">Create Post</h1>

            {/* Form Container */}
            <div className="premium-card p-6 flex flex-col gap-5 bg-[var(--surface-color)]">
                
                {/* Community Selector Pill */}
                <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-secondary)]">Target Zone</span>
                    <div className="relative w-fit">
                        <select 
                            value={selectedCommunity}
                            onChange={(e) => setSelectedCommunity(e.target.value)}
                            className="bg-[var(--surface-hover)] border border-[var(--border-color)] rounded-[12px] py-2 px-4 pr-10 text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-color)] appearance-none cursor-pointer"
                        >
                            <option value="" disabled>Select community...</option>
                            {communities.map(c => (
                                <option key={c._id} value={c._id}>c/{c.slug}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-[var(--border-color)] gap-1">
                    {TABS.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all duration-200 cursor-pointer ${
                                activeTab === tab.key 
                                    ? 'border-[var(--brand-color)] text-[var(--brand-color)] bg-[var(--surface-hover)] rounded-t-[10px]' 
                                    : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                            }`}
                        >
                            {tab.icon}
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Title Input */}
                <div>
                    <input 
                        type="text" 
                        placeholder="Post headline / title" 
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full bg-[var(--surface-hover)] border border-[var(--border-color)] rounded-[14px] p-3.5 text-sm font-semibold text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--brand-color)] transition-colors"
                        maxLength={300}
                    />
                </div>

                {/* Tab Specific Views */}
                {activeTab === 'text' && (
                    <div className="flex flex-col gap-2">
                        <textarea
                            placeholder="Write your post content..."
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            className="w-full min-h-[160px] bg-[var(--surface-hover)] border border-[var(--border-color)] rounded-[14px] p-3.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--brand-color)] transition-colors resize-none"
                        />
                    </div>
                )}

                {activeTab === 'image' && (
                    <div className="flex flex-col gap-4">
                        <MediaUpload files={mediaFiles} setFiles={setMediaFiles} />
                    </div>
                )}

                {activeTab === 'link' && (
                    <div className="flex flex-col gap-2">
                        <input 
                            type="url" 
                            placeholder="https://..." 
                            value={linkUrl}
                            onChange={(e) => setLinkUrl(e.target.value)}
                            className="w-full bg-[var(--surface-hover)] border border-[var(--border-color)] rounded-[14px] p-3.5 text-sm font-medium text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--brand-color)]"
                        />
                    </div>
                )}

                {activeTab === 'poll' && (
                    <div className="flex flex-col gap-3">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-secondary)]">Poll Options</span>
                        {pollOptions.map((opt, idx) => (
                            <input 
                                key={idx}
                                type="text"
                                placeholder={`Option ${idx + 1}`}
                                value={opt}
                                onChange={(e) => {
                                    const next = [...pollOptions];
                                    next[idx] = e.target.value;
                                    setPollOptions(next);
                                }}
                                className="bg-[var(--surface-hover)] border border-[var(--border-color)] rounded-[12px] p-2.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-color)]"
                            />
                        ))}
                        {pollOptions.length < 5 && (
                            <button 
                                onClick={handleAddPollOption}
                                className="text-xs font-bold text-[var(--brand-color)] hover:underline self-start mt-1 cursor-pointer"
                            >
                                + Add Option
                            </button>
                        )}
                    </div>
                )}

                {/* Footer Controls */}
                <div className="flex items-center justify-between border-t border-[var(--border-color)] pt-4 mt-2">
                    <span className="text-[11px] text-[var(--text-tertiary)] flex items-center gap-1.5">
                        <FiShield className="text-[var(--brand-color)]" />
                        Server verifies provenance & origin before publishing
                    </span>

                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => handlePublish(true)}
                            disabled={scanning}
                            className="bg-transparent hover:bg-white/5 border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-bold px-4 py-2.5 rounded-[12px] transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                        >
                            Save Draft
                        </button>

                        <button 
                            onClick={() => handlePublish(false)}
                            disabled={scanning}
                            className="bg-[var(--brand-color)] hover:bg-[var(--brand-hover)] text-white text-xs font-extrabold px-6 py-2.5 rounded-[12px] shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-2"
                        >
                            {scanning && <FiLoader className="animate-spin" />}
                            <span>Publish</span>
                        </button>
                    </div>
                </div>

            </div>

            {/* Scanning Overlay Modal */}
            <AnimatePresence>
                {scanning && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                    >
                        <div className="bg-[var(--surface-elevated)] border border-[var(--border-color)] rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4">
                            <div className="w-14 h-14 rounded-full bg-[var(--brand-color)]/10 border border-[var(--brand-color)]/30 flex items-center justify-center mx-auto text-[var(--brand-color)]">
                                <FiLoader className="w-7 h-7 animate-spin" />
                            </div>
                            <h3 className="text-base font-bold text-[var(--text-primary)]">
                                Origin Verification in Progress
                            </h3>
                            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                                {scanMessage}
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
