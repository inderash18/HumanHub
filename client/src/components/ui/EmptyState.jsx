import React from 'react';
import Button from './Button';

/**
 * Enterprise EmptyState component with clear context and optional primary action.
 */
export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className = ''
}) {
  return (
    <div className={`w-full text-center py-16 px-6 bg-hub-surface border border-hub-border rounded-3xl flex flex-col items-center justify-center shadow-xl select-none ${className}`}>
      {Icon && (
        <div className="w-14 h-14 rounded-2xl bg-hub-surface-elevated border border-hub-border flex items-center justify-center text-hub-text-tertiary mb-4 shadow-sm">
          <Icon className="w-7 h-7" />
        </div>
      )}

      <h3 className="font-display text-base sm:text-lg font-bold text-hub-text-primary mb-1">
        {title}
      </h3>

      {description && (
        <p className="text-xs text-hub-text-secondary max-w-sm mx-auto mb-6 leading-relaxed">
          {description}
        </p>
      )}

      {actionLabel && onAction && (
        <Button variant="primary" size="md" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
