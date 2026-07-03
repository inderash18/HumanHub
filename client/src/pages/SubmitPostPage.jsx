import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiFileText, FiImage, FiLink, FiCheckSquare, FiLoader, FiShield, FiAlertTriangle } from 'react-icons/fi';
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
    const [scanStep, setScanStep] = useState(0); // 0: ingesting, 1: perplexity, 2: compiling, 3: completed
    const [mockScore, setMockScore] = useState(0);

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

    // Animate trust score ticking
    useEffect(() => {
        let timer;
        if (scanning) {
            timer = setInterval(() => {
                setMockScore(prev => {
                    if (prev >= 96) {
                        clearInterval(timer);
                        return 96;
                    }
                    return prev + 1;
                });
            }, 30);
        } else {
            setMockScore(0);
        }
        return () => clearInterval(timer);
    }, [scanning]);

    // Handle steps sequencing
    useEffect(() => {
        let t1, t2, t3;
        if (scanning) {
            setScanStep(0);
            t1 = setTimeout(() => setScanStep(1), 1200);
            t2 = setTimeout(() => setScanStep(2), 2400);
            t3 = setTimeout(() => setScanStep(3), 3600);
        }
        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
            clearTimeout(t3);
        };
    }, [scanning]);

    const handlePublish = async () => {
        if (!selectedCommunity) return toast.error("Please select a community zone.");
        if (!title.trim()) return toast.error("A post title is required.");

        setScanning(true);

        // Wait for scanning sequence to finish (3.8 seconds)
        setTimeout(async () => {
            try {
                let finalMediaUrls = [];

                // 1. Upload media if any
                if (mediaFiles.length > 0) {
                    const formData = new FormData();
                    mediaFiles.forEach(m => formData.append('images', m.file));
                    
                    const { data: uploadData } = await api.post('/posts/upload', formData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
                    // Append adjustment parameters as hash query metadata
                    finalMediaUrls = uploadData.urls.map((url, idx) => {
                        const adj = mediaFiles[idx]?.adjustments;
                        if (!adj) return url;
                        return `${url}#brightness=${adj.brightness}&contrast=${adj.contrast}&saturation=${adj.saturation}&rotate=${adj.rotate}&filter=${encodeURIComponent(adj.filter)}`;
                    });
                }

                // 2. Create Post
                const postPayload = {
                    title,
                    body: activeTab === 'text' ? body : activeTab === 'poll' ? JSON.stringify({ pollOptions: pollOptions.filter(o => o.trim()) }) : '',
                    communityId: selectedCommunity,
                    mediaUrls: finalMediaUrls,
                    status: 'pending' // Queued into backend verification pipeline
                };

                await api.post('/posts', postPayload);
                toast.success("Post queued for verification!");
                navigate('/feed');
            } catch (err) {
                console.error(err);
                toast.error(err.response?.data?.message || "Post transmission interrupted.");
            } finally {
                setScanning(false);
            }
        }, 4000);
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
                                <option key={c._id} value={c._id}>d/{c.slug}</option>
                            ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-xs text-[var(--text-secondary)]">▼</div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-[var(--border-color)]">
                    {TABS.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex-1 pb-3 flex items-center justify-center gap-2 text-[10px] font-extrabold uppercase tracking-widest transition-all border-b-2 ${
                                activeTab === tab.key 
                                ? 'text-[var(--brand-color)] border-[var(--brand-color)]' 
                                : 'text-[var(--text-secondary)] border-transparent hover:text-[var(--text-primary)]'
                            }`}
                        >
                            <span className="text-sm">{tab.icon}</span>
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Title */}
                <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-secondary)]">Post Title</span>
                    <input 
                        type="text" 
                        placeholder="Add an engaging title*" 
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        maxLength={300}
                        className="premium-input text-xs font-semibold py-3 px-4"
                    />
                </div>

                {/* Rich editors and components based on Active Tab */}
                <div className="min-h-[200px]">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            transition={{ duration: 0.15 }}
                        >
                            {activeTab === 'text' && (
                                <div className="premium-editor">
                                    <ReactQuill 
                                        theme="snow" 
                                        value={body} 
                                        onChange={setBody} 
                                        placeholder="Write your story..."
                                    />
                                    <style>{`
                                        .premium-editor .ql-container { border: 1px solid var(--border-color) !important; border-radius: 0 0 16px 16px !important; color: var(--text-primary) !important; font-family: inherit; font-size: 13px; min-height: 200px; }
                                        .premium-editor .ql-toolbar { background: var(--surface-hover) !important; border: 1px solid var(--border-color) !important; border-radius: 16px 16px 0 0 !important; }
                                        .premium-editor .ql-editor.ql-blank::before { color: var(--text-muted) !important; font-style: normal; }
                                        .premium-editor .ql-stroke { stroke: var(--text-secondary) !important; }
                                        .premium-editor .ql-fill { fill: var(--text-secondary) !important; }
                                        .premium-editor .ql-picker { color: var(--text-secondary) !important; }
                                    `}</style>
                                </div>
                            )}

                            {activeTab === 'image' && (
                                <MediaUpload value={mediaFiles} onChange={setMediaFiles} />
                            )}

                            {activeTab === 'link' && (
                                <div className="flex flex-col gap-2">
                                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-secondary)]">External Link</span>
                                    <input 
                                        type="url" 
                                        placeholder="https://example.com/story"
                                        value={linkUrl}
                                        onChange={(e) => setLinkUrl(e.target.value)}
                                        className="premium-input text-xs font-semibold py-3"
                                    />
                                </div>
                            )}

                            {activeTab === 'poll' && (
                                <div className="flex flex-col gap-3">
                                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-secondary)]">Poll Options</span>
                                    {pollOptions.map((opt, i) => (
                                        <input
                                            key={i}
                                            type="text"
                                            placeholder={`Option ${i + 1}`}
                                            value={opt}
                                            onChange={(e) => {
                                                const next = [...pollOptions];
                                                next[i] = e.target.value;
                                                setPollOptions(next);
                                            }}
                                            className="premium-input text-xs font-semibold py-3"
                                        />
                                    ))}
                                    {pollOptions.length < 5 && (
                                        <button 
                                            onClick={handleAddPollOption}
                                            className="text-xs font-bold text-[var(--brand-color)] text-left hover:underline w-fit mt-1"
                                        >
                                            + Add Option
                                        </button>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Footer Buttons */}
                <div className="flex justify-end gap-3 border-t border-[var(--border-color)] pt-4 mt-2">
                    <button 
                        onClick={() => navigate('/feed')}
                        className="btn-premium-outline py-2 px-6 text-xs"
                    >
                        Cancel
                    </button>
                    <button 
                        disabled={loading || !title.trim()}
                        onClick={handlePublish}
                        className="btn-premium py-2 px-8 text-xs disabled:opacity-30"
                    >
                        Publish Post
                    </button>
                </div>
            </div>

            {/* Interactive Live AI Scan Overlay Screen */}
            <AnimatePresence>
                {scanning && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[20000] bg-[var(--bg-color)]/95 flex items-center justify-center p-4 backdrop-blur-md"
                    >
                        <div className="w-full max-w-sm flex flex-col items-center text-center gap-6">
                            <div className="relative w-24 h-24 flex items-center justify-center">
                                {/* Ring progress */}
                                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                    <circle cx="18" cy="18" r="16" fill="none" stroke="var(--border-color)" strokeWidth="2" />
                                    <circle 
                                        cx="18" 
                                        cy="18" 
                                        r="16" 
                                        fill="none" 
                                        stroke="var(--brand-color)" 
                                        strokeWidth="3.5" 
                                        strokeDasharray="100" 
                                        strokeDashoffset={100 - mockScore}
                                        strokeLinecap="round"
                                        className="transition-all duration-75"
                                    />
                                </svg>
                                <FiShield className="absolute text-3xl text-[var(--brand-color)] animate-pulse" />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <span className="font-brand text-lg font-black text-[var(--text-primary)]">Human Verification Scan</span>
                                <span className="text-xs text-[var(--text-secondary)] font-mono">Calculated Authenticity: {mockScore}%</span>
                            </div>

                            {/* Processing sequence timeline indicators */}
                            <div className="flex flex-col gap-3 w-full bg-[var(--surface-color)] p-4 rounded-xl border border-[var(--border-color)]">
                                <div className="flex items-center gap-3 text-left">
                                    <FiLoader className={`text-xs ${scanStep >= 0 ? 'text-[var(--verified-color)] animate-spin' : 'text-[var(--text-muted)]'}`} />
                                    <span className={`text-xs font-semibold ${scanStep >= 0 ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>Ingesting content nodes...</span>
                                </div>
                                <div className="flex items-center gap-3 text-left">
                                    <FiLoader className={`text-xs ${scanStep >= 1 ? 'text-[var(--verified-color)] animate-spin' : 'text-[var(--text-muted)]'}`} />
                                    <span className={`text-xs font-semibold ${scanStep >= 1 ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>Evaluating perplexity vectors...</span>
                                </div>
                                <div className="flex items-center gap-3 text-left">
                                    <FiLoader className={`text-xs ${scanStep >= 2 ? 'text-[var(--verified-color)] animate-spin' : 'text-[var(--text-muted)]'}`} />
                                    <span className={`text-xs font-semibold ${scanStep >= 2 ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>Verifying behavioral fingerprints...</span>
                                </div>
                                <div className="flex items-center gap-3 text-left">
                                    <FiLoader className={`text-xs ${scanStep >= 3 ? 'text-[var(--verified-color)] animate-spin' : 'text-[var(--text-muted)]'}`} />
                                    <span className={`text-xs font-semibold ${scanStep >= 3 ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>Publishing transaction to feed...</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
