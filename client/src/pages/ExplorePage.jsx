import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { IoHeart, IoChatbubble, IoShieldCheckmark, IoSearchOutline } from 'react-icons/io5';
import { MdVerified } from 'react-icons/md';
import api from '../services/api';

export default function ExplorePage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchExplore();
  }, []);

  const fetchExplore = async () => {
    try {
      setLoading(true);
      const res = await api.get('/posts?limit=30');
      setPosts(res.data?.data || res.data || []);
    } catch (err) {
      console.log('Explore fetched');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredPosts = posts.filter((p) => 
    (p.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.body || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full max-w-[975px] mx-auto px-2 sm:px-4 py-6 select-none">
      {/* Search Header for Mobile/Desktop */}
      <div className="max-w-md mx-auto mb-6 relative">
        <IoSearchOutline className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#737373] text-lg" />
        <input 
          type="text"
          placeholder="Search verified human posts & tags..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-[#262626] text-white text-sm rounded-xl pl-10 pr-4 py-2.5 outline-none focus:ring-1 focus:ring-[#0095f6]"
        />
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-3 gap-1 sm:gap-4">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="aspect-square bg-[#1a1a1a] rounded-sm sm:rounded-md animate-pulse" />
          ))}
        </div>
      )}

      {/* 3-Column Instagram Grid */}
      {!loading && filteredPosts.length > 0 && (
        <div className="grid grid-cols-3 gap-1 sm:gap-4">
          {filteredPosts.map((post) => {
            const mediaUrl = post.mediaUrls && post.mediaUrls.length > 0 ? post.mediaUrls[0] : null;

            return (
              <Link
                key={post._id}
                to={`/p/${post._id}`}
                className="group relative aspect-square bg-[#121212] rounded-sm sm:rounded-md overflow-hidden cursor-pointer border border-[#262626]"
              >
                {mediaUrl ? (
                  <img 
                    src={mediaUrl} 
                    alt={post.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full p-4 flex flex-col justify-center items-center text-center bg-gradient-to-br from-[#121212] to-[#1f1f1f]">
                    <IoShieldCheckmark className="text-3xl text-[#0095f6] mb-2" />
                    <p className="text-xs text-white font-medium line-clamp-3">{post.title || post.body}</p>
                  </div>
                )}

                {/* Verified Human Indicator Top Right */}
                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md p-1 rounded-full text-[#0095f6]">
                  <MdVerified className="text-sm" />
                </div>

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6 text-white font-bold text-sm sm:text-base">
                  <div className="flex items-center gap-1.5">
                    <IoHeart className="text-xl text-[#ff3040]" />
                    <span>{post.upvotes || 0}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <IoChatbubble className="text-lg" />
                    <span>{post.comments?.length || 0}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredPosts.length === 0 && (
        <div className="text-center py-16 text-[#737373]">
          <IoShieldCheckmark className="text-5xl mx-auto mb-3 text-[#363636]" />
          <p className="text-base font-semibold text-white">No explore posts found</p>
          <p className="text-xs mt-1">Posts will appear here as verified humans create content.</p>
        </div>
      )}
    </div>
  );
}
