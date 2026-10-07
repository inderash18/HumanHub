import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Lock, 
  Mail, 
  User, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  KeyRound, 
  ShieldCheck, 
  X,
  Leaf
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '../store/useAuthStore';
import api from '../services/api';

export default function LandingPage({ initialMode }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login, register: registerUser, verifyMfa, isAuthenticated } = useAuthStore();

  const queryMode = searchParams.get('mode');
  const [mode, setMode] = useState(
    initialMode || (queryMode === 'signin' ? 'signin' : 'signup')
  );

  // Sign In Form State
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  // MFA Modal State
  const [mfaModalOpen, setMfaModalOpen] = useState(false);
  const [mfaChallengeId, setMfaChallengeId] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [isBackupCode, setIsBackupCode] = useState(false);
  const [mfaLoading, setMfaLoading] = useState(false);

  // Sign Up Form State
  const [regEmail, setRegEmail] = useState('');
  const [regDisplayName, setRegDisplayName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regLoading, setRegLoading] = useState(false);

  // OTP Verification Modal State
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [otpEmail, setOtpEmail] = useState('');
  const [otpValue, setOtpValue] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Forgot Password Modal State
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotLoading, setForgotLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/feed', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (queryMode === 'signup' || queryMode === 'signin') {
      setMode(queryMode);
    }
  }, [queryMode]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const toggleMode = (targetMode) => {
    setMode(targetMode);
    setSearchParams({ mode: targetMode });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginIdentifier.trim() || !loginPassword) {
      toast.error('Please enter your username/email and password');
      return;
    }

    try {
      setLoginLoading(true);
      const res = await login(loginIdentifier.trim(), loginPassword);
      if (res?.mfaRequired) {
        setMfaChallengeId(res.challengeId);
        setMfaModalOpen(true);
        return;
      }
      toast.success('Welcome back!');
      navigate('/feed');
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please check your credentials.';
      toast.error(msg);
      if (err.response?.data?.requiresVerification) {
        setOtpEmail(loginIdentifier.trim());
        setOtpModalOpen(true);
      }
    } finally {
      setLoginLoading(false);
    }
  };

  const handleVerifyMfa = async (e) => {
    e.preventDefault();
    if (!mfaCode.trim()) {
      toast.error('Please enter your authentication code');
      return;
    }

    try {
      setMfaLoading(true);
      await verifyMfa(mfaChallengeId, mfaCode.trim(), isBackupCode);
      toast.success('Two-factor authentication verified!');
      setMfaModalOpen(false);
      navigate('/feed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid or expired authentication code');
    } finally {
      setMfaLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!regEmail.trim() || !regPassword) {
      toast.error('Please enter your email and password');
      return;
    }

    const username = regUsername.trim().toLowerCase() || regEmail.trim().split('@')[0].replace(/[^a-z0-9_.]/g, '').slice(0, 20);
    const displayName = regDisplayName.trim() || username;

    try {
      setRegLoading(true);
      const res = await registerUser({
        email: regEmail.trim(),
        username: username,
        displayName: displayName,
        password: regPassword
      });

      if (res?.success || res?.token) {
        toast.success('Welcome to HumanHub! Account created.');
        navigate('/feed');
        return;
      }

      toast.success('Account created!');
      navigate('/feed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setRegLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otpValue || otpValue.length !== 6) {
      toast.error('Please enter a valid 6-digit verification code');
      return;
    }

    try {
      setOtpLoading(true);
      const res = await api.post('/auth/verify-otp', {
        email: otpEmail,
        otp: otpValue.trim()
      });

      if (res.data?.token) {
        useAuthStore.getState().setAuth(res.data.user, res.data.token);
      }
      toast.success('Account verified!');
      setOtpModalOpen(false);
      navigate('/feed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid or expired verification code');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;
    try {
      await api.post('/auth/resend-otp', { email: otpEmail });
      toast.success('A fresh code has been sent!');
      setResendCooldown(60);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend code');
    }
  };

  const handleForgotEmailSubmit = async (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;

    try {
      setForgotLoading(true);
      await api.post('/auth/forgot-password', { email: forgotEmail.trim() });
      toast.success('Password recovery code sent!');
      setForgotStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Email not found');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleForgotResetSubmit = async (e) => {
    e.preventDefault();
    if (!forgotOtp || !forgotNewPassword) return;

    try {
      setForgotLoading(true);
      await api.post('/auth/reset-password', {
        email: forgotEmail.trim(),
        otp: forgotOtp.trim(),
        newPassword: forgotNewPassword
      });
      toast.success('Password reset successfully. Please log in.');
      setForgotModalOpen(false);
      toggleMode('signin');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleSocialClick = (provider) => {
    toast(`Continuing with ${provider}...`, {
      icon: '✨',
      style: {
        borderRadius: '12px',
        background: '#181210',
        color: '#fff',
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#e8ebf0] text-[#181210] flex items-center justify-center p-3 sm:p-6 md:p-8 selection:bg-[#e6a877]/40">
      
      {/* Outer Card Container with thick dark border frame */}
      <div className="w-full max-w-[1040px] bg-[#181210] p-2.5 sm:p-3.5 rounded-[32px] sm:rounded-[40px] md:rounded-[46px] shadow-[0_30px_90px_-20px_rgba(20,15,12,0.38)] relative transition-all duration-300">
        
        {/* Inner 2-Column Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 sm:gap-3.5 relative min-h-[580px] lg:min-h-[640px]">
          
          {/* ================= LEFT HERO PANEL (Fixed Human Portrait) ================= */}
          <div className="relative overflow-hidden rounded-[24px] sm:rounded-[30px] md:rounded-[36px] min-h-[380px] sm:min-h-[460px] lg:min-h-full bg-neutral-900 group select-none">
            
            {/* Single Fixed Human Portrait */}
            <div className="absolute inset-0">
              <img
                src="/login_hero_portrait.jpg"
                alt="HumanHub Focus and Flow"
                className="w-full h-full object-cover object-center"
              />
              {/* Subtle warm sunset overlay filter */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10 pointer-events-none" />
            </div>

            {/* Bottom-Left Glass Badge: "Stay focused. Grow every day." */}
            <div className="absolute bottom-5 left-5 sm:bottom-7 sm:left-7 z-20">
              <div className="bg-black/40 hover:bg-black/50 backdrop-blur-md border border-white/20 text-white py-2.5 px-4 sm:py-3 sm:px-4.5 rounded-2xl flex items-center gap-3.5 shadow-2xl transition-all duration-300">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center text-amber-200 shrink-0">
                  <Leaf className="w-5 h-5 stroke-[1.8]" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="font-semibold text-xs sm:text-sm tracking-tight text-white leading-tight">
                    Stay focused.
                  </span>
                  <span className="text-[11px] sm:text-xs text-white/80 font-normal leading-tight mt-0.5">
                    Grow every day.
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* ================= CENTER ORGANIC WAIST NOTCH (Desktop Only) ================= */}
          <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none items-center justify-center">
            {/* Organic SVG droplet shape extending smoothly into the right card */}
            <div className="relative flex items-center justify-center">
              <svg
                width="84"
                height="120"
                viewBox="0 0 84 120"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="drop-shadow-sm filter"
              >
                <path
                  d="M0 0 C 0 35, 42 38, 42 60 C 42 82, 0 85, 0 120 Z"
                  fill="#181210"
                />
              </svg>

              {/* Fixed 3 Indicator Dots matching the mockup */}
              <div className="absolute left-[8px] flex items-center gap-1.5 pl-1 pointer-events-auto">
                <span className="w-4 h-1.5 bg-white rounded-full inline-block" />
                <span className="w-1.5 h-1.5 bg-[#544439] rounded-full inline-block" />
                <span className="w-1.5 h-1.5 bg-[#544439] rounded-full inline-block" />
              </div>
            </div>
          </div>

          {/* ================= RIGHT FORM PANEL ================= */}
          <div 
            className="relative overflow-hidden rounded-[24px] sm:rounded-[30px] md:rounded-[36px] p-6 sm:p-10 lg:p-12 flex flex-col justify-between"
            style={{
              background: 'linear-gradient(135deg, #f7d6ba 0%, #e9ab78 40%, #efbe91 75%, #f6d1b2 100%)'
            }}
          >
            {/* Top Switch Link */}
            <div className="flex items-center justify-end text-xs sm:text-[13px] text-[#5e493a] select-none">
              {mode === 'signup' ? (
                <div className="flex items-center gap-1.5">
                  <span>Already have an account?</span>
                  <button
                    type="button"
                    onClick={() => toggleMode('signin')}
                    className="font-semibold text-[#181210] hover:underline underline-offset-2 transition-colors cursor-pointer"
                  >
                    Log In
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span>Don't have an account?</span>
                  <button
                    type="button"
                    onClick={() => toggleMode('signup')}
                    className="font-semibold text-[#181210] hover:underline underline-offset-2 transition-colors cursor-pointer"
                  >
                    Sign Up
                  </button>
                </div>
              )}
            </div>

            {/* Middle Main Content Form Area */}
            <div className="my-auto py-6 sm:py-8 max-w-[390px] w-full mx-auto">
              
              {/* Header Titles */}
              <div className="mb-6 sm:mb-8 text-left">
                <h1 className="text-3xl sm:text-[38px] font-semibold text-[#181210] tracking-tight leading-tight">
                  {mode === 'signup' ? 'Build Your Flow' : 'Welcome Back'}
                </h1>
                <p className="text-xs sm:text-[13px] text-[#6e5543] mt-2 font-normal leading-relaxed">
                  {mode === 'signup' 
                    ? 'Create your account and get started with a clear mind' 
                    : 'Enter your credentials to continue your daily flow'}
                </p>
              </div>

              {/* Form Component */}
              {mode === 'signup' ? (
                /* ================= SIGN UP FORM ================= */
                <form onSubmit={handleRegister} className="space-y-3 sm:space-y-3.5">
                  
                  {/* Email Input */}
                  <div className="relative flex items-center">
                    <div className="absolute left-4 pointer-events-none text-[#7c6352]">
                      <Mail className="w-4 h-4 stroke-[1.8]" />
                    </div>
                    <input
                      type="email"
                      placeholder="Email Address"
                      autoComplete="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="w-full bg-white/20 hover:bg-white/30 focus:bg-white/35 border border-[#181210]/15 focus:border-[#181210]/40 rounded-2xl pl-11 pr-4 py-3 sm:py-3.5 text-xs sm:text-sm text-[#181210] placeholder:text-[#88705f] outline-none backdrop-blur-sm transition-all duration-200"
                      required
                    />
                  </div>

                  {/* Password Input */}
                  <div className="relative flex items-center">
                    <div className="absolute left-4 pointer-events-none text-[#7c6352]">
                      <Lock className="w-4 h-4 stroke-[1.8]" />
                    </div>
                    <input
                      type={showRegPassword ? "text" : "password"}
                      placeholder="Password"
                      autoComplete="new-password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="w-full bg-white/20 hover:bg-white/30 focus:bg-white/35 border border-[#181210]/15 focus:border-[#181210]/40 rounded-2xl pl-11 pr-11 py-3 sm:py-3.5 text-xs sm:text-sm text-[#181210] placeholder:text-[#88705f] outline-none backdrop-blur-sm transition-all duration-200"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-3.5 text-[#7c6352] hover:text-[#181210] p-1 transition-colors"
                      tabIndex={-1}
                      aria-label={showRegPassword ? "Hide password" : "Show password"}
                    >
                      {showRegPassword ? (
                        <Eye className="w-4 h-4 stroke-[1.8]" />
                      ) : (
                        <EyeOff className="w-4 h-4 stroke-[1.8]" />
                      )}
                    </button>
                  </div>

                  {/* Optional Username field */}
                  <div className="relative flex items-center">
                    <div className="absolute left-4 pointer-events-none text-[#7c6352]">
                      <User className="w-4 h-4 stroke-[1.8]" />
                    </div>
                    <input
                      type="text"
                      placeholder="Username (optional)"
                      autoComplete="username"
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      className="w-full bg-white/20 hover:bg-white/30 focus:bg-white/35 border border-[#181210]/15 focus:border-[#181210]/40 rounded-2xl pl-11 pr-4 py-3 sm:py-3.5 text-xs sm:text-sm text-[#181210] placeholder:text-[#88705f] outline-none backdrop-blur-sm transition-all duration-200"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={regLoading || !regEmail || !regPassword}
                    className="w-full bg-[#181210] hover:bg-[#28201b] disabled:opacity-50 text-white font-medium text-xs sm:text-sm py-3.5 sm:py-4 px-6 rounded-2xl flex items-center justify-center gap-2 shadow-md hover:shadow-xl transition-all duration-200 active:scale-[0.98] group mt-1 cursor-pointer"
                  >
                    <span>{regLoading ? 'Creating account...' : 'Sign Up'}</span>
                    <ArrowRight className="w-4 h-4 stroke-[2] group-hover:translate-x-1 transition-transform" />
                  </button>

                </form>
              ) : (
                /* ================= SIGN IN FORM ================= */
                <form onSubmit={handleLogin} className="space-y-3 sm:space-y-3.5">
                  
                  {/* Email / Username Input */}
                  <div className="relative flex items-center">
                    <div className="absolute left-4 pointer-events-none text-[#7c6352]">
                      <Mail className="w-4 h-4 stroke-[1.8]" />
                    </div>
                    <input
                      type="text"
                      placeholder="Email Address or Username"
                      autoComplete="username"
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      className="w-full bg-white/20 hover:bg-white/30 focus:bg-white/35 border border-[#181210]/15 focus:border-[#181210]/40 rounded-2xl pl-11 pr-4 py-3 sm:py-3.5 text-xs sm:text-sm text-[#181210] placeholder:text-[#88705f] outline-none backdrop-blur-sm transition-all duration-200"
                      required
                    />
                  </div>

                  {/* Password Input */}
                  <div className="relative flex items-center">
                    <div className="absolute left-4 pointer-events-none text-[#7c6352]">
                      <Lock className="w-4 h-4 stroke-[1.8]" />
                    </div>
                    <input
                      type={showLoginPassword ? "text" : "password"}
                      placeholder="Password"
                      autoComplete="current-password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full bg-white/20 hover:bg-white/30 focus:bg-white/35 border border-[#181210]/15 focus:border-[#181210]/40 rounded-2xl pl-11 pr-11 py-3 sm:py-3.5 text-xs sm:text-sm text-[#181210] placeholder:text-[#88705f] outline-none backdrop-blur-sm transition-all duration-200"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3.5 text-[#7c6352] hover:text-[#181210] p-1 transition-colors"
                      tabIndex={-1}
                      aria-label={showLoginPassword ? "Hide password" : "Show password"}
                    >
                      {showLoginPassword ? (
                        <Eye className="w-4 h-4 stroke-[1.8]" />
                      ) : (
                        <EyeOff className="w-4 h-4 stroke-[1.8]" />
                      )}
                    </button>
                  </div>

                  {/* Forgot Password Link */}
                  <div className="flex justify-end pt-0.5">
                    <button
                      type="button"
                      onClick={() => { setForgotModalOpen(true); setForgotStep(1); }}
                      className="text-[11px] sm:text-xs text-[#6e5543] hover:text-[#181210] hover:underline transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loginLoading || !loginIdentifier || !loginPassword}
                    className="w-full bg-[#181210] hover:bg-[#28201b] disabled:opacity-50 text-white font-medium text-xs sm:text-sm py-3.5 sm:py-4 px-6 rounded-2xl flex items-center justify-center gap-2 shadow-md hover:shadow-xl transition-all duration-200 active:scale-[0.98] group mt-1 cursor-pointer"
                  >
                    <span>{loginLoading ? 'Signing in...' : 'Sign In'}</span>
                    <ArrowRight className="w-4 h-4 stroke-[2] group-hover:translate-x-1 transition-transform" />
                  </button>

                </form>
              )}

              {/* "or continue with" Divider */}
              <div className="flex items-center gap-3 my-5 sm:my-6 select-none">
                <div className="flex-1 h-px bg-[#181210]/12" />
                <span className="text-[11px] sm:text-xs text-[#7c6352] font-normal">or continue with</span>
                <div className="flex-1 h-px bg-[#181210]/12" />
              </div>

              {/* Social Login 3-Pill Row */}
              <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                {/* Google */}
                <button
                  type="button"
                  onClick={() => handleSocialClick('Google')}
                  className="bg-white/25 hover:bg-white/40 border border-[#181210]/10 rounded-2xl py-2.5 px-3 flex items-center justify-center gap-2 text-xs font-semibold text-[#181210] backdrop-blur-sm transition-all duration-150 active:scale-95 shadow-sm"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Google</span>
                </button>

                {/* Apple */}
                <button
                  type="button"
                  onClick={() => handleSocialClick('Apple')}
                  className="bg-white/25 hover:bg-white/40 border border-[#181210]/10 rounded-2xl py-2.5 px-3 flex items-center justify-center gap-2 text-xs font-semibold text-[#181210] backdrop-blur-sm transition-all duration-150 active:scale-95 shadow-sm"
                >
                  <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.93-2.85-.9.04-2 .6-2.64 1.35-.56.65-1.06 1.71-.93 2.73 1.01.08 2.02-.48 2.64-1.23z" />
                  </svg>
                  <span>Apple</span>
                </button>

                {/* Telegram */}
                <button
                  type="button"
                  onClick={() => handleSocialClick('Telegram')}
                  className="bg-white/25 hover:bg-white/40 border border-[#181210]/10 rounded-2xl py-2.5 px-3 flex items-center justify-center gap-2 text-xs font-semibold text-[#181210] backdrop-blur-sm transition-all duration-150 active:scale-95 shadow-sm"
                >
                  <svg className="w-4 h-4 shrink-0 text-[#24A1DE] fill-current" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.19-.08-.05-.19-.02-.27 0-.12.03-2.02 1.28-5.7 3.77-.54.37-1.03.55-1.47.54-.48-.01-1.4-.27-2.09-.49-.84-.27-1.51-.42-1.45-.89.03-.25.38-.51 1.05-.78 4.12-1.79 6.87-2.97 8.24-3.55 3.93-1.63 4.74-1.92 5.28-1.93.12 0 .39.03.56.17.14.12.18.28.2.4.01.07.02.21.01.32z" />
                  </svg>
                  <span>Telegram</span>
                </button>
              </div>

            </div>

            {/* Bottom Disclaimer */}
            <div className="text-center select-none pt-2">
              <p className="text-[11px] sm:text-xs text-[#725946] leading-relaxed">
                By signing up, you agree to our{' '}
                <span className="text-[#181210] font-medium hover:underline cursor-pointer">
                  Terms of Service
                </span>{' '}
                and{' '}
                <span className="text-[#181210] font-medium hover:underline cursor-pointer">
                  Privacy Policy
                </span>
              </p>
            </div>

          </div>

        </div>

      </div>

      {/* ================= MFA 2FA MODAL ================= */}
      {mfaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#1e1713] border border-white/10 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl relative text-center text-white">
            <button
              onClick={() => setMfaModalOpen(false)}
              className="absolute top-4 right-4 text-white/60 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-4 text-amber-400">
              <ShieldCheck className="w-8 h-8 stroke-[1.5]" />
            </div>

            <h3 className="text-base font-semibold text-white mb-1">
              Two-Factor Authentication
            </h3>
            <p className="text-xs text-white/70 mb-6">
              {isBackupCode 
                ? 'Enter one of your 8-character recovery codes.' 
                : 'Enter the 6-digit code from your authenticator app.'}
            </p>

            <form onSubmit={handleVerifyMfa} className="space-y-4">
              <input
                type="text"
                maxLength={isBackupCode ? 10 : 6}
                placeholder={isBackupCode ? "Recovery Code" : "######"}
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value)}
                className="w-full text-center tracking-[6px] font-mono text-xl font-bold bg-black/40 border border-white/15 text-white rounded-xl py-3 outline-none focus:border-amber-400"
                autoFocus
                required
              />

              <button
                type="submit"
                disabled={mfaLoading || !mfaCode.trim()}
                className="w-full bg-gradient-to-r from-[#e9ab78] to-[#f6d1b2] text-[#181210] font-semibold text-sm py-3 rounded-xl hover:opacity-95 transition-opacity"
              >
                {mfaLoading ? 'Verifying...' : 'Verify & Sign In'}
              </button>
            </form>

            <div className="mt-4 pt-4 border-t border-white/10 text-xs">
              <button
                type="button"
                onClick={() => {
                  setIsBackupCode(!isBackupCode);
                  setMfaCode('');
                }}
                className="text-amber-300 hover:underline"
              >
                {isBackupCode ? 'Use Authenticator App Code' : 'Use a Backup Code'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= OTP VERIFICATION MODAL ================= */}
      {otpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#1e1713] border border-white/10 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl relative text-center text-white">
            <button
              onClick={() => setOtpModalOpen(false)}
              className="absolute top-4 right-4 text-white/60 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-4 text-amber-400">
              <KeyRound className="w-8 h-8 stroke-[1.5]" />
            </div>

            <h3 className="text-base font-semibold text-white mb-1">
              Confirm Your Email
            </h3>
            <p className="text-xs text-white/70 mb-6">
              Enter the 6-digit code sent to <span className="text-white font-medium">{otpEmail}</span>
            </p>

            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <input
                type="text"
                maxLength={6}
                placeholder="######"
                value={otpValue}
                onChange={(e) => setOtpValue(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full text-center tracking-[8px] font-mono text-xl font-bold bg-black/40 border border-white/15 text-white rounded-xl py-3 outline-none focus:border-amber-400"
                autoFocus
                required
              />

              <button
                type="submit"
                disabled={otpLoading || otpValue.length !== 6}
                className="w-full bg-gradient-to-r from-[#e9ab78] to-[#f6d1b2] text-[#181210] font-semibold text-sm py-3 rounded-xl hover:opacity-95 transition-opacity disabled:opacity-50"
              >
                {otpLoading ? 'Verifying...' : 'Confirm'}
              </button>
            </form>

            <div className="mt-4 pt-4 border-t border-white/10 text-xs">
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={resendCooldown > 0}
                className="text-amber-300 hover:underline disabled:opacity-50"
              >
                {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend Code'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= FORGOT PASSWORD MODAL ================= */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#1e1713] border border-white/10 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl relative text-center text-white">
            <button
              onClick={() => setForgotModalOpen(false)}
              className="absolute top-4 right-4 text-white/60 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-4 text-amber-400">
              <Lock className="w-8 h-8 stroke-[1.5]" />
            </div>

            <h3 className="text-base font-semibold text-white mb-1">
              {forgotStep === 1 ? 'Reset Password' : 'Enter Reset Code'}
            </h3>
            <p className="text-xs text-white/70 mb-6">
              {forgotStep === 1 
                ? 'Enter your email to receive a recovery code.' 
                : 'Enter the code from your email along with your new password.'}
            </p>

            {forgotStep === 1 ? (
              <form onSubmit={handleForgotEmailSubmit} className="space-y-4">
                <input
                  type="email"
                  placeholder="Your Email Address"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full bg-black/40 border border-white/15 text-white text-xs sm:text-sm rounded-xl px-4 py-3 outline-none focus:border-amber-400"
                  required
                />
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full bg-gradient-to-r from-[#e9ab78] to-[#f6d1b2] text-[#181210] font-semibold text-sm py-3 rounded-xl hover:opacity-95 transition-opacity"
                >
                  {forgotLoading ? 'Sending...' : 'Send Recovery Code'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleForgotResetSubmit} className="space-y-3">
                <input
                  type="text"
                  maxLength={6}
                  placeholder="6-digit code"
                  value={forgotOtp}
                  onChange={(e) => setForgotOtp(e.target.value)}
                  className="w-full text-center tracking-[6px] font-mono text-base font-bold bg-black/40 border border-white/15 text-white rounded-xl py-2.5 outline-none focus:border-amber-400"
                  required
                />

                <input
                  type="password"
                  placeholder="New password (6+ chars)"
                  autoComplete="new-password"
                  value={forgotNewPassword}
                  onChange={(e) => setForgotNewPassword(e.target.value)}
                  className="w-full bg-black/40 border border-white/15 text-white text-xs sm:text-sm rounded-xl px-4 py-3 outline-none focus:border-amber-400"
                  required
                />

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full bg-gradient-to-r from-[#e9ab78] to-[#f6d1b2] text-[#181210] font-semibold text-sm py-3 rounded-xl hover:opacity-95 transition-opacity"
                >
                  {forgotLoading ? 'Updating...' : 'Set New Password'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
