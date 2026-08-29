import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Fingerprint, 
  ArrowRight, 
  Sparkles,
  Heart
} from 'lucide-react';
import api from '../services/api';
import Button from '../components/ui/Button';
import UserAvatar from '../components/common/UserAvatar';

export default function LandingPage() {
  const navigate = useNavigate();
  const [livePosts, setLivePosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSampleFeed();
  }, []);

  const fetchSampleFeed = async () => {
    try {
      setLoading(true);
      const res = await api.get('/posts?limit=3');
      setLivePosts(res.data?.data || res.data || []);
    } catch (err) {
      setLivePosts([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-hub-background text-hub-text-primary select-none flex flex-col justify-between">
      {/* Top Navigation */}
      <header className="w-full max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-hub-accent flex items-center justify-center text-white text-lg shadow-md">
            <Fingerprint className="w-5 h-5" />
          </div>
          <span className="font-display font-extrabold text-base text-hub-text-primary tracking-tight">
            Human<span className="text-hub-accent">Hub</span>
          </span>
        </Link>

        <div className="flex items-center gap-2.5">
          <Link to="/login">
            <Button variant="ghost" size="sm">
              Sign In
            </Button>
          </Link>
          <Link to="/register">
            <Button variant="primary" size="sm">
              Create Account
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Hero & Feed Portal */}
      <main className="w-full max-w-4xl mx-auto px-6 py-10 flex flex-col items-center text-center space-y-8">
        {/* Core Statement */}
        <div className="space-y-4 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-hub-surface-elevated border border-hub-border text-xs font-semibold text-hub-text-secondary mx-auto">
            <Sparkles className="w-3.5 h-3.5 text-hub-accent" />
            <span>A fresh, modern social space</span>
          </div>
          
          <h1 className="font-display text-3xl sm:text-5xl font-extrabold text-hub-text-primary tracking-tight leading-tight">
            Share moments. Discover communities. Stay connected.
          </h1>

          <p className="text-sm sm:text-base text-hub-text-secondary max-w-lg mx-auto leading-relaxed">
            HumanHub is built around real conversations, creativity, friendships, and everyday expression across people and communities.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate('/register')}
            icon={ArrowRight}
          >
            Get Started Free
          </Button>

          <Button
            variant="secondary"
            size="lg"
            onClick={() => navigate('/login')}
          >
            Sign In to Account
          </Button>
        </div>

        {/* Live Social Feed Preview */}
        <div className="w-full max-w-xl text-left pt-6">
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-hub-text-tertiary font-mono-code">
              Community Feed Preview
            </span>
            <Link to="/login" className="text-xs font-semibold text-hub-accent hover:underline">
              Enter Feed →
            </Link>
          </div>

          {livePosts.length > 0 ? (
            <div className="space-y-3">
              {livePosts.map((post) => (
                <div 
                  key={post._id}
                  onClick={() => navigate('/login')}
                  className="p-4 rounded-3xl bg-hub-surface border border-hub-border hover:border-hub-border-light transition-all cursor-pointer shadow-xl"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <UserAvatar 
                        src={post.author?.avatar} 
                        name={post.author?.displayName || post.author?.username} 
                        size="xs" 
                      />
                      <span className="font-bold text-xs text-hub-text-primary">
                        {post.author?.displayName || post.author?.username || 'member'}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-hub-text-secondary line-clamp-2 leading-relaxed">
                    {post.body}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 rounded-3xl bg-hub-surface border border-hub-border text-center text-xs text-hub-text-secondary shadow-xl">
              Vibrant community feed ready. Sign in to join the conversation.
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-5xl mx-auto px-6 py-6 border-t border-hub-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-hub-text-tertiary">
        <p>© {new Date().getFullYear()} HumanHub. Built for real conversations and communities.</p>
        <div className="flex items-center gap-4">
          <Link to="/login" className="hover:text-hub-text-primary transition-colors">Sign In</Link>
          <Link to="/register" className="hover:text-hub-text-primary transition-colors">Create Account</Link>
          <span className="flex items-center gap-1 text-hub-text-tertiary">
            <Heart className="w-3.5 h-3.5 text-hub-accent fill-current" /> Authentic Connection
          </span>
        </div>
      </footer>
    </div>
  );
}
