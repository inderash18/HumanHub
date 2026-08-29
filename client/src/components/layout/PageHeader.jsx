import React from 'react';

/**
 * Standardized HumanHub PageHeader component
 */
export default function PageHeader({
  title,
  description,
  badge,
  icon: Icon,
  action,
  className = ''
}) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-hub-border select-none ${className}`}>
      <div className="space-y-1">
        <div className="flex items-center gap-2.5 flex-wrap">
          {Icon && (
            <div className="w-8 h-8 rounded-xl bg-hub-surface-elevated border border-hub-border flex items-center justify-center text-hub-accent shadow-sm">
              <Icon className="w-4 h-4" />
            </div>
          )}
          <h1 className="font-display text-xl sm:text-2xl font-bold text-hub-text-primary tracking-tight">
            {title}
          </h1>
          {badge && <div>{badge}</div>}
        </div>
        {description && (
          <p className="text-xs text-hub-text-secondary max-w-xl leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {action && (
        <div className="flex items-center gap-2.5 flex-shrink-0">
          {action}
        </div>
      )}
    </div>
  );
}
