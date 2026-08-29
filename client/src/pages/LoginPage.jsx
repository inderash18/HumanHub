import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { 
  Fingerprint, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  LogIn
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import api from '../services/api';
import Button from '../components/ui/Button';

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!emailOrUsername || !password) {
      return toast.error('Please enter your email or username and password');
    }

    try {
      setLoading(true);
      const isEmail = emailOrUsername.includes('@');
      const res = await api.post('/auth/login', {
        email: isEmail ? emailOrUsername.trim().toLowerCase() : undefined,
        username: !isEmail ? emailOrUsername.trim().toLowerCase() : undefined,
        password
      });

      const { user, token } = res.data;
      setAuth(user, token);
      toast.success(`Welcome back, @${user.username}! ✨`);
      navigate('/feed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Authentication failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-hub-background text-hub-text-primary flex flex-col items-center justify-center p-4 select-none relative overflow-hidden">
      {/* Top-Left Brand Indicator */}
      <div className="absolute top-6 left-6 z-20">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-hub-accent flex items-center justify-center text-white text-base shadow-sm">
            <Fingerprint className="w-4 h-4" />
          </div>
          <span className="font-display font-extrabold text-sm text-hub-text-primary tracking-tight">
            Human<span className="text-hub-accent">Hub</span>
          </span>
        </Link>
      </div>

      {/* Centered Auth Card */}
      <div className="relative z-10 w-full max-w-[400px] mx-auto animate-fade-in">
        <div className="bg-hub-surface border border-hub-border rounded-3xl p-7 sm:p-8 shadow-2xl flex flex-col items-center">
          
          {/* Top Badge */}
          <div className="w-12 h-12 rounded-2xl bg-hub-surface-elevated border border-hub-border flex items-center justify-center text-hub-accent text-xl shadow-inner mb-4">
            <LogIn className="w-6 h-6" />
          </div>

          <h1 className="font-display text-xl font-bold text-hub-text-primary text-center mb-1 tracking-tight">
            Welcome back
          </h1>
          <p className="text-xs text-hub-text-secondary text-center max-w-[280px] mb-6 leading-relaxed">
            Sign in to your HumanHub account to stay connected.
          </p>

          <form onSubmit={handleLogin} className="w-full space-y-3.5">
            {/* Email / Username */}
            <div className="relative flex items-center">
              <Mail className="absolute left-3.5 w-4 h-4 text-hub-text-tertiary pointer-events-none" />
              <input 
                type="text"
                placeholder="Email or username"
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                className="w-full bg-hub-surface-elevated border border-hub-border text-hub-text-primary text-xs rounded-xl pl-10 pr-4 py-3 outline-none focus:border-hub-accent transition-all placeholder:text-hub-text-tertiary"
                required
              />
            </div>

            {/* Password */}
            <div className="relative flex items-center">
              <Lock className="absolute left-3.5 w-4 h-4 text-hub-text-tertiary pointer-events-none" />
              <input 
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-hub-surface-elevated border border-hub-border text-hub-text-primary text-xs rounded-xl pl-10 pr-10 py-3 outline-none focus:border-hub-accent transition-all placeholder:text-hub-text-tertiary"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 text-hub-text-tertiary hover:text-hub-text-primary transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <Button 
              type="submit"
              disabled={loading || !emailOrUsername || !password}
              isLoading={loading}
              variant="primary"
              size="md"
              className="w-full mt-2"
            >
              Sign In
            </Button>
          </form>

          <p className="text-xs text-hub-text-secondary text-center mt-6">
            New to HumanHub?{' '}
            <Link to="/register" className="text-hub-accent font-semibold hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
