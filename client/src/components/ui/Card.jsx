import React from 'react';

export function Card({ children, className = '', hover = false, onClick, ...props }) {
  return (
    <div
      onClick={onClick}
      className={`
        bg-hub-surface border border-hub-border rounded-3xl overflow-hidden shadow-xl
        ${hover ? 'hover:border-hub-border-subtle hover:bg-hub-surface-elevated/40 transition-all cursor-pointer' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '', ...props }) {
  return (
    <div className={`p-5 sm:p-6 border-b border-hub-border-subtle flex items-center justify-between gap-4 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '', ...props }) {
  return (
    <h3 className={`font-display text-base sm:text-lg font-bold text-hub-text-primary ${className}`} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className = '', ...props }) {
  return (
    <p className={`text-xs text-hub-text-secondary mt-0.5 ${className}`} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ children, className = '', ...props }) {
  return (
    <div className={`p-5 sm:p-6 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '', ...props }) {
  return (
    <div className={`p-4 sm:p-5 border-t border-hub-border-subtle bg-hub-surface-elevated/20 flex items-center justify-between gap-3 ${className}`} {...props}>
      {children}
    </div>
  );
}
