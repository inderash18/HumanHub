import React, { useState } from 'react';

/**
 * Instagram-styled UserAvatar with optional gradient Story Ring
 */
export default function UserAvatar({
  src,
  name = '',
  size = 'md',
  hasStory = false,
  isStoryViewed = false,
  className = '',
  onClick
}) {
  const [imgError, setImgError] = useState(false);

  const getInitials = (text) => {
    if (!text || typeof text !== 'string') return '?';
    const clean = text.replace(/^@/, '').trim();
    if (!clean) return '?';
    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return clean.slice(0, 2).toUpperCase();
  };

  const initials = getInitials(name);

  // Exact Instagram Avatar Dimensions
  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-11 h-11 text-xs',
    lg: 'w-14 h-14 text-sm',
    xl: 'w-20 h-20 text-lg font-semibold',
    '2xl': 'w-28 h-28 text-2xl font-bold',
    '3xl': 'w-36 h-36 sm:w-40 sm:h-40 text-3xl font-bold'
  };

  const currentSize = sizeClasses[size] || sizeClasses.md;
  const showImage = Boolean(src && typeof src === 'string' && src.trim() && !imgError);

  const avatarElement = showImage ? (
    <img
      src={src}
      alt={name || 'User avatar'}
      onError={() => setImgError(true)}
      className={`w-full h-full object-cover rounded-full bg-[var(--ig-elevated)] border border-[var(--ig-border-subtle)] ${onClick ? 'cursor-pointer' : ''}`}
    />
  ) : (
    <div 
      className={`w-full h-full rounded-full bg-[var(--ig-elevated)] border border-[var(--ig-border)] text-[var(--ig-text-primary)] font-bold flex items-center justify-center select-none ${onClick ? 'cursor-pointer' : ''}`}
      title={name || 'User'}
    >
      <span>{initials}</span>
    </div>
  );

  if (hasStory) {
    const ringClass = isStoryViewed ? 'ig-story-ring-viewed' : 'ig-story-ring';
    return (
      <div 
        className={`${ringClass} ${className} ${onClick ? 'cursor-pointer' : ''}`} 
        onClick={onClick}
      >
        <div className="ig-story-inner">
          <div className={`${currentSize} relative rounded-full overflow-hidden`}>
            {avatarElement}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`relative rounded-full flex-shrink-0 flex items-center justify-center select-none overflow-hidden ${currentSize} ${className} ${onClick ? 'cursor-pointer hover:opacity-95' : ''}`} 
      onClick={onClick}
    >
      {avatarElement}
    </div>
  );
}
