import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { MdVerified } from 'react-icons/md';
import { IoShieldCheckmark } from 'react-icons/io5';
import { useAuthStore } from '../store/useAuthStore';
import api from '../services/api';

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!emailOrUsername || !password) {
      return toast.error('Please fill in all fields');
    }

    try {
      setLoading(true);
      const res = await api.post('/auth/login', {
        email: emailOrUsername.includes('@') ? emailOrUsername : undefined,
        username: !emailOrUsername.includes('@') ? emailOrUsername : undefined,
        password
      });

      const { user, token } = res.data;
      setAuth(user, token);
      toast.success(`Welcome back, @${user.username}!`);
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-[850px] flex items-center justify-center gap-10">
        {/* Left Side Phone Showcase (Desktop) */}
        <div className="hidden lg:block relative w-[380px] h-[580px] rounded-[40px] border-[6px] border-[#262626] bg-[#121212] overflow-hidden shadow-2xl p-2">
          <div className="w-full h-full rounded-[30px] overflow-hidden relative bg-gradient-to-b from-[#1a1a1a] to-black flex flex-col items-center justify-center p-6 text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] flex items-center justify-center text-white text-4xl font-bold mb-6 shadow-2xl shadow-pink-500/30 animate-story-pulse">
              H
            </div>
            <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-1.5">
              HumanHub
              <MdVerified className="text-[#0095f6] text-xl" />
            </h3>
            <p className="text-xs text-[#a8a8a8] leading-relaxed mb-6">
              The human-only social platform where AI bots, synthetic spam, and deepfakes are mathematically excluded.
            </p>
            <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-xs text-[#00ba7c] font-semibold">
              <IoShieldCheckmark className="text-base text-[#0095f6]" />
              Proof of Humanity Active
            </div>
          </div>
        </div>

        {/* Right Side Login Card */}
        <div className="w-full max-w-[350px] flex flex-col gap-3">
          {/* Main Form Box */}
          <div className="bg-black border border-[#262626] p-8 rounded-xl flex flex-col items-center">
            <div className="flex items-center gap-2 mb-8">
              <span className="font-brand text-3xl font-bold text-white tracking-tight flex items-center gap-1.5">
                HumanHub
                <MdVerified className="text-[#0095f6] text-2xl" />
              </span>
            </div>

            <form onSubmit={handleLogin} className="w-full flex flex-col gap-2">
              <input 
                type="text"
                placeholder="Phone number, username, or email"
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                className="w-full bg-[#121212] border border-[#262626] text-white text-xs rounded-md px-3 py-3 outline-none focus:border-[#737373]"
              />
              <input 
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#121212] border border-[#262626] text-white text-xs rounded-md px-3 py-3 outline-none focus:border-[#737373]"
              />
              <button 
                type="submit"
                disabled={loading || !emailOrUsername || !password}
                className="w-full bg-[#0095f6] hover:bg-[#1877f2] disabled:opacity-40 text-white font-semibold text-sm py-2 rounded-lg transition-colors mt-2 shadow-lg shadow-blue-500/20"
              >
                {loading ? 'Logging in...' : 'Log in'}
              </button>
            </form>

            <div className="w-full flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-[#262626]" />
              <span className="text-xs text-[#737373] uppercase font-semibold">OR</span>
              <div className="flex-1 h-px bg-[#262626]" />
            </div>

            <div className="text-xs text-[#0095f6] font-semibold flex items-center gap-1.5 cursor-pointer hover:underline">
              <IoShieldCheckmark className="text-base" />
              Log in with Proof of Humanity
            </div>
          </div>

          {/* Sign Up Redirect Box */}
          <div className="bg-black border border-[#262626] p-5 rounded-xl text-center text-xs text-white">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-[#0095f6] hover:underline">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
