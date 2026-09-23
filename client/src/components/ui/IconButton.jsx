import React from 'react';

/**
 * HumanHub Design System IconButton
 */
export default function IconButton({
  icon: Icon,
  label,
  onClick,
  variant = 'secondary',
  size = 'md',
  disabled = false,
  className = '',
  badge = null,
  ...props
}) {
  const variants = {
    primary: 'bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]',
    secondary: 'bg-[var(--surface-elevated)] hover:bg-[var(--surface-muted)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)]',
    ghost: 'bg-transparent hover:bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
    danger: 'bg-[var(--danger)]/15 hover:bg-[var(--danger)]/25 text-[var(--danger)] border border-[var(--danger)]/30'
  };

  const sizes = {
    sm: 'p-1.5 rounded-lg',
    md: 'p-2 rounded-xl',
    lg: 'p-2.5 rounded-2xl'
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`relative inline-flex items-center justify-center transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 ${variants[variant] || variants.secondary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {badge !== null && badge > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-[var(--accent)] text-white text-[9px] font-bold flex items-center justify-center border-2 border-[var(--surface)]">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </button>
  );
}
