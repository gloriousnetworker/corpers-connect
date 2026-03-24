'use client';

import { Search, MessageCircle, Edit3 } from 'lucide-react';

export default function MessagesSection() {
  return (
    <div className="max-w-[680px] mx-auto px-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Messages</h2>
        <button className="p-2 rounded-xl bg-surface border border-border hover:bg-surface-alt transition-colors">
          <Edit3 className="w-4 h-4 text-foreground-secondary" />
        </button>
      </div>

      {/* Search bar */}
      <div className="flex items-center gap-3 px-4 py-3 bg-surface rounded-xl border border-border shadow-card">
        <Search className="w-4 h-4 text-foreground-muted flex-shrink-0" />
        <input
          type="search"
          placeholder="Search messages..."
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-foreground-muted text-foreground"
          readOnly
        />
      </div>

      {/* Empty state */}
      <div className="bg-surface rounded-2xl border border-border shadow-card p-10 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <MessageCircle className="w-7 h-7 text-primary" />
        </div>
        <p className="font-semibold text-foreground">No messages yet</p>
        <p className="text-sm text-foreground-secondary mt-1 max-w-xs mx-auto">
          Connect with corpers across Nigeria. Full messaging comes in Phase 2.
        </p>
      </div>
    </div>
  );
}
