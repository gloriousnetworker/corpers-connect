'use client';

import { Image as ImageIcon, Smile, PenSquare } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';

export default function FeedSection() {
  const user = useAuthStore((s) => s.user);
  const setCreatePostOpen = useUIStore((s) => s.setCreatePostOpen);

  return (
    <div className="max-w-[680px] mx-auto px-4 space-y-4">
      {/* Create post card */}
      <div className="bg-surface rounded-2xl border border-border shadow-card p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-primary uppercase">
              {user?.firstName?.[0] ?? 'C'}
            </span>
          </div>
          <button
            onClick={() => setCreatePostOpen(true)}
            className="flex-1 text-left px-4 py-2.5 bg-surface-alt rounded-full text-sm text-foreground-muted hover:bg-border/60 transition-colors"
          >
            What&apos;s on your mind, {user?.firstName ?? 'Corper'}?
          </button>
        </div>

        <div className="flex items-center gap-1 mt-3 pt-3 border-t border-border">
          <button
            onClick={() => setCreatePostOpen(true)}
            className="flex flex-1 items-center justify-center gap-2 py-2 rounded-xl hover:bg-surface-alt transition-colors text-sm font-medium text-foreground-secondary"
          >
            <ImageIcon className="w-4 h-4 text-info" />
            <span>Photo</span>
          </button>
          <button
            onClick={() => setCreatePostOpen(true)}
            className="flex flex-1 items-center justify-center gap-2 py-2 rounded-xl hover:bg-surface-alt transition-colors text-sm font-medium text-foreground-secondary"
          >
            <Smile className="w-4 h-4 text-warning" />
            <span>Feeling</span>
          </button>
          <button
            onClick={() => setCreatePostOpen(true)}
            className="flex flex-1 items-center justify-center gap-2 py-2 rounded-xl hover:bg-surface-alt transition-colors text-sm font-medium text-foreground-secondary"
          >
            <PenSquare className="w-4 h-4 text-primary" />
            <span>Write</span>
          </button>
        </div>
      </div>

      {/* Empty feed placeholder */}
      <div className="bg-surface rounded-2xl border border-border shadow-card p-10 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">🏡</span>
        </div>
        <p className="font-semibold text-foreground">Your feed is empty for now</p>
        <p className="text-sm text-foreground-secondary mt-1">
          Phase 2 — Feed &amp; Posts — coming next.
        </p>
      </div>
    </div>
  );
}
