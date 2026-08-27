import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { IoShieldCheckmark, IoAddCircleOutline } from 'react-icons/io5';
import { MdVerified } from 'react-icons/md';
import StoriesTray from '../components/home/StoriesTray';
import PostCard from '../components/posts/PostCard';
import CreatePostModal from '../components/posts/CreatePostModal';
import { useAuthStore } from '../store/useAuthStore';
import api from '../services/api';

export default function FeedPage() {
  const { user } = useAuthStore();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  useEffect(() => {
    fetchFeed();
  }, []);

  const fetchFeed = async () => {
    try {
      setLoading(true);
      const res = await api.get('/posts');
      setPosts(res.data?.data || res.data || []);
    } catch (err) {
      console.log('Feed fetched with empty response');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[935px] mx-auto px-4 py-4 flex justify-center gap-16">
      {/* Central Main Feed */}
      <div className="w-full max-w-[630px] flex flex-col gap-4">
        {/* Stories Tray */}
        <StoriesTray />

        {/* Loading Skeletons */}
        {loading && (
          <div className="flex flex-col gap-6 mt-4">
            {[1, 2].map((n) => (
              <div key={n} className="w-full max-w-[470px] mx-auto flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#262626] animate-pulse" />
                  <div className="w-24 h-3 bg-[#262626] rounded animate-pulse" />
                </div>
                <div className="w-full aspect-square bg-[#1a1a1a] rounded-md animate-pulse" />
              </div>
            ))}
          </div>
        )}

        {/* Posts Stream */}
        {!loading && posts.length > 0 && (
          <div className="flex flex-col gap-2 mt-2">
            {posts.map((post) => (
              <PostCard 
                key={post._id} 
                post={post} 
                onUpdate={fetchFeed} 
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && posts.length === 0 && (
          <div className="w-full max-w-[470px] mx-auto p-12 text-center bg-[#121212] border border-[#262626] rounded-2xl flex flex-col items-center mt-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] flex items-center justify-center text-white mb-4 shadow-lg shadow-pink-500/20">
              <IoShieldCheckmark className="text-3xl" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Welcome to HumanHub</h3>
            <p className="text-xs text-[#a8a8a8] max-w-xs mb-6">
              Your feed is currently fresh. Be the first verified human to create a post or share a story!
            </p>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="bg-[#0095f6] hover:bg-[#1877f2] text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2"
            >
              <IoAddCircleOutline className="text-lg" />
              Create First Post
            </button>
          </div>
        )}
      </div>

      {/* Right Desktop Suggestions Sidebar */}
      <div className="hidden lg:flex flex-col w-[320px] pt-4 gap-5 select-none">
        {/* User Card */}
        {user ? (
          <div className="flex items-center justify-between">
            <Link to={`/u/${user.username}`} className="flex items-center gap-3 group">
              <img 
                src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} 
                alt={user.username} 
                className="w-11 h-11 rounded-full object-cover border border-[#262626]"
              />
              <div>
                <p className="text-sm font-semibold text-white flex items-center gap-1 group-hover:opacity-80">
                  {user.username}
                  <MdVerified className="text-[#0095f6] text-xs" />
                </p>
                <p className="text-xs text-[#737373]">{user.email}</p>
              </div>
            </Link>
            <button className="text-xs font-semibold text-[#0095f6] hover:text-white">
              Switch
            </button>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-[#121212] border border-[#262626] text-center">
            <p className="text-xs font-semibold text-white mb-2">Join HumanHub</p>
            <p className="text-[11px] text-[#737373] mb-3">Proof of Humanity verified social experience</p>
            <Link to="/login" className="block w-full bg-[#0095f6] text-white py-1.5 rounded-lg text-xs font-bold">
              Log In
            </Link>
          </div>
        )}

        {/* Suggestions Header */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[#a8a8a8]">Proof of Humanity Info</span>
          <Link to="/verification-dashboard" className="text-xs font-semibold text-[#f5f5f5] hover:text-[#0095f6]">
            Learn
          </Link>
        </div>

        {/* Feature Cards */}
        <div className="flex flex-col gap-3">
          <div className="p-3 bg-[#121212] border border-[#262626] rounded-xl flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#00ba7c]/10 text-[#00ba7c] flex items-center justify-center flex-shrink-0 mt-0.5">
              <IoShieldCheckmark className="text-lg" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Bot-Free Guarantee</p>
              <p className="text-[11px] text-[#737373] mt-0.5">
                Multi-layer AI neural scoring ensures only authentic human voices are published.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Meta */}
        <div className="text-[11px] text-[#555555] leading-relaxed">
          <p>© 2026 HumanHub • Proof of Humanity Network</p>
        </div>
      </div>

      {isCreateOpen && (
        <CreatePostModal 
          isOpen={isCreateOpen} 
          onClose={() => setIsCreateOpen(false)} 
          onPostCreated={fetchFeed}
        />
      )}
    </div>
  );
}
