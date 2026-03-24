'use client';

export default function PostCardSkeleton() {
  return (
    <div className="bg-surface rounded-2xl border border-border shadow-card p-4 space-y-3 animate-pulse">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-surface-alt skeleton flex-shrink-0" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3.5 bg-surface-alt skeleton rounded-full w-32" />
          <div className="h-3 bg-surface-alt skeleton rounded-full w-20" />
        </div>
      </div>

      {/* Content */}
      <div className="space-y-2">
        <div className="h-3.5 bg-surface-alt skeleton rounded-full w-full" />
        <div className="h-3.5 bg-surface-alt skeleton rounded-full w-5/6" />
        <div className="h-3.5 bg-surface-alt skeleton rounded-full w-4/6" />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 pt-1">
        <div className="h-8 bg-surface-alt skeleton rounded-full w-16" />
        <div className="h-8 bg-surface-alt skeleton rounded-full w-16" />
        <div className="h-8 bg-surface-alt skeleton rounded-full w-16" />
      </div>
    </div>
  );
}
