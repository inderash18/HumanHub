import React from 'react';

export function PostSkeleton() {
  return (
    <div className="p-5 rounded-3xl bg-[var(--surface)] border border-[var(--border)] animate-pulse space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[var(--surface-elevated)]" />
        <div className="space-y-1.5 flex-1">
          <div className="w-28 h-3.5 rounded bg-[var(--surface-elevated)]" />
          <div className="w-16 h-2.5 rounded bg-[var(--surface-elevated)]" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="w-full h-3 rounded bg-[var(--surface-elevated)]" />
        <div className="w-4/5 h-3 rounded bg-[var(--surface-elevated)]" />
      </div>
      <div className="w-full h-48 rounded-2xl bg-[var(--surface-elevated)]" />
      <div className="flex items-center justify-between pt-2">
        <div className="w-16 h-4 rounded bg-[var(--surface-elevated)]" />
        <div className="w-16 h-4 rounded bg-[var(--surface-elevated)]" />
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border)] animate-pulse space-y-6">
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <div className="w-24 h-24 rounded-full bg-[var(--surface-elevated)]" />
        <div className="space-y-3 text-center sm:text-left flex-1">
          <div className="w-40 h-5 rounded bg-[var(--surface-elevated)] mx-auto sm:mx-0" />
          <div className="w-24 h-3.5 rounded bg-[var(--surface-elevated)] mx-auto sm:mx-0" />
          <div className="w-full max-w-sm h-3 rounded bg-[var(--surface-elevated)]" />
          <div className="flex items-center justify-center sm:justify-start gap-6 pt-2">
            <div className="w-16 h-4 rounded bg-[var(--surface-elevated)]" />
            <div className="w-16 h-4 rounded bg-[var(--surface-elevated)]" />
            <div className="w-16 h-4 rounded bg-[var(--surface-elevated)]" />
          </div>
        </div>
      </div>
    </div>
  );
}
