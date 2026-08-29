import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { 
  Fingerprint, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  User, 
  Sparkles,
  Compass,
  Users,
  MessageCircle,
  ArrowRight,
  CheckCircle2,
  X,
  KeyRound,
  RotateCw
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import api from '../services/api';
import Button from '../components/ui/Button';

export default function LandingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setAuth } = useAuthStore();

  // Mode: 'signin' | 'signup'
  const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'signin';
  const [mode, setMode] = useState(initialMode);

  // Sign In Form State
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  // Sign Up Form State
  const [regEmail, setRegEmail] = useState('');
  const [regDisplayName, setRegDisplayName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regLoading, setRegLoading] = useState(false);

  // OTP Verification Modal State
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [otpEmail, setOtpEmail] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Forgot Password Modal
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotStep, setForgotStep] = useState(1); // 1: Enter email, 2: Enter OTP & New Password
  const [forgotLoading, setForgotLoading] = useState(false);

  // Active Social Preview Mood Tab
  const [activeMood, setActiveMood] = useState(0);

  const moodPreviews = [
    {
      title: 'Creative Moments',
      tag: '#visuals',
      color: 'from-cyan-500/20 via-violet-500/20 to-coral-500/20',
      badge: '✨ Authentic Visuals',
      desc: 'High-fidelity photography, digital art & creative expression from real people.'
    },
    {
      title: 'Real Conversations',
      tag: '#community',
      color: 'from-violet-500/20 via-pink-500/20 to-orange-500/20',
      badge: '💬 Genuine Discourse',
      desc: 'Real conversations with real people. Pure community connection.'
    },
    {
      title: 'Thriving Circles',
      tag: '#technology',
      color: 'from-coral-500/20 via-amber-500/20 to-cyan-500/20',
      badge: '🌐 Niche Communities',
      desc: 'Discover and join spaces that share your passions in tech, design, music & culture.'
    }
  ];

  // Start Resend Timer Cooldown
  const startCooldown = (seconds = 60) => {
    setResendCooldown(seconds);
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Handle Real Sign In
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginIdentifier.trim() || !loginPassword) {
      return toast.error('Please enter your email/username and password');
    }

    try {
      setLoginLoading(true);
      const isEmail = loginIdentifier.includes('@');
      const res = await api.post('/auth/login', {
        email: isEmail ? loginIdentifier.trim().toLowerCase() : undefined,
        username: !isEmail ? loginIdentifier.trim().toLowerCase() : undefined,
        password: loginPassword
      });

      const { user, token } = res.data;
      setAuth(user, token);
      toast.success(`Welcome back, @${user.username}! ✨`);
      navigate('/feed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoginLoading(false);
    }
  };

  // Handle Real Sign Up (Sends 6-digit OTP)
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!regEmail.trim() || !regUsername.trim() || !regPassword) {
      return toast.error('Please fill in all required fields');
    }

    if (regPassword.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }

    try {
      setRegLoading(true);
      const cleanEmail = regEmail.trim().toLowerCase();
      const res = await api.post('/auth/register', {
        email: cleanEmail,
        displayName: regDisplayName.trim() || regUsername.trim(),
        username: regUsername.trim().toLowerCase().replace(/[^a-z0-9_]/g, ''),
        password: regPassword
      });

      setOtpEmail(cleanEmail);
      setOtpModalOpen(true);
      startCooldown(60);
      toast.success(res.data?.message || 'Verification code sent to your email!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed.');
    } finally {
      setRegLoading(false);
    }
  };

  // Handle OTP Submission
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otpValue.trim() || otpValue.trim().length !== 6) {
      return toast.error('Please enter the 6-digit code');
    }

    try {
      setOtpLoading(true);
      const res = await api.post('/auth/verify-otp', {
        email: otpEmail,
        otp: otpValue.trim(),
        type: 'register'
      });

      const { user, token } = res.data;
      setAuth(user, token);
      toast.success('Account verified! Welcome to HumanHub ✨');
      setOtpModalOpen(false);
      navigate('/feed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid or expired verification code');
    } finally {
      setOtpLoading(false);
    }
  };

  // Handle Resend OTP
  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;
    try {
      await api.post('/auth/resend-otp', { email: otpEmail, type: 'register' });
      startCooldown(60);
      toast.success('New verification code sent to your email.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend code');
    }
  };

  // Handle Forgot Password Step 1
  const handleForgotEmailSubmit = async (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      return toast.error('Please enter your email address');
    }

    try {
      setForgotLoading(true);
      await api.post('/auth/forgot-password', { email: forgotEmail.trim().toLowerCase() });
      setForgotStep(2);
      toast.success('Password reset code sent to your email.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Request failed');
    } finally {
      setForgotLoading(false);
    }
  };

  // Handle Forgot Password Step 2 (Reset)
  const handleForgotResetSubmit = async (e) => {
    e.preventDefault();
    if (!forgotOtp.trim() || !forgotNewPassword) {
      return toast.error('Please enter the code and new password');
    }

    try {
      setForgotLoading(true);
      await api.post('/auth/reset-password', {
        email: forgotEmail.trim().toLowerCase(),
        otp: forgotOtp.trim(),
        newPassword: forgotNewPassword
      });
      toast.success('Password reset successfully! You can now log in.');
      setForgotModalOpen(false);
      setForgotStep(1);
      setMode('signin');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)] selection:bg-[var(--accent)]/30 flex flex-col justify-between overflow-x-hidden relative">
      {/* Ambient backdrop glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-[var(--cyan)]/10 rounded-full blur-[140px]" />
        <div className="absolute top-1/2 -right-40 w-[550px] h-[550px] bg-[var(--accent)]/10 rounded-full blur-[160px]" />
        <div className="absolute -bottom-40 left-1/3 w-[500px] h-[500px] bg-[var(--violet)]/10 rounded-full blur-[150px]" />
      </div>

      {/* Main Container */}
      <div className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-10 max-w-6xl mx-auto w-full">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
          
          {/* ==================== LEFT COLUMN: VISUAL / SOCIAL PREVIEW AREA ==================== */}
          <div className="lg:col-span-7 flex flex-col space-y-6 select-none">
            
            {/* Top Brand statement */}
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--surface)] border border-[var(--border)] shadow-inner text-xs font-medium text-[var(--text-secondary)]">
                <Sparkles className="w-3.5 h-3.5 text-[var(--cyan)]" />
                <span className="tracking-wide">Modern Social Space</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)] animate-pulse" />
              </div>

              <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.15] text-[var(--text-primary)]">
                Share moments.<br />
                <span className="bg-gradient-to-r from-[var(--cyan)] via-[var(--violet)] to-[var(--accent)] bg-clip-text text-transparent">
                  Discover people.
                </span><br />
                Join communities.
              </h1>

              <p className="text-sm sm:text-base text-[var(--text-secondary)] max-w-lg leading-relaxed">
                An authentic social platform built around genuine moments, conversations, and thriving interest communities.
              </p>
            </div>

            {/* Dynamic Social Preview Collage */}
            <div className="relative rounded-3xl bg-[var(--surface)]/80 border border-[var(--border)] p-5 sm:p-6 shadow-2xl backdrop-blur-xl overflow-hidden group">
              <div className={`absolute inset-0 bg-gradient-to-br ${moodPreviews[activeMood].color} opacity-40 transition-all duration-500`} />

              <div className="relative z-10 space-y-4">
                {/* Mood Tabs */}
                <div className="flex items-center gap-2 pb-2 border-b border-[var(--border)]/60 overflow-x-auto">
                  {moodPreviews.map((preview, idx) => (
                    <button
                      key={preview.title}
                      onClick={() => setActiveMood(idx)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                        activeMood === idx
                          ? 'bg-[var(--surface-elevated)] text-[var(--text-primary)] border border-[var(--cyan)]/40 shadow-sm'
                          : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-elevated)]/50'
                      }`}
                    >
                      {preview.title}
                    </button>
                  ))}
                </div>

                {/* Abstract Visual Composition Card */}
                <div className="rounded-2xl bg-[var(--background)]/60 border border-[var(--border)] p-4 sm:p-5 relative overflow-hidden transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[var(--accent)] to-[var(--violet)] p-0.5 flex items-center justify-center shadow-md">
                        <div className="w-full h-full bg-[var(--background)] rounded-[10px] flex items-center justify-center">
                          <Fingerprint className="w-4 h-4 text-[var(--cyan)]" />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-[var(--text-primary)] tracking-wide">HumanHub Moments</span>
                        </div>
                        <span className="text-[11px] text-[var(--text-tertiary)]">{moodPreviews[activeMood].tag}</span>
                      </div>
                    </div>

                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--text-secondary)]">
                      {moodPreviews[activeMood].badge}
                    </span>
                  </div>

                  {/* Visual Content Matrix */}
                  <div className="grid grid-cols-3 gap-2.5 my-3">
                    <div className="h-20 sm:h-24 rounded-xl bg-gradient-to-br from-[var(--surface-elevated)] to-[var(--surface-muted)] border border-[var(--border)] flex flex-col justify-end p-2.5 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-tr from-[var(--cyan)]/20 to-transparent opacity-60" />
                      <span className="relative z-10 text-[10px] font-bold text-white/80">#vibes</span>
                    </div>
                    <div className="h-20 sm:h-24 rounded-xl bg-gradient-to-br from-[var(--surface-elevated)] to-[var(--surface-muted)] border border-[var(--border)] flex flex-col justify-end p-2.5 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-tr from-[var(--violet)]/20 to-transparent opacity-60" />
                      <span className="relative z-10 text-[10px] font-bold text-white/80">#creators</span>
                    </div>
                    <div className="h-20 sm:h-24 rounded-xl bg-gradient-to-br from-[var(--surface-elevated)] to-[var(--surface-muted)] border border-[var(--border)] flex flex-col justify-end p-2.5 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-tr from-[var(--accent)]/20 to-transparent opacity-60" />
                      <span className="relative z-10 text-[10px] font-bold text-white/80">#explore</span>
                    </div>
                  </div>

                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed pt-1">
                    {moodPreviews[activeMood].desc}
                  </p>
                </div>

                {/* Micro Highlights */}
                <div className="grid grid-cols-3 gap-3 pt-1">
                  <div className="p-2.5 rounded-2xl bg-[var(--background)]/40 border border-[var(--border)]/80 flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-[var(--cyan)]/10 text-[var(--cyan)]">
                      <Compass className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[11px] font-semibold text-[var(--text-primary)] truncate">Explore Feed</span>
                  </div>

                  <div className="p-2.5 rounded-2xl bg-[var(--background)]/40 border border-[var(--border)]/80 flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-[var(--violet)]/10 text-[var(--violet)]">
                      <Users className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[11px] font-semibold text-[var(--text-primary)] truncate">Communities</span>
                  </div>

                  <div className="p-2.5 rounded-2xl bg-[var(--background)]/40 border border-[var(--border)]/80 flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-[var(--accent)]/10 text-[var(--accent)]">
                      <MessageCircle className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[11px] font-semibold text-[var(--text-primary)] truncate">Direct Chat</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ==================== RIGHT COLUMN: AUTH CARD ==================== */}
          <div className="lg:col-span-5 w-full max-w-md mx-auto">
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
              
              {/* Brand Header */}
              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[var(--accent)] via-[var(--violet)] to-[var(--cyan)] p-0.5 shadow-lg mb-3">
                  <div className="w-full h-full bg-[var(--surface)] rounded-[14px] flex items-center justify-center">
                    <Fingerprint className="w-6 h-6 text-[var(--accent)]" />
                  </div>
                </div>

                <h2 className="font-display text-2xl font-extrabold tracking-tight text-[var(--text-primary)]">
                  Human<span className="text-[var(--accent)]">Hub</span>
                </h2>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  {mode === 'signin' ? 'Welcome back to your community' : 'Create your account'}
                </p>
              </div>

              {/* Mode Switcher */}
              <div className="grid grid-cols-2 p-1 rounded-2xl bg-[var(--background)] border border-[var(--border)] mb-5">
                <button
                  type="button"
                  onClick={() => setMode('signin')}
                  className={`py-2 text-xs font-bold rounded-xl transition-all ${
                    mode === 'signin'
                      ? 'bg-[var(--surface-elevated)] text-[var(--text-primary)] shadow-md border border-[var(--border)]'
                      : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className={`py-2 text-xs font-bold rounded-xl transition-all ${
                    mode === 'signup'
                      ? 'bg-[var(--surface-elevated)] text-[var(--text-primary)] shadow-md border border-[var(--border)]'
                      : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                  }`}
                >
                  Join HumanHub
                </button>
              </div>

              {/* ================= SIGN IN FORM ================= */}
              {mode === 'signin' && (
                <form onSubmit={handleLogin} className="space-y-3.5 animate-fade-in">
                  <div className="relative flex items-center">
                    <Mail className="absolute left-3.5 w-4 h-4 text-[var(--text-tertiary)] pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Email or username"
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      className="w-full bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--text-primary)] text-xs rounded-xl pl-10 pr-4 py-3 outline-none focus:border-[var(--accent)] transition-all placeholder:text-[var(--text-tertiary)]"
                      required
                    />
                  </div>

                  <div className="relative flex items-center">
                    <Lock className="absolute left-3.5 w-4 h-4 text-[var(--text-tertiary)] pointer-events-none" />
                    <input
                      type={showLoginPassword ? "text" : "password"}
                      placeholder="Password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--text-primary)] text-xs rounded-xl pl-10 pr-10 py-3 outline-none focus:border-[var(--accent)] transition-all placeholder:text-[var(--text-tertiary)]"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3.5 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                      tabIndex={-1}
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="flex justify-end pt-0.5">
                    <button
                      type="button"
                      onClick={() => { setForgotModalOpen(true); setForgotStep(1); }}
                      className="text-[11px] font-medium text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>

                  <Button
                    type="submit"
                    disabled={loginLoading || !loginIdentifier || !loginPassword}
                    isLoading={loginLoading}
                    variant="primary"
                    size="md"
                    className="w-full mt-2 font-bold shadow-lg"
                    icon={ArrowRight}
                  >
                    Enter Feed
                  </Button>
                </form>
              )}

              {/* ================= SIGN UP FORM ================= */}
              {mode === 'signup' && (
                <form onSubmit={handleRegister} className="space-y-3 animate-fade-in">
                  <div className="relative flex items-center">
                    <Mail className="absolute left-3.5 w-4 h-4 text-[var(--text-tertiary)] pointer-events-none" />
                    <input
                      type="email"
                      placeholder="Email address"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="w-full bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--text-primary)] text-xs rounded-xl pl-10 pr-4 py-2.5 outline-none focus:border-[var(--accent)] transition-all placeholder:text-[var(--text-tertiary)]"
                      required
                    />
                  </div>

                  <div className="relative flex items-center">
                    <User className="absolute left-3.5 w-4 h-4 text-[var(--text-tertiary)] pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Display Name (e.g. Alex Rivera)"
                      value={regDisplayName}
                      onChange={(e) => setRegDisplayName(e.target.value)}
                      className="w-full bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--text-primary)] text-xs rounded-xl pl-10 pr-4 py-2.5 outline-none focus:border-[var(--accent)] transition-all placeholder:text-[var(--text-tertiary)]"
                    />
                  </div>

                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-[var(--text-tertiary)] text-xs font-mono font-bold pointer-events-none">@</span>
                    <input
                      type="text"
                      placeholder="username"
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      className="w-full bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--text-primary)] text-xs rounded-xl pl-10 pr-4 py-2.5 outline-none focus:border-[var(--accent)] transition-all placeholder:text-[var(--text-tertiary)]"
                      required
                    />
                  </div>

                  <div className="relative flex items-center">
                    <Lock className="absolute left-3.5 w-4 h-4 text-[var(--text-tertiary)] pointer-events-none" />
                    <input
                      type={showRegPassword ? "text" : "password"}
                      placeholder="Create password (6+ chars)"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="w-full bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--text-primary)] text-xs rounded-xl pl-10 pr-10 py-2.5 outline-none focus:border-[var(--accent)] transition-all placeholder:text-[var(--text-tertiary)]"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-3.5 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                      tabIndex={-1}
                    >
                      {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  <Button
                    type="submit"
                    disabled={regLoading || !regEmail || !regUsername || !regPassword}
                    isLoading={regLoading}
                    variant="primary"
                    size="md"
                    className="w-full mt-2 font-bold shadow-lg"
                    icon={Sparkles}
                  >
                    Send Verification Code
                  </Button>
                </form>
              )}

              {/* Privacy & Community Note */}
              <div className="mt-5 pt-4 border-t border-[var(--border)]/60 text-center">
                <p className="text-[11px] text-[var(--text-tertiary)] leading-relaxed">
                  By continuing, you agree to HumanHub's{' '}
                  <span className="text-[var(--text-secondary)] font-medium">Community Guidelines</span> &{' '}
                  <span className="text-[var(--text-secondary)] font-medium">Privacy Policy</span>.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-6xl mx-auto px-6 py-6 border-t border-[var(--border)]/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[var(--text-tertiary)]">
        <div className="flex items-center gap-2">
          <Fingerprint className="w-3.5 h-3.5 text-[var(--accent)]" />
          <span>© {new Date().getFullYear()} HumanHub. Organic Social Platform.</span>
        </div>

        <div className="flex items-center gap-5">
          <button onClick={() => setMode('signin')} className="hover:text-[var(--text-primary)] transition-colors">Sign In</button>
          <button onClick={() => setMode('signup')} className="hover:text-[var(--text-primary)] transition-colors">Join</button>
        </div>
      </footer>

      {/* ================= OTP VERIFICATION MODAL ================= */}
      {otpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 sm:p-7 max-w-sm w-full shadow-2xl relative">
            <button
              onClick={() => setOtpModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-xl text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)]"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex flex-col items-center text-center mb-5">
              <div className="w-12 h-12 rounded-2xl bg-[var(--cyan)]/10 border border-[var(--cyan)]/20 flex items-center justify-center text-[var(--cyan)] mb-3">
                <KeyRound className="w-6 h-6" />
              </div>
              <h3 className="font-display text-lg font-bold text-[var(--text-primary)]">Enter Verification Code</h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-[260px]">
                We sent a 6-digit code to <span className="font-semibold text-[var(--cyan)]">{otpEmail}</span>
              </p>
            </div>

            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <input
                type="text"
                maxLength={6}
                placeholder="123456"
                value={otpValue}
                onChange={(e) => setOtpValue(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full text-center tracking-[10px] font-mono text-2xl font-extrabold bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl py-3 outline-none focus:border-[var(--cyan)]"
                autoFocus
                required
              />

              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full"
                isLoading={otpLoading}
                disabled={otpLoading || otpValue.length !== 6}
              >
                Verify & Enter HumanHub
              </Button>
            </form>

            <div className="flex items-center justify-between text-xs text-[var(--text-tertiary)] pt-4 mt-2 border-t border-[var(--border)]">
              <span>Didn't receive code?</span>
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={resendCooldown > 0}
                className={`font-semibold transition-colors flex items-center gap-1 ${
                  resendCooldown > 0 ? 'text-[var(--text-tertiary)] cursor-not-allowed' : 'text-[var(--accent)] hover:underline'
                }`}
              >
                <RotateCw className={`w-3 h-3 ${resendCooldown > 0 ? 'animate-spin' : ''}`} />
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= FORGOT PASSWORD MODAL ================= */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 sm:p-7 max-w-sm w-full shadow-2xl relative">
            <button
              onClick={() => setForgotModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-xl text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)]"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex flex-col items-center text-center mb-4">
              <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center text-[var(--accent)] mb-2">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="font-display text-lg font-bold text-[var(--text-primary)]">
                {forgotStep === 1 ? 'Reset Password' : 'Enter New Password'}
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                {forgotStep === 1 ? 'Enter your email to receive a 6-digit recovery code.' : 'Enter the code sent to your email and your new password.'}
              </p>
            </div>

            {forgotStep === 1 ? (
              <form onSubmit={handleForgotEmailSubmit} className="space-y-3">
                <div className="relative flex items-center">
                  <Mail className="absolute left-3.5 w-4 h-4 text-[var(--text-tertiary)] pointer-events-none" />
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--text-primary)] text-xs rounded-xl pl-10 pr-4 py-2.5 outline-none focus:border-[var(--accent)] placeholder:text-[var(--text-tertiary)]"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="w-full"
                  isLoading={forgotLoading}
                >
                  Send Reset Code
                </Button>
              </form>
            ) : (
              <form onSubmit={handleForgotResetSubmit} className="space-y-3">
                <input
                  type="text"
                  maxLength={6}
                  placeholder="6-digit code"
                  value={forgotOtp}
                  onChange={(e) => setForgotOtp(e.target.value)}
                  className="w-full text-center tracking-widest font-mono text-base font-bold bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl py-2 outline-none focus:border-[var(--accent)]"
                  required
                />

                <input
                  type="password"
                  placeholder="New password (6+ chars)"
                  value={forgotNewPassword}
                  onChange={(e) => setForgotNewPassword(e.target.value)}
                  className="w-full bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--text-primary)] text-xs rounded-xl px-4 py-2.5 outline-none focus:border-[var(--accent)]"
                  required
                />

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="w-full"
                  isLoading={forgotLoading}
                >
                  Confirm New Password
                </Button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
