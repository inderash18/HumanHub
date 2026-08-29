import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../components/ui/Button';
import { FiUser, FiHash, FiUserPlus, FiBell, FiCheckCircle } from 'react-icons/fi';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function OnboardingPage() {
    const { user, setUser } = useAuthStore();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [interests, setInterests] = useState([]);
    const [creators, setCreators] = useState([]);

    // Step 1 States: Setup Profile
    const [bio, setBio] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');

    // Step 2 States: Interests Selection
    const [selectedInterests, setSelectedInterests] = useState([]);

    // Step 3 States: Follows
    const [followedCreators, setFollowedCreators] = useState([]);

    // Step 4 States: Alerts Mock Check
    const [alertsEnabled, setAlertsEnabled] = useState(false);

    useEffect(() => {
        const fetchOnboardingMeta = async () => {
            try {
                const commRes = await api.get('/communities');
                const comms = commRes.data || [];
                setInterests(comms.map(c => `#${c.slug}`));
                
                const creatorsRes = await api.get('/users/suggested/list');
                setCreators(creatorsRes.data || []);
            } catch (e) {
                console.error(e);
            }
        };
        fetchOnboardingMeta();
    }, []);

    const toggleInterest = (tag) => {
        setSelectedInterests(prev => 
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        );
    };

    const toggleFollow = async (creatorId, username) => {
        try {
            const res = await api.post(`/users/${creatorId}/follow`);
            setFollowedCreators(prev =>
                prev.includes(creatorId) ? prev.filter(id => id !== creatorId) : [...prev, creatorId]
            );
            toast.success(res.data.isFollowing ? `Following @${username}` : `Unfollowed @${username}`);
        } catch (e) {
            console.error(e);
            toast.error("Failed to follow.");
        }
    };

    const handleNext = () => {
        setStep(prev => prev + 1);
    };

    const handleFinish = async () => {
        try {
            const res = await api.put('/users/me', {
                bio,
                avatar: avatarUrl || user?.avatar
            });
            setUser({
                ...user,
                bio: res.data.bio,
                avatar: res.data.avatar
            });
            toast.success("Welcome to HumanHub! ✨");
            navigate('/feed');
        } catch (err) {
            console.error(err);
            toast.error("Failed to finalize profile.");
        }
    };

    return (
        <div 
            className="w-full flex items-center justify-center p-4 relative"
            style={{ minHeight: '100vh', background: 'var(--bg-color)' }}
        >
            {/* Background elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[350px] h-[350px] bg-[#0095F6]/10 rounded-full blur-[90px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[350px] h-[350px] bg-purple-500/10 rounded-full blur-[90px] pointer-events-none" />

            <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-lg p-6 md:p-8 rounded-[28px] overflow-hidden flex flex-col gap-6 relative z-10 shadow-2xl"
                style={{ 
                    background: 'var(--glass-bg)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid var(--glass-border)',
                }}
            >
                {/* Steps Header Counter */}
                <div className="flex justify-between items-center border-b border-[var(--border-color)] pb-3 select-none">
                    <span className="text-[9px] font-extrabold uppercase tracking-widest text-[var(--text-secondary)]">Onboarding Protocol</span>
                    <span className="text-[10px] font-mono text-[var(--brand-color)] font-extrabold">Step {step} of 5</span>
                </div>

                <AnimatePresence mode="wait">
                    {/* Step 1: Profile Initialization */}
                    {step === 1 && (
                        <motion.div 
                            key="step1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="flex flex-col gap-5"
                        >
                            <div className="flex flex-col gap-1">
                                <h2 className="text-lg font-black font-brand text-[var(--text-primary)]">Initialize Profile</h2>
                                <p className="text-[11px] text-[var(--text-secondary)]">Define your digital identifier avatar and bio.</p>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-secondary)]">Avatar Image URL</label>
                                <input 
                                    type="text"
                                    value={avatarUrl}
                                    onChange={e => setAvatarUrl(e.target.value)}
                                    placeholder="https://example.com/photo.jpg"
                                    className="premium-input text-xs font-semibold"
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-secondary)]">Short Bio</label>
                                <textarea 
                                    value={bio}
                                    onChange={e => setBio(e.target.value)}
                                    placeholder="Tell the community about your human interests..."
                                    className="premium-input text-xs font-semibold min-h-[90px] resize-none"
                                />
                            </div>

                            <Button onClick={handleNext} className="w-full mt-2 text-xs uppercase tracking-wider font-extrabold">
                                Continue
                            </Button>
                        </motion.div>
                    )}

                    {/* Step 2: Choose Interests */}
                    {step === 2 && (
                        <motion.div 
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="flex flex-col gap-5"
                        >
                            <div className="flex flex-col gap-1">
                                <h2 className="text-lg font-black font-brand text-[var(--text-primary)]">Select Interests</h2>
                                <p className="text-[11px] text-[var(--text-secondary)]">Curate your feed with verified topics.</p>
                            </div>

                            <div className="flex flex-wrap gap-2 py-2 select-none">
                                {interests.map(tag => {
                                    const isSelected = selectedInterests.includes(tag);
                                    return (
                                        <motion.div 
                                            key={tag}
                                            onClick={() => toggleInterest(tag)}
                                            whileTap={{ scale: 0.95 }}
                                            className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold cursor-pointer transition-colors border ${
                                                isSelected 
                                                    ? 'bg-[var(--brand-color)] border-transparent text-white' 
                                                    : 'bg-[var(--surface-color)]/20 border-[var(--border-color)] text-[var(--text-primary)]'
                                            }`}
                                        >
                                            {tag}
                                        </motion.div>
                                    );
                                })}
                            </div>

                            <Button onClick={handleNext} className="w-full mt-2 text-xs uppercase tracking-wider font-extrabold">
                                Continue
                            </Button>
                        </motion.div>
                    )}

                    {/* Step 3: Follow Creators */}
                    {step === 3 && (
                        <motion.div 
                            key="step3"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="flex flex-col gap-5"
                        >
                            <div className="flex flex-col gap-1">
                                <h2 className="text-lg font-black font-brand text-[var(--text-primary)]">Follow Verified Creators</h2>
                                <p className="text-[11px] text-[var(--text-secondary)]">Connect with the top trusted human authors.</p>
                            </div>

                            <div className="flex flex-col gap-3">
                                {creators.map(creator => {
                                    const isFollowed = followedCreators.includes(creator._id);
                                    return (
                                        <div key={creator._id} className="flex items-center gap-3 p-2 bg-[var(--surface-color)]/30 border border-[var(--border-color)] rounded-[18px]">
                                            {creator.avatar ? (
                                                <img src={creator.avatar} alt="" className="w-9 h-9 rounded-full border border-[var(--border-color)] object-cover" />
                                            ) : (
                                                <div className="w-9 h-9 rounded-full bg-[var(--surface-hover)] border border-[var(--border-color)] flex items-center justify-center font-bold text-xs text-[var(--text-primary)] uppercase select-none">
                                                    {creator.username?.[0]}
                                                </div>
                                            )}
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-xs font-bold text-[var(--text-primary)] truncate">@{creator.username}</span>
                                                <span className="text-[9.5px] text-[var(--verified-color)] font-bold">Trust rating: {Math.round(creator.trustScore * 100)}%</span>
                                            </div>
                                            <button 
                                                onClick={() => toggleFollow(creator._id, creator.username)}
                                                className={`ml-auto text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider border transition-all ${
                                                    isFollowed 
                                                        ? 'bg-transparent border-[var(--border-color)] text-[var(--text-secondary)]' 
                                                        : 'bg-[var(--brand-color)] border-transparent text-white'
                                                }`}
                                            >
                                                {isFollowed ? 'Following' : 'Follow'}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>

                            <Button onClick={handleNext} className="w-full mt-2 text-xs uppercase tracking-wider font-extrabold">
                                Continue
                            </Button>
                        </motion.div>
                    )}

                    {/* Step 4: Notification Permissions */}
                    {step === 4 && (
                        <motion.div 
                            key="step4"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="flex flex-col gap-5 text-center items-center py-4"
                        >
                            <FiBell className="text-4xl text-[var(--brand-color)] animate-bounce" />
                            <div className="flex flex-col gap-1">
                                <h2 className="text-lg font-brand font-black text-[var(--text-primary)]">Enable Verification Alerts</h2>
                                <p className="text-[11px] text-[var(--text-secondary)] max-w-xs">
                                    Get notified immediately when your posts resolve successfully through the scanning pipeline.
                                </p>
                            </div>

                            <div className="flex gap-3 w-full mt-4">
                                <Button 
                                    onClick={() => {
                                        setAlertsEnabled(true);
                                        toast.success('Alert channels verified.');
                                        handleNext();
                                    }} 
                                    className="flex-1 text-xs font-extrabold"
                                >
                                    Enable Push Alerts
                                </Button>
                                <Button 
                                    onClick={handleNext} 
                                    variant="secondary"
                                    className="flex-1 text-xs font-extrabold"
                                >
                                    Skip for Now
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {/* Step 5: Onboarding Complete Success */}
                    {step === 5 && (
                        <motion.div 
                            key="step5"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col gap-5 text-center items-center py-4"
                        >
                            <FiCheckCircle className="text-5xl text-[var(--verified-color)]" />
                            <div className="flex flex-col gap-1">
                                <h2 className="text-xl font-brand font-black text-[var(--text-primary)]">Identity Clearance Approved</h2>
                                <p className="text-[11px] text-[var(--text-secondary)] max-w-xs">
                                    Your biological credentials have cleared the setup blocks. Welcome to HumanHub.
                                </p>
                            </div>

                            <Button onClick={handleFinish} className="w-full mt-4 text-xs uppercase tracking-wider font-extrabold">
                                Enter System Feed
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}
