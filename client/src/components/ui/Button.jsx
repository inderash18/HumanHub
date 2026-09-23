import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * HumanHub Design System Button component (Instagram Refined Edition)
 */
export default function Button({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  className = '',
  icon: Icon,
  onClick,
  ...props
}) {
  const baseClasses = 'inline-flex items-center justify-center font-medium transition-all duration-150 select-none outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)] disabled:opacity-50 disabled:cursor-not-allowed active:opacity-70 cursor-pointer';

  const variants = {
    primary: 'bg-[#0095F6] hover:bg-[#1877F2] text-white font-semibold rounded-lg shadow-none',
    secondary: 'bg-[var(--surface-elevated)] hover:opacity-80 text-[var(--text-primary)] font-semibold rounded-lg border border-[var(--border)]',
    outline: 'bg-transparent hover:bg-[var(--surface-elevated)] text-[var(--text-primary)] border border-[var(--border)] font-semibold rounded-lg',
    ghost: 'bg-transparent hover:bg-[var(--surface-elevated)] text-[var(--text-primary)] font-semibold rounded-lg',
    danger: 'bg-[#ED4956] hover:bg-[#df3c49] text-white font-semibold rounded-lg',
    destructive: 'bg-[#ED4956] hover:bg-[#df3c49] text-white font-semibold rounded-lg',
    link: 'bg-transparent text-[#0095F6] hover:text-[#1877F2] font-semibold p-0 h-auto'
  };

  const sizes = {
    xs: 'text-xs px-2.5 py-1 rounded-md gap-1.5',
    sm: 'text-xs px-3.5 py-1.5 rounded-lg gap-1.5',
    md: 'text-sm px-4 py-2 rounded-lg gap-2',
    lg: 'text-sm px-6 py-2.5 rounded-lg gap-2',
    icon: 'p-2 rounded-lg text-base'
  };

  const currentVariant = variants[variant] || variants.primary;
  const currentSize = sizes[size] || sizes.md;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`${baseClasses} ${currentVariant} ${currentSize} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : Icon ? (
        <Icon className="w-4 h-4 flex-shrink-0" />
      ) : null}
      {children}
    </button>
  );
}
