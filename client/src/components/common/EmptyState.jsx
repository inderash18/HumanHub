import React from 'react';
import { Sparkles } from 'lucide-react';
import Button from '../ui/Button';

export default function EmptyState({
  icon: Icon = Sparkles,
  title = 'No content yet',
  description = 'Be the first to share a moment or explore new communities.',
  actionLabel,
  onAction,
  className = ''
}) {
  return (
    <div className={`p-8 sm:p-12 rounded-3xl bg-[var(--surface)] border border-[var(--border)] text-center flex flex-col items-center justify-center max-w-md mx-auto my-6 shadow-sm ${className}`}>
      <div className="w-14 h-14 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)] flex items-center justify-center text-[var(--accent)] mb-4 shadow-inner">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="font-display text-base font-bold text-[var(--text-primary)] mb-1.5">
        {title}
      </h3>
      <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-5 max-w-xs">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button variant="primary" size="md" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
