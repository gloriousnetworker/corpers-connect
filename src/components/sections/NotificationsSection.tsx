'use client';

import { Bell, CheckCheck } from 'lucide-react';
import { useUIStore } from '@/store/ui.store';

export default function NotificationsSection() {
  const setUnreadNotifications = useUIStore((s) => s.setUnreadNotifications);

  return (
    <div className="max-w-[680px] mx-auto px-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Notifications</h2>
        <button
          onClick={() => setUnreadNotifications(0)}
          className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
        >
          <CheckCheck className="w-3.5 h-3.5" />
          Mark all read
        </button>
      </div>

      {/* Empty state */}
      <div className="bg-surface rounded-2xl border border-border shadow-card p-10 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Bell className="w-7 h-7 text-primary" />
        </div>
        <p className="font-semibold text-foreground">No notifications yet</p>
        <p className="text-sm text-foreground-secondary mt-1 max-w-xs mx-auto">
          When someone likes or comments on your posts, you&apos;ll see it here.
        </p>
      </div>
    </div>
  );
}
