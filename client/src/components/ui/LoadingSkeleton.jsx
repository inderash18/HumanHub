import React from 'react';

export function Skeleton({ className = '' }) {
  return (
    <div className={`bg-hub-surface-elevated/70 animate-pulse rounded-xl ${className}`} />
  );
}

export function PostCardSkeleton() {
  return (
    <div className="w-full max-w-[560px] mx-auto bg-hub-surface border border-hub-border rounded-3xl p-5 space-y-4 shadow-xl">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="space-y-1.5 flex-1">
          <Skeleton className="w-32 h-3.5" />
          <Skeleton className="w-20 h-2.5" />
        </div>
      </div>
      <Skeleton className="w-full h-16 rounded-2xl" />
      <Skeleton className="w-full h-48 rounded-2xl" />
      <div className="flex items-center justify-between pt-2">
        <div className="flex gap-2">
          <Skeleton className="w-16 h-8 rounded-xl" />
          <Skeleton className="w-16 h-8 rounded-xl" />
        </div>
        <Skeleton className="w-8 h-8 rounded-xl" />
      </div>
    </div>
  );
}

export function UserRowSkeleton() {
  return (
    <div className="flex items-center justify-between p-3 rounded-2xl bg-hub-surface border border-hub-border">
      <div className="flex items-center gap-3 flex-1">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="space-y-1.5 flex-1">
          <Skeleton className="w-28 h-3.5" />
          <Skeleton className="w-20 h-2.5" />
        </div>
      </div>
      <Skeleton className="w-16 h-7 rounded-xl" />
    </div>
  );
}
