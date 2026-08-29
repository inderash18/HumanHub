import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * HumanHub Design System Button component
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
  const baseClasses = 'inline-flex items-center justify-center font-display font-semibold transition-all duration-150 select-none outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]';

  const variants = {
    primary: 'bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] shadow-sm',
    secondary: 'bg-[var(--surface-elevated)] hover:bg-[var(--surface-muted)] text-[var(--text-primary)] border border-[var(--border)] shadow-sm',
    outline: 'bg-transparent hover:bg-[var(--surface-elevated)] text-[var(--text-primary)] border border-[var(--border)]',
    ghost: 'bg-transparent hover:bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
    destructive: 'bg-[var(--danger)]/15 hover:bg-[var(--danger)]/25 text-[var(--danger)] border border-[var(--danger)]/30',
    cyan: 'bg-[var(--cyan)]/15 hover:bg-[var(--cyan)]/25 text-[var(--cyan)] border border-[var(--cyan)]/30',
    violet: 'bg-[var(--violet)]/15 hover:bg-[var(--violet)]/25 text-[var(--violet)] border border-[var(--violet)]/30',
    trust: 'bg-[var(--accent)]/15 hover:bg-[var(--accent)]/25 text-[var(--accent)] border border-[var(--accent)]/30',
    community: 'bg-[var(--violet)]/15 hover:bg-[var(--violet)]/25 text-[var(--violet)] border border-[var(--violet)]/30'
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 rounded-xl gap-1.5',
    md: 'text-xs px-4 py-2.5 rounded-xl gap-2',
    lg: 'text-sm px-5 py-3 rounded-2xl gap-2.5',
    icon: 'p-2 rounded-xl text-base'
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
