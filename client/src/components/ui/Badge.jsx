import React from 'react';

/**
 * HumanHub Design System Badge component (Instagram Refined Edition)
 */
export default function Badge({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  icon: Icon
}) {
  const baseClasses = 'inline-flex items-center font-medium rounded-md select-none transition-all duration-150';

  const variants = {
    default: 'bg-[var(--surface-elevated)] text-[var(--text-secondary)] border border-[var(--border)]',
    primary: 'bg-[#0095F6]/10 text-[#0095F6] border border-[#0095F6]/20',
    accent: 'bg-[#0095F6] text-white',
    success: 'bg-[#00BA88]/10 text-[#00BA88] border border-[#00BA88]/20',
    warning: 'bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20',
    danger: 'bg-[#ED4956]/10 text-[#ED4956] border border-[#ED4956]/20',
    outline: 'bg-transparent text-[var(--text-secondary)] border border-[var(--border)]'
  };

  const sizes = {
    xs: 'text-[10px] px-1.5 py-0.5 gap-1',
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-0.5 gap-1.5',
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
