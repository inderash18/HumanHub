import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Heart, 
  MessageCircle, 
  Film, 
  Copy,
  Sparkles
} from 'lucide-react';
import api from '../services/api';
import EmptyState from '../components/common/EmptyState';

export default function ExplorePage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchExplorePosts();
  }, []);

  const fetchExplorePosts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/posts?limit=60');
      const postData = res.data?.data || res.data?.posts || res.data || [];
      setPosts(Array.isArray(postData) ? postData : []);
    } catch (err) {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[975px] mx-auto px-1 sm:px-4 py-4 md:py-8 select-none">
      {loading ? (
        <div className="grid grid-cols-3 gap-1 md:gap-7">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="aspect-square bg-[var(--ig-elevated)] animate-pulse rounded-none md:rounded-sm" />
          ))}
        </div>
      ) : posts.length > 0 ? (
        <div className="grid grid-cols-3 gap-1 md:gap-7">
          {posts.map((post) => {
            const mediaUrls = post.mediaUrls || [];
            const primaryMedia = mediaUrls[0];
            const isVideo = primaryMedia && (primaryMedia.endsWith('.mp4') || primaryMedia.endsWith('.webm'));
            const isMultiple = mediaUrls.length > 1;

            return (
              <div
                key={post._id}
                onClick={() => navigate(`/p/${post._id}`)}
                className="relative aspect-square bg-[var(--ig-elevated)] overflow-hidden cursor-pointer group rounded-none md:rounded-sm"
              >
                {primaryMedia ? (
                  isVideo ? (
                    <video src={primaryMedia} className="w-full h-full object-cover" />
                  ) : (
                    <img 
                      src={primaryMedia} 
                      alt={post.caption || 'Explore photo'} 
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  )
                ) : (
                  <div className="w-full h-full flex items-center justify-center p-3 text-center text-xs text-[var(--ig-text-secondary)]">
                    {post.caption || post.body}
                  </div>
                )}

                {/* Top Right Media Type Badge */}
                {isMultiple && (
                  <div className="absolute top-2 right-2 text-white drop-shadow-md">
                    <Copy className="w-4 h-4 fill-white stroke-none" />
                  </div>
                )}
                {isVideo && (
                  <div className="absolute top-2 right-2 text-white drop-shadow-md">
                    <Film className="w-4 h-4 fill-white stroke-none" />
                  </div>
                )}

                {/* Desktop Hover Overlay with Likes and Comments */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6 text-white font-bold text-sm z-10">
                  <span className="flex items-center gap-1.5">
                    <Heart className="w-5 h-5 fill-white" />
                    {post.likesCount || 0}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MessageCircle className="w-5 h-5 fill-white" />
                    {post.commentsCount || (post.comments?.length || 0)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-20">
          <EmptyState 
            icon={Sparkles}
            title="Explore HumanHub"
            description="Moments from creators and friends will appear here."
          />
        </div>
      )}
    </div>
  );
}
