import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  IoSettingsOutline, 
  IoGridOutline, 
  IoBookmarkOutline, 
  IoPersonOutline,
  IoShieldCheckmark,
  IoHeart,
  IoChatbubble,
  IoCameraOutline
} from 'react-icons/io5';
import { BsCameraReels } from 'react-icons/bs';
import { MdVerified } from 'react-icons/md';
import { useAuthStore } from '../store/useAuthStore';
import api from '../services/api';

export default function UserProfilePage() {
  const { username } = useParams();
  const { user: currentUser } = useAuthStore();
  const [profileUser, setProfileUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [activeTab, setActiveTab] = useState('posts');
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  const isOwnProfile = currentUser && (currentUser.username === username || !username);

  useEffect(() => {
    fetchProfile();
  }, [username]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const targetUsername = username || currentUser?.username;
      if (!targetUsername) return;

      const res = await api.get(`/users/${targetUsername}`);
      setProfileUser(res.data?.user || res.data || {});
      setPosts(res.data?.posts || []);
    } catch (err) {
      // Fallback
      setProfileUser({
        username: username || currentUser?.username || 'user',
        avatar: currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        bio: currentUser?.bio || 'Verified human member on HumanHub.',
        trustScore: 0.98,
        followersCount: 128,
        followingCount: 94
      });
    } finally {
      setLoading(false);
    }
  };

  const trustPercent = Math.round((profileUser?.trustScore || 0.98) * 100);

  return (
    <div className="w-full max-w-[935px] mx-auto px-4 py-8 select-none">
      {/* 1. Profile Header */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8 sm:gap-16 pb-10 border-b border-[#262626]">
        {/* Avatar */}
        <div className="story-ring-active p-[3px] flex-shrink-0">
          <img 
            src={profileUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} 
            alt={profileUser?.username} 
            className="w-24 h-24 sm:w-36 sm:h-36 rounded-full object-cover bg-black"
          />
        </div>

        {/* User Info & Actions */}
        <div className="flex-1 flex flex-col gap-4 text-center sm:text-left">
          {/* Row 1: Username & Action Buttons */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4">
            <h2 className="text-xl font-normal text-white flex items-center gap-1.5">
              {profileUser?.username}
              <MdVerified className="text-[#0095f6] text-xl" title={`Proof of Humanity Verified (${trustPercent}%)`} />
            </h2>

            {isOwnProfile ? (
              <div className="flex items-center gap-2">
                <Link 
                  to="/settings"
                  className="bg-[#262626] hover:bg-[#363636] text-white px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors"
                >
                  Edit profile
                </Link>
                <Link to="/settings" className="p-2 text-white hover:opacity-70 text-xl">
                  <IoSettingsOutline />
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsFollowing(!isFollowing)}
                  className={`px-6 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                    isFollowing 
                      ? 'bg-[#262626] text-white hover:bg-[#363636]' 
                      : 'bg-[#0095f6] text-white hover:bg-[#1877f2]'
                  }`}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
                <Link 
                  to="/messages"
                  className="bg-[#262626] hover:bg-[#363636] text-white px-4 py-1.5 rounded-lg text-sm font-semibold"
                >
                  Message
                </Link>
              </div>
            )}
          </div>

          {/* Row 2: Stats */}
          <div className="flex items-center justify-center sm:justify-start gap-8 text-sm">
            <div><span className="font-semibold text-white">{posts.length}</span> posts</div>
            <div><span className="font-semibold text-white">{profileUser?.followersCount || 0}</span> followers</div>
            <div><span className="font-semibold text-white">{profileUser?.followingCount || 0}</span> following</div>
          </div>

          {/* Row 3: Humanity Trust Score Badge */}
          <div className="inline-flex items-center gap-2 bg-[#121212] border border-[#262626] px-3 py-1.5 rounded-full w-fit mx-auto sm:mx-0">
            <IoShieldCheckmark className="text-[#0095f6] text-base" />
            <span className="text-xs font-semibold text-[#f5f5f5]">
              Human Authenticity: <span className="text-[#00ba7c]">{trustPercent}% Verified</span>
            </span>
          </div>

          {/* Row 4: Bio */}
          <div className="text-sm text-[#f5f5f5] leading-relaxed max-w-md">
            <p>{profileUser?.bio || 'Authentic human creator on the HumanHub network.'}</p>
          </div>
        </div>
      </div>

      {/* 2. Story Highlights */}
      <div className="flex items-center gap-8 py-6 overflow-x-auto no-scrollbar border-b border-[#262626]">
        {['Verified 🛡️', 'Art 🎨', 'Travel ✈️', 'Code 💻'].map((highlight, idx) => (
          <div key={idx} className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer group">
            <div className="w-16 h-16 rounded-full p-[2px] border border-[#363636] bg-[#121212] flex items-center justify-center group-hover:border-white transition-colors">
              <div className="w-full h-full rounded-full bg-[#1a1a1a] flex items-center justify-center text-lg">
                {highlight.split(' ')[1]}
              </div>
            </div>
            <span className="text-[12px] text-white font-medium">{highlight.split(' ')[0]}</span>
          </div>
        ))}
      </div>

      {/* 3. Navigation Tabs */}
      <div className="flex items-center justify-center gap-12 text-xs font-semibold uppercase tracking-widest text-[#737373]">
        <button 
          onClick={() => setActiveTab('posts')}
          className={`flex items-center gap-1.5 py-4 border-t transition-colors ${
            activeTab === 'posts' ? 'border-white text-white' : 'border-transparent hover:text-white'
          }`}
        >
          <IoGridOutline className="text-sm" />
          Posts
        </button>
        <button 
          onClick={() => setActiveTab('reels')}
          className={`flex items-center gap-1.5 py-4 border-t transition-colors ${
            activeTab === 'reels' ? 'border-white text-white' : 'border-transparent hover:text-white'
          }`}
        >
          <BsCameraReels className="text-sm" />
          Reels
        </button>
        <button 
          onClick={() => setActiveTab('saved')}
          className={`flex items-center gap-1.5 py-4 border-t transition-colors ${
            activeTab === 'saved' ? 'border-white text-white' : 'border-transparent hover:text-white'
          }`}
        >
          <IoBookmarkOutline className="text-sm" />
          Saved
        </button>
        <button 
          onClick={() => setActiveTab('tagged')}
          className={`flex items-center gap-1.5 py-4 border-t transition-colors ${
            activeTab === 'tagged' ? 'border-white text-white' : 'border-transparent hover:text-white'
          }`}
        >
          <IoPersonOutline className="text-sm" />
          Tagged
        </button>
      </div>

      {/* 4. Posts Grid */}
      {posts.length > 0 ? (
        <div className="grid grid-cols-3 gap-1 sm:gap-4 mt-2">
          {posts.map((p) => {
            const mediaUrl = p.mediaUrls && p.mediaUrls.length > 0 ? p.mediaUrls[0] : null;

            return (
              <Link 
                key={p._id}
                to={`/p/${p._id}`}
                className="group relative aspect-square bg-[#121212] overflow-hidden rounded-sm sm:rounded-md border border-[#262626]"
              >
                {mediaUrl ? (
                  <img 
                    src={mediaUrl} 
                    alt={p.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full p-4 flex flex-col items-center justify-center text-center bg-[#1a1a1a]">
                    <IoShieldCheckmark className="text-3xl text-[#0095f6] mb-1" />
                    <p className="text-xs text-white line-clamp-3">{p.title || p.body}</p>
                  </div>
                )}

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6 text-white font-bold text-sm">
                  <div className="flex items-center gap-1">
                    <IoHeart className="text-lg text-[#ff3040]" />
                    <span>{p.upvotes || 0}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <IoChatbubble className="text-base" />
                    <span>{p.comments?.length || 0}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full border-2 border-white flex items-center justify-center text-white text-3xl mb-4">
            <IoCameraOutline />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">No Posts Yet</h3>
          <p className="text-xs text-[#737373] max-w-xs">
            When {isOwnProfile ? 'you share' : `${profileUser?.username} shares`} verified photos and reels, they will appear here.
          </p>
        </div>
      )}
    </div>
  );
}
