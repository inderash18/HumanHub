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
  RotateCw,
  X
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '../store/useAuthStore';
import api from '../services/api';

export default function LandingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login, register: registerUser, isAuthenticated } = useAuthStore();

  const [mode, setMode] = useState(searchParams.get('mode') === 'signup' ? 'signup' : 'signin');

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
    const urlMode = searchParams.get('mode');
    if (urlMode === 'signup' || urlMode === 'signin') {
      setMode(urlMode);
    }
  }, [searchParams]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginIdentifier.trim() || !loginPassword) {
      toast.error('Please enter your username/email and password');
      return;
    }

    try {
      setLoginLoading(true);
      await login(loginIdentifier.trim(), loginPassword);
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

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!regEmail.trim() || !regUsername.trim() || !regPassword) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setRegLoading(true);
      await registerUser({
        email: regEmail.trim(),
        username: regUsername.trim().toLowerCase(),
        displayName: regDisplayName.trim() || regUsername.trim(),
        password: regPassword
      });

      toast.success('Verification code sent to your email!');
      setOtpEmail(regEmail.trim());
      setOtpModalOpen(true);
      setResendCooldown(60);
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
      setMode('signin');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--ig-bg)] text-[var(--ig-text-primary)] flex flex-col justify-between select-none">
      
      {/* Main Content Area */}
      <div className="flex-1 flex items-center justify-center py-8 px-4">
        <div className="flex items-center justify-center gap-8 max-w-[850px] w-full">
          
          {/* Left: Instagram Frame Mockup (Desktop Only) */}
          <div className="hidden lg:block relative w-[380px] h-[580px] bg-no-repeat bg-contain">
            <div className="relative w-[250px] h-[538px] ml-[112px] mt-[26px] overflow-hidden rounded-[24px] border-[8px] border-neutral-900 shadow-2xl bg-black">
              <img 
                src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80" 
                alt="Instagram App Feed Preview"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Right: Instagram Auth Cards */}
          <div className="w-full max-w-[350px] flex flex-col gap-2.5">
            
            {/* Top Form Card */}
            <div className="bg-[var(--ig-surface)] border border-[var(--ig-border)] rounded-sm p-8 flex flex-col items-center">
              {/* HumanHub Logo */}
              <h1 className="font-logo text-4xl tracking-tight text-[var(--ig-text-primary)] mb-8 mt-3">
                HumanHub
              </h1>

              {mode === 'signin' ? (
                /* ================= SIGN IN FORM ================= */
                <form onSubmit={handleLogin} className="w-full space-y-2">
                  <input
                    type="text"
                    placeholder="Phone number, username, or email"
                    autoComplete="username"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    className="w-full bg-[var(--ig-elevated)] border border-[var(--ig-border)] text-xs text-[var(--ig-text-primary)] rounded-[3px] px-2 py-2.5 outline-none focus:border-[var(--ig-text-tertiary)] placeholder:text-[var(--ig-text-tertiary)]"
                    required
                  />

                  <div className="relative flex items-center">
                    <input
                      type={showLoginPassword ? "text" : "password"}
                      placeholder="Password"
                      autoComplete="current-password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full bg-[var(--ig-elevated)] border border-[var(--ig-border)] text-xs text-[var(--ig-text-primary)] rounded-[3px] pl-2 pr-12 py-2.5 outline-none focus:border-[var(--ig-text-tertiary)] placeholder:text-[var(--ig-text-tertiary)]"
                      required
                    />
                    {loginPassword && (
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-2 text-xs font-semibold text-[var(--ig-text-primary)] hover:opacity-70"
                        tabIndex={-1}
                      >
                        {showLoginPassword ? 'Hide' : 'Show'}
                      </button>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loginLoading || !loginIdentifier || !loginPassword}
                    className="ig-btn-primary w-full mt-3 !py-2 !rounded-lg"
                  >
                    {loginLoading ? 'Logging in...' : 'Log in'}
                  </button>

                  {/* OR Divider */}
                  <div className="flex items-center my-4">
                    <div className="flex-1 h-[1px] bg-[var(--ig-border)]" />
                    <span className="px-4 text-xs font-semibold text-[var(--ig-text-tertiary)] uppercase">OR</span>
                    <div className="flex-1 h-[1px] bg-[var(--ig-border)]" />
                  </div>

                  {/* Forgot Password */}
                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => { setForgotModalOpen(true); setForgotStep(1); }}
                      className="text-xs text-[var(--ig-text-link)] hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                </form>
              ) : (
                /* ================= SIGN UP FORM ================= */
                <form onSubmit={handleRegister} className="w-full space-y-2">
                  <p className="text-sm font-semibold text-[var(--ig-text-secondary)] text-center mb-4 leading-snug">
                    Sign up to see photos and videos from your friends.
                  </p>

                  <input
                    type="email"
                    placeholder="Mobile Number or Email"
                    autoComplete="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full bg-[var(--ig-elevated)] border border-[var(--ig-border)] text-xs text-[var(--ig-text-primary)] rounded-[3px] px-2 py-2.5 outline-none focus:border-[var(--ig-text-tertiary)] placeholder:text-[var(--ig-text-tertiary)]"
                    required
                  />

                  <input
                    type="text"
                    placeholder="Full Name"
                    autoComplete="name"
                    value={regDisplayName}
                    onChange={(e) => setRegDisplayName(e.target.value)}
                    className="w-full bg-[var(--ig-elevated)] border border-[var(--ig-border)] text-xs text-[var(--ig-text-primary)] rounded-[3px] px-2 py-2.5 outline-none focus:border-[var(--ig-text-tertiary)] placeholder:text-[var(--ig-text-tertiary)]"
                  />

                  <input
                    type="text"
                    placeholder="Username"
                    autoComplete="username"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    className="w-full bg-[var(--ig-elevated)] border border-[var(--ig-border)] text-xs text-[var(--ig-text-primary)] rounded-[3px] px-2 py-2.5 outline-none focus:border-[var(--ig-text-tertiary)] placeholder:text-[var(--ig-text-tertiary)]"
                    required
                  />

                  <div className="relative flex items-center">
                    <input
                      type={showRegPassword ? "text" : "password"}
                      placeholder="Password"
                      autoComplete="new-password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="w-full bg-[var(--ig-elevated)] border border-[var(--ig-border)] text-xs text-[var(--ig-text-primary)] rounded-[3px] pl-2 pr-12 py-2.5 outline-none focus:border-[var(--ig-text-tertiary)] placeholder:text-[var(--ig-text-tertiary)]"
                      required
                    />
                    {regPassword && (
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="absolute right-2 text-xs font-semibold text-[var(--ig-text-primary)] hover:opacity-70"
                        tabIndex={-1}
                      >
                        {showRegPassword ? 'Hide' : 'Show'}
                      </button>
                    )}
                  </div>

                  <p className="text-[11px] text-[var(--ig-text-tertiary)] text-center py-2 leading-relaxed">
                    People who use our service may have uploaded your contact information to HumanHub. <span className="text-[var(--ig-text-link)] cursor-pointer">Learn More</span>
                  </p>

                  <button
                    type="submit"
                    disabled={regLoading || !regEmail || !regUsername || !regPassword}
                    className="ig-btn-primary w-full !py-2 !rounded-lg"
                  >
                    {regLoading ? 'Signing up...' : 'Sign up'}
                  </button>
                </form>
              )}
            </div>

            {/* Bottom Switch Card */}
            <div className="bg-[var(--ig-surface)] border border-[var(--ig-border)] rounded-sm py-5 text-center text-sm">
              {mode === 'signin' ? (
                <p>
                  Don't have an account?{' '}
                  <button 
                    onClick={() => setMode('signup')}
                    className="font-semibold text-[var(--ig-primary-button)] hover:underline"
                  >
                    Sign up
                  </button>
                </p>
              ) : (
                <p>
                  Have an account?{' '}
                  <button 
                    onClick={() => setMode('signin')}
                    className="font-semibold text-[var(--ig-primary-button)] hover:underline"
                  >
                    Log in
                  </button>
                </p>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Footer Links & Copyright */}
      <footer className="w-full max-w-5xl mx-auto px-4 py-8 text-center text-xs text-[var(--ig-text-tertiary)] space-y-4">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          <span>Meta</span>
          <span>About</span>
          <span>Blog</span>
          <span>Jobs</span>
          <span>Help</span>
          <span>API</span>
          <span>Privacy</span>
          <span>Terms</span>
          <span>Locations</span>
          <span>HumanHub Lite</span>
          <span>Threads</span>
          <span>Contact Uploading & Non-Users</span>
        </div>
        <div>
          <span>© {new Date().getFullYear()} HUMANHUB FROM ORGANIC SOCIAL</span>
        </div>
      </footer>

      {/* ================= OTP VERIFICATION MODAL ================= */}
      {otpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 animate-fade-in">
          <div className="bg-[var(--ig-elevated)] border border-[var(--ig-border)] rounded-2xl p-6 sm:p-8 max-w-sm w-full shadow-2xl relative text-center">
            <button
              onClick={() => setOtpModalOpen(false)}
              className="absolute top-4 right-4 text-[var(--ig-text-tertiary)] hover:text-[var(--ig-text-primary)]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-16 h-16 rounded-full border-2 border-[var(--ig-text-primary)] flex items-center justify-center mx-auto mb-4 text-[var(--ig-text-primary)]">
              <KeyRound className="w-8 h-8 stroke-[1.5]" />
            </div>

            <h3 className="text-base font-semibold text-[var(--ig-text-primary)] mb-1">
              Enter Confirmation Code
            </h3>
            <p className="text-xs text-[var(--ig-text-secondary)] mb-6">
              Enter the 6-digit code we sent to <span className="font-semibold text-[var(--ig-text-primary)]">{otpEmail}</span>.
            </p>

            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <input
                type="text"
                maxLength={6}
                placeholder="######"
                value={otpValue}
                onChange={(e) => setOtpValue(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full text-center tracking-[8px] font-mono text-xl font-bold bg-[var(--ig-bg)] border border-[var(--ig-border)] text-[var(--ig-text-primary)] rounded-lg py-2.5 outline-none focus:border-[var(--ig-primary-button)]"
                autoFocus
                required
              />

              <button
                type="submit"
                disabled={otpLoading || otpValue.length !== 6}
                className="ig-btn-primary w-full !py-2 !rounded-lg"
              >
                {otpLoading ? 'Verifying...' : 'Confirm'}
              </button>
            </form>

            <div className="mt-4 pt-4 border-t border-[var(--ig-border)] text-xs">
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={resendCooldown > 0}
                className="font-semibold text-[var(--ig-primary-button)] hover:underline disabled:opacity-50"
              >
                {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend Code'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= FORGOT PASSWORD MODAL ================= */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 animate-fade-in">
          <div className="bg-[var(--ig-elevated)] border border-[var(--ig-border)] rounded-2xl p-6 sm:p-8 max-w-sm w-full shadow-2xl relative text-center">
            <button
              onClick={() => setForgotModalOpen(false)}
              className="absolute top-4 right-4 text-[var(--ig-text-tertiary)] hover:text-[var(--ig-text-primary)]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-16 h-16 rounded-full border-2 border-[var(--ig-text-primary)] flex items-center justify-center mx-auto mb-4 text-[var(--ig-text-primary)]">
              <Lock className="w-8 h-8 stroke-[1.5]" />
            </div>

            <h3 className="text-base font-semibold text-[var(--ig-text-primary)] mb-1">
              {forgotStep === 1 ? 'Trouble logging in?' : 'Reset Your Password'}
            </h3>
            <p className="text-xs text-[var(--ig-text-secondary)] mb-6">
              {forgotStep === 1 ? 'Enter your email and we’ll send you a 6-digit code to get back into your account.' : 'Enter the code sent to your email along with your new password.'}
            </p>

            {forgotStep === 1 ? (
              <form onSubmit={handleForgotEmailSubmit} className="space-y-4">
                <input
                  type="email"
                  placeholder="Email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full bg-[var(--ig-bg)] border border-[var(--ig-border)] text-xs text-[var(--ig-text-primary)] rounded-lg px-3 py-2.5 outline-none focus:border-[var(--ig-primary-button)]"
                  required
                />
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="ig-btn-primary w-full !py-2 !rounded-lg"
                >
                  {forgotLoading ? 'Sending...' : 'Send login code'}
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
                  className="w-full text-center tracking-[6px] font-mono text-base font-bold bg-[var(--ig-bg)] border border-[var(--ig-border)] text-[var(--ig-text-primary)] rounded-lg py-2 outline-none focus:border-[var(--ig-primary-button)]"
                  required
                />

                <input
                  type="password"
                  placeholder="New password (6+ chars)"
                  autoComplete="new-password"
                  value={forgotNewPassword}
                  onChange={(e) => setForgotNewPassword(e.target.value)}
                  className="w-full bg-[var(--ig-bg)] border border-[var(--ig-border)] text-xs text-[var(--ig-text-primary)] rounded-lg px-3 py-2.5 outline-none focus:border-[var(--ig-primary-button)]"
                  required
                />

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="ig-btn-primary w-full !py-2 !rounded-lg"
                >
                  {forgotLoading ? 'Updating...' : 'Reset Password'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
