import React from 'react';

/**
 * HumanHub Design System Badge component
 */
export default function Badge({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  icon: Icon
}) {
  const baseClasses = 'inline-flex items-center font-mono-code font-bold uppercase tracking-wider rounded-full select-none';

  const variants = {
    default: 'bg-[var(--surface-elevated)] text-[var(--text-secondary)] border border-[var(--border)]',
    accent: 'bg-[var(--accent)] text-white font-extrabold shadow-sm',
    coral: 'bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30',
    cyan: 'bg-[var(--cyan)]/15 text-[var(--cyan)] border border-[var(--cyan)]/30',
    violet: 'bg-[var(--violet)]/15 text-[var(--violet)] border border-[var(--violet)]/30',
    community: 'bg-[var(--violet)]/15 text-[var(--violet)] border border-[var(--violet)]/30',
    success: 'bg-[var(--success)]/15 text-[var(--success)] border border-[var(--success)]/30',
    warning: 'bg-[var(--warning)]/15 text-[var(--warning)] border border-[var(--warning)]/30',
    danger: 'bg-[var(--danger)]/15 text-[var(--danger)] border border-[var(--danger)]/30',
    outline: 'bg-transparent text-[var(--text-secondary)] border border-[var(--border)]'
  };

  const sizes = {
    sm: 'text-[9px] px-2 py-0.5 gap-1',
    md: 'text-[10px] px-2.5 py-0.5 gap-1.5',
    lg: 'text-xs px-3 py-1 gap-2'
  };

  const currentVariant = variants[variant] || variants.default;
  const currentSize = sizes[size] || sizes.md;

  return (
    <span className={`${baseClasses} ${currentVariant} ${currentSize} ${className}`}>
      {Icon && <Icon className="w-3 h-3 flex-shrink-0" />}
      {children}
    </span>
  );
}
