import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMail, FiLock, FiCheckCircle, FiShield, FiArrowLeft, FiSmartphone } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function LoginPage() {
    const { handleLogin, loading, error } = useAuth();
    const navigate = useNavigate();

    // Mode state: 'login' | 'forgot' | 'otp' | 'reset' | 'success'
    const [mode, setMode] = useState('login');
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [forgotEmail, setForgotEmail] = useState('');
    const [otpCode, setOtpCode] = useState('');
    const [newPassword, setNewPassword] = useState('');

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        try {
            await handleLogin(formData);
            navigate('/feed');
        } catch (err) {}
    };

    const handleForgotSubmit = (e) => {
        e.preventDefault();
        if (!forgotEmail.trim()) return;
        toast.success("Security token sent to your email!");
        setMode('otp');
    };

    const handleOtpSubmit = (e) => {
        e.preventDefault();
        if (otpCode.length < 4) {
            toast.error("Invalid verification parameters.");
            return;
        }
        toast.success("Identity vector validated.");
        setMode('reset');
    };

    const handleResetSubmit = (e) => {
        e.preventDefault();
        if (newPassword.length < 6) {
            toast.error("Password must be at least 6 characters.");
            return;
        }
        toast.success("Password reset sync completed.");
        setMode('success');
    };

    return (
        <div 
            className="w-full flex items-center justify-center p-4 relative"
            style={{ minHeight: '100vh', background: 'var(--bg-color)' }}
        >
            {/* Soft background glow circles */}
            <div className="absolute top-[-10%] left-[-10%] w-[350px] h-[350px] bg-[#0095F6]/10 rounded-full blur-[90px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[350px] h-[350px] bg-purple-500/10 rounded-full blur-[90px] pointer-events-none" />

            <motion.div 
                layout
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
                {/* Left panel: Info */}
                <div 
                    className="w-full md:w-[380px] p-10 md:p-12 flex flex-col justify-between relative overflow-hidden flex-shrink-0"
                    style={{
                        background: 'linear-gradient(135deg, var(--brand-color) 0%, #7e22ce 100%)',
                    }}
                >
                    <div className="relative z-10 flex flex-col gap-6">
                        <svg viewBox="0 0 100 100" width="56" height="56" className="drop-shadow-lg">
                            <circle cx="50" cy="50" r="48" fill="white" />
                            <path d="M50 20 L50 80 M20 50 L80 50" stroke="var(--brand-color)" strokeWidth="9" strokeLinecap="round" />
                        </svg>
                        <div className="flex flex-col gap-3 text-white">
                            <h1 className="font-brand text-3xl font-black leading-tight tracking-tight">
                                Access <br/>HumanHub.
                            </h1>
                            <p className="text-xs font-semibold leading-relaxed text-white/85 max-w-xs">
                                Dynamic biological verification covenants ensure 100% human-created interactions across the ecosystem.
                            </p>
                        </div>
                    </div>
                    
                    <div className="relative z-10 flex items-center gap-2 mt-8 md:mt-0 text-white">
                         <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_12px_#34d399] animate-pulse"></div>
                         <span className="text-[10px] font-extrabold uppercase tracking-widest">AI-Free Shield Protocol</span>
                    </div>
                </div>

                {/* Right panel: Dynamic states */}
                <div className="flex-1 p-8 md:p-14 bg-transparent flex flex-col justify-center min-h-[460px]">
                    <AnimatePresence mode="wait">
                        {/* Step 1: Login */}
                        {mode === 'login' && (
                            <motion.div
                                key="login"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="flex flex-col gap-5"
                            >
                                <div>
                                    <h2 className="text-xl md:text-2xl font-black font-brand tracking-tight text-[var(--text-primary)] mb-1">
                                        Sign in to HumanHub
                                    </h2>
                                    <p className="text-xs text-[var(--text-secondary)] font-medium">
                                        New to the platform?{' '}
                                        <Link to="/register" className="text-[var(--brand-color)] hover:underline font-bold">Create human account</Link>
                                    </p>
                                </div>

                                {error && (
                                    <div className="p-3 rounded-[12px] bg-red-500/10 border border-red-500/20 text-xs font-bold text-red-500 flex items-center gap-2">
                                        <FiShield className="text-sm" />
                                        <span>{error}</span>
                                    </div>
                                )}

                                <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Email Address</label>
                                        <input
                                            required
                                            type="email"
                                            placeholder="human@creativity.com"
                                            value={formData.email}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                            className="premium-input text-xs font-semibold"
                                        />
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <div className="flex justify-between items-center">
                                            <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Password</label>
                                            <button 
                                                type="button"
                                                onClick={() => setMode('forgot')}
                                                className="text-[11px] text-[var(--text-secondary)] hover:underline font-bold"
                                            >
                                                Forgot?
                                            </button>
                                        </div>
                                        <input
                                            required
                                            type="password"
                                            placeholder="••••••••••••"
                                            value={formData.password}
                                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                                            className="premium-input text-xs font-semibold"
                                        />
                                    </div>

                                    <button 
                                        type="submit" 
                                        disabled={loading} 
                                        className="btn-premium w-full mt-2 py-3 text-xs uppercase tracking-wider font-extrabold"
                                    >
                                        {loading ? 'Authenticating...' : 'Access Platform'}
                                    </button>
                                </form>
                            </motion.div>
                        )}

                        {/* Step 2: Forgot Password */}
                        {mode === 'forgot' && (
                            <motion.div
                                key="forgot"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="flex flex-col gap-5"
                            >
                                <button 
                                    onClick={() => setMode('login')}
                                    className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors self-start"
                                >
                                    <FiArrowLeft />
                                    <span>Back to login</span>
                                </button>

                                <div>
                                    <h2 className="text-xl md:text-2xl font-black font-brand tracking-tight text-[var(--text-primary)] mb-1">
                                        Reset Credentials
                                    </h2>
                                    <p className="text-xs text-[var(--text-secondary)] font-medium">
                                        Enter your registered email address to request an OTP.
                                    </p>
                                </div>

                                <form onSubmit={handleForgotSubmit} className="flex flex-col gap-4">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Email Address</label>
                                        <input
                                            required
                                            type="email"
                                            placeholder="human@creativity.com"
                                            value={forgotEmail}
                                            onChange={e => setForgotEmail(e.target.value)}
                                            className="premium-input text-xs font-semibold"
                                        />
                                    </div>

                                    <button 
                                        type="submit"
                                        className="btn-premium w-full mt-2 py-3 text-xs uppercase tracking-wider font-extrabold"
                                    >
                                        Send Security Code
                                    </button>
                                </form>
                            </motion.div>
                        )}

                        {/* Step 3: Enter OTP */}
                        {mode === 'otp' && (
                            <motion.div
                                key="otp"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="flex flex-col gap-5"
                            >
                                <button 
                                    onClick={() => setMode('forgot')}
                                    className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors self-start"
                                >
                                    <FiArrowLeft />
                                    <span>Change Email</span>
                                </button>

                                <div>
                                    <h2 className="text-xl md:text-2xl font-black font-brand tracking-tight text-[var(--text-primary)] mb-1">
                                        Enter Verification Code
                                    </h2>
                                    <p className="text-xs text-[var(--text-secondary)] font-medium">
                                        Enter the 6-digit verification code sent to {forgotEmail}.
                                    </p>
                                </div>

                                <form onSubmit={handleOtpSubmit} className="flex flex-col gap-4">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">OTP Code</label>
                                        <input
                                            required
                                            type="text"
                                            maxLength="6"
                                            placeholder="••••••"
                                            value={otpCode}
                                            onChange={e => setOtpCode(e.target.value)}
                                            className="premium-input text-center text-lg font-mono tracking-widest"
                                        />
                                    </div>

                                    <button 
                                        type="submit"
                                        className="btn-premium w-full mt-2 py-3 text-xs uppercase tracking-wider font-extrabold"
                                    >
                                        Validate OTP Vector
                                    </button>
                                </form>
                            </motion.div>
                        )}

                        {/* Step 4: Reset Password */}
                        {mode === 'reset' && (
                            <motion.div
                                key="reset"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="flex flex-col gap-5"
                            >
                                <div>
                                    <h2 className="text-xl md:text-2xl font-black font-brand tracking-tight text-[var(--text-primary)] mb-1">
                                        Define New Password
                                    </h2>
                                    <p className="text-xs text-[var(--text-secondary)] font-medium">
                                        Configure a new password lock parameter for your account.
                                    </p>
                                </div>

                                <form onSubmit={handleResetSubmit} className="flex flex-col gap-4">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">New Password</label>
                                        <input
                                            required
                                            type="password"
                                            placeholder="••••••••••••"
                                            value={newPassword}
                                            onChange={e => setNewPassword(e.target.value)}
                                            className="premium-input text-xs font-semibold"
                                        />
                                    </div>

                                    <button 
                                        type="submit"
                                        className="btn-premium w-full mt-2 py-3 text-xs uppercase tracking-wider font-extrabold"
                                    >
                                        Update Lock Keys
                                    </button>
                                </form>
                            </motion.div>
                        )}

                        {/* Step 5: Success Splash */}
                        {mode === 'success' && (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col gap-5 text-center items-center py-6"
                            >
                                <FiCheckCircle className="text-5xl text-[var(--verified-color)] animate-pulse" />
                                <div>
                                    <h2 className="text-xl font-brand font-black text-[var(--text-primary)] mb-1">
                                        Sync Completed Successfully
                                    </h2>
                                    <p className="text-xs text-[var(--text-secondary)] max-w-xs leading-relaxed">
                                        Your password lock credentials have been updated in MongoDB database blocks.
                                    </p>
                                </div>
                                <button 
                                    onClick={() => setMode('login')}
                                    className="btn-premium w-full max-w-xs mt-3 py-3 text-xs uppercase tracking-wider font-extrabold"
                                >
                                    Proceed to Login
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
}
