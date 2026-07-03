import { useState } from 'react';
import { register } from '../services/authService';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';

export default function RegisterPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ username: '', email: '', password: '' });

    const onSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await register(formData);
            toast.success('Account created! Please log in.');
            navigate('/login');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div 
            className="w-full flex items-center justify-center p-4 relative"
            style={{ minHeight: '100vh', background: 'var(--bg-color)' }}
        >
            {/* Ambient background glow elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[350px] h-[350px] bg-[#0095F6]/10 rounded-full blur-[90px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[350px] h-[350px] bg-purple-500/10 rounded-full blur-[90px] pointer-events-none" />

            <motion.div 
                initial={{ opacity: 0, scale: 0.98, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
                className="w-full max-w-[920px] rounded-[28px] overflow-hidden flex flex-col md:flex-row shadow-2xl relative z-10"
                style={{ 
                    background: 'var(--glass-bg)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid var(--glass-border)',
                }}
            >
                {/* Left panel: Mission banner */}
                <div 
                    className="w-full md:w-[380px] p-10 md:p-12 flex flex-col justify-between relative overflow-hidden"
                    style={{
                        background: 'linear-gradient(135deg, var(--brand-color) 0%, #7e22ce 100%)',
                    }}
                >
                    <div className="relative z-10 flex flex-col gap-6">
                        <svg viewBox="0 0 100 100" width="56" height="56" className="drop-shadow-lg">
                            <circle cx="50" cy="50" r="48" fill="white" />
                            <path d="M50 20 L50 80 M20 50 L80 50" stroke="var(--brand-color)" strokeWidth="9" strokeLinecap="round" />
                        </svg>
                        <div className="flex flex-col gap-3">
                            <h1 className="font-brand text-3xl font-black text-white leading-tight tracking-tight">
                                Start Your <br/>Human Journey.
                            </h1>
                            <p className="text-xs font-semibold leading-relaxed text-white/85 max-w-xs">
                                Join 1M+ verified humans sharing authentic posts in an AI-free ecosystem.
                            </p>
                        </div>
                    </div>
                    <div className="relative z-10 flex items-center gap-2 mt-8 md:mt-0">
                         <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_12px_#34d399] animate-pulse"></div>
                         <span className="text-[10px] text-white font-extrabold uppercase tracking-widest">Secured by HumanHub-AI™</span>
                    </div>
                </div>

                {/* Right panel: Inputs Form fields */}
                <div className="flex-1 p-8 md:p-14 bg-transparent flex flex-col justify-center">
                    <div className="mb-8">
                        <h2 className="text-xl md:text-2xl font-black font-brand tracking-tight text-[var(--text-primary)] mb-1">
                            Create Account
                        </h2>
                        <p className="text-xs text-[var(--text-secondary)] font-medium">
                            Already a member?{' '}
                            <Link to="/login" className="text-[var(--brand-color)] hover:underline font-bold">Log In</Link>
                        </p>
                    </div>

                    <form onSubmit={onSubmit} className="flex flex-col gap-5">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Username</label>
                            <input
                                required
                                type="text"
                                placeholder="@HUMAN_CREATOR"
                                value={formData.username}
                                onChange={e => setFormData({ ...formData, username: e.target.value })}
                                className="premium-input text-xs font-semibold"
                            />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Email Address</label>
                            <input
                                required
                                type="email"
                                placeholder="human@example.com"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                className="premium-input text-xs font-semibold"
                            />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Secret Password</label>
                            <input
                                required
                                type="password"
                                placeholder="••••••••••••"
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                className="premium-input text-xs font-semibold"
                            />
                        </div>

                        <p className="text-[10.5px] text-[var(--text-muted)] leading-relaxed">
                           HumanHub uses real-time biological verification cues to ensure authentic human interaction. Your data is encrypted and protected.
                        </p>

                        <button 
                            type="submit" 
                            disabled={loading} 
                            className="btn-premium w-full mt-2 py-3 text-xs uppercase tracking-wider font-extrabold"
                        >
                            {loading ? 'Initiating...' : 'Create Identity'}
                        </button>

                        <div className="text-[10.5px] text-[var(--text-muted)] text-center leading-relaxed mt-2">
                            By joining, you agree to our <span className="text-[var(--text-secondary)] font-bold cursor-pointer hover:underline">User Agreement</span>.
                        </div>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}
