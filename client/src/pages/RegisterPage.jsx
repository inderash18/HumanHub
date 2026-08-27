import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { MdVerified } from 'react-icons/md';
import { IoShieldCheckmark } from 'react-icons/io5';
import { useAuthStore } from '../store/useAuthStore';
import api from '../services/api';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [bio, setBio] = useState('');
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
        username: username.trim().toLowerCase(),
        password,
        bio: bio.trim() || 'Verified human creator on HumanHub.'
      });

      const { user, token } = res.data;
      setAuth(user, token);
      toast.success(`Welcome to HumanHub, @${user.username}! ✅`);
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-[350px] flex flex-col gap-3">
        {/* Main Sign Up Box */}
        <div className="bg-black border border-[#262626] p-8 rounded-xl flex flex-col items-center">
          <div className="flex items-center gap-2 mb-4">
            <span className="font-brand text-3xl font-bold text-white tracking-tight flex items-center gap-1.5">
              HumanHub
              <MdVerified className="text-[#0095f6] text-2xl" />
            </span>
          </div>

          <p className="text-xs font-semibold text-[#a8a8a8] text-center mb-6 leading-relaxed">
            Sign up to share authentic photos, reels, and stories with verified humans.
          </p>

          <form onSubmit={handleRegister} className="w-full flex flex-col gap-2">
            <input 
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#121212] border border-[#262626] text-white text-xs rounded-md px-3 py-3 outline-none focus:border-[#737373]"
              required
            />
            <input 
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-[#121212] border border-[#262626] text-white text-xs rounded-md px-3 py-3 outline-none focus:border-[#737373]"
              required
            />
            <input 
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#121212] border border-[#262626] text-white text-xs rounded-md px-3 py-3 outline-none focus:border-[#737373]"
              required
            />
            <input 
              type="text"
              placeholder="Short Bio (optional)"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full bg-[#121212] border border-[#262626] text-white text-xs rounded-md px-3 py-3 outline-none focus:border-[#737373]"
            />

            <p className="text-[11px] text-[#737373] text-center my-3 leading-relaxed">
              By signing up, you agree to our Terms and our Proof of Humanity verification standards.
            </p>

            <button 
              type="submit"
              disabled={loading || !email || !username || !password}
              className="w-full bg-[#0095f6] hover:bg-[#1877f2] disabled:opacity-40 text-white font-semibold text-sm py-2 rounded-lg transition-colors shadow-lg shadow-blue-500/20"
            >
              {loading ? 'Creating account...' : 'Sign up'}
            </button>
          </form>
        </div>

        {/* Login Redirect Box */}
        <div className="bg-black border border-[#262626] p-5 rounded-xl text-center text-xs text-white">
          Have an account?{' '}
          <Link to="/login" className="font-semibold text-[#0095f6] hover:underline">
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}
