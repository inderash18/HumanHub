import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { 
  Fingerprint, 
  Mail, 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  UserPlus
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import api from '../services/api';
import Button from '../components/ui/Button';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!email || !username || !password) {
      return toast.error('Please fill in all required fields');
    }

    try {
      setLoading(true);
      const res = await api.post('/auth/register', {
        email: email.trim(),
        displayName: displayName.trim() || username.trim(),
        username: username.trim().toLowerCase(),
        password,
        bio: 'Connecting and sharing on HumanHub.'
      });

      const { user, token } = res.data;
      setAuth(user, token);
      toast.success('Account created! Welcome to HumanHub ✨');
      navigate('/feed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed.');
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

      {/* Centered Register Card */}
      <div className="relative z-10 w-full max-w-[420px] mx-auto animate-fade-in my-8">
        <div className="bg-hub-surface border border-hub-border rounded-3xl p-7 sm:p-8 shadow-2xl flex flex-col items-center">
          
          {/* Top Badge */}
          <div className="w-12 h-12 rounded-2xl bg-hub-surface-elevated border border-hub-border flex items-center justify-center text-hub-accent text-xl shadow-inner mb-4">
            <UserPlus className="w-6 h-6" />
          </div>

          <h1 className="font-display text-xl font-bold text-hub-text-primary text-center mb-1 tracking-tight">
            Create your account
          </h1>
          <p className="text-xs text-hub-text-secondary text-center max-w-[300px] mb-6 leading-relaxed">
            Join HumanHub to discover communities and connect with friends.
          </p>

          <form onSubmit={handleRegister} className="w-full space-y-3.5">
            {/* Email */}
            <div className="relative flex items-center">
              <Mail className="absolute left-3.5 w-4 h-4 text-hub-text-tertiary pointer-events-none" />
              <input 
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-hub-surface-elevated border border-hub-border text-hub-text-primary text-xs rounded-xl pl-10 pr-4 py-3 outline-none focus:border-hub-accent transition-all placeholder:text-hub-text-tertiary"
                required
              />
            </div>

            {/* Display Name */}
            <div className="relative flex items-center">
              <User className="absolute left-3.5 w-4 h-4 text-hub-text-tertiary pointer-events-none" />
              <input 
                type="text"
                placeholder="Display Name (e.g. Alex Rivera)"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-hub-surface-elevated border border-hub-border text-hub-text-primary text-xs rounded-xl pl-10 pr-4 py-3 outline-none focus:border-hub-accent transition-all placeholder:text-hub-text-tertiary"
              />
            </div>

            {/* Unique Username */}
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-hub-text-tertiary text-xs font-mono-code font-bold pointer-events-none">@</span>
              <input 
                type="text"
                placeholder="Unique username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-hub-surface-elevated border border-hub-border text-hub-text-primary text-xs rounded-xl pl-10 pr-4 py-3 outline-none focus:border-hub-accent transition-all placeholder:text-hub-text-tertiary"
                required
              />
            </div>

            {/* Password */}
            <div className="relative flex items-center">
              <Lock className="absolute left-3.5 w-4 h-4 text-hub-text-tertiary pointer-events-none" />
              <input 
                type={showPassword ? "text" : "password"}
                placeholder="Password (minimum 8 characters)"
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
              disabled={loading || !email || !username || !password}
              isLoading={loading}
              variant="primary"
              size="md"
              className="w-full mt-2"
            >
              Create Account
            </Button>
          </form>

          <p className="text-xs text-hub-text-secondary text-center mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-hub-accent font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
