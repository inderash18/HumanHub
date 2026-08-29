import React, { useState } from 'react';

/**
 * Universal HumanHub UserAvatar component
 * - If real avatar URL exists, displays genuine user photo.
 * - If no avatar or image fails, renders clean initials badge.
 * - Zero fake faces, zero random stock photos.
 */
export default function UserAvatar({
  src,
  name = '',
  size = 'md',
  className = '',
  onClick
}) {
  const [imgError, setImgError] = useState(false);

  // Compute clean initials from display name or username
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

  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-xs',
    lg: 'w-12 h-12 text-sm',
    xl: 'w-16 h-16 text-base font-bold',
    '2xl': 'w-24 h-24 text-2xl font-bold',
    '3xl': 'w-32 h-32 text-3xl font-bold'
  };

  const currentSize = sizeClasses[size] || sizeClasses.md;
  const showImage = Boolean(src && typeof src === 'string' && src.trim() && !imgError);

  const containerClasses = `
    relative rounded-full flex-shrink-0 flex items-center justify-center font-display select-none overflow-hidden
    ${currentSize}
    ${onClick ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''}
    ${className}
  `.trim();

  if (showImage) {
    return (
      <div className={containerClasses} onClick={onClick}>
        <img
          src={src}
          alt={name || 'User avatar'}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover rounded-full bg-[var(--surface)] border border-[var(--border)]"
        />
      </div>
    );
  }

  return (
    <div 
      className={`${containerClasses} bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--text-primary)] font-bold`}
      onClick={onClick}
      title={name || 'User'}
    >
      <span className="font-mono-code tracking-wider">{initials}</span>
    </div>
  );
}
