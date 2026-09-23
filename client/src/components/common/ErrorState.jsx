import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import Button from '../ui/Button';

export default function ErrorState({
  title = "Something went wrong",
  message = "We couldn't load this content right now. Please try again.",
  onRetry,
  className = ""
}) {
  return (
    <div className={`p-8 text-center bg-[var(--surface)] border border-[var(--danger)]/20 rounded-3xl flex flex-col items-center justify-center max-w-md mx-auto shadow-xl ${className}`}>
      <div className="w-12 h-12 rounded-2xl bg-[var(--danger)]/10 border border-[var(--danger)]/20 flex items-center justify-center text-[var(--danger)] mb-4">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h3 className="font-display text-base font-bold text-[var(--text-primary)] mb-1">
        {title}
      </h3>
      <p className="text-xs text-[var(--text-secondary)] mb-5 max-w-xs leading-relaxed">
        {message}
      </p>
      {onRetry && (
        <Button
          variant="secondary"
          size="sm"
          onClick={onRetry}
          icon={RefreshCw}
        >
          Try Again
        </Button>
      )}
    </div>
  );
}
