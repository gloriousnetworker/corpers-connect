'use client';

import { MapPin, Calendar, Settings, LogOut } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';

export default function ProfileSection() {
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const initials = [user?.firstName?.[0], user?.lastName?.[0]]
    .filter(Boolean)
    .join('')
    .toUpperCase() || 'CC';

  return (
    <div className="max-w-[680px] mx-auto px-4 space-y-4">
      {/* Profile card */}
      <div className="bg-surface rounded-2xl border border-border shadow-card overflow-hidden">
        {/* Cover banner */}
        <div className="h-32 bg-gradient-to-br from-primary to-primary-dark" />

        {/* Avatar + info */}
        <div className="px-5 pb-6">
          <div className="-mt-11 mb-3">
            <div className="w-20 h-20 rounded-2xl bg-surface-alt border-4 border-surface flex items-center justify-center shadow-card">
              <span className="text-2xl font-bold text-primary">{initials}</span>
            </div>
          </div>

          <h1 className="text-xl font-bold text-foreground">
            {user?.firstName ?? 'Corper'} {user?.lastName ?? ''}
          </h1>
          <p className="text-sm text-foreground-secondary mt-0.5">
            {user?.stateCode ?? 'NYSC Member'}
          </p>

          <div className="flex flex-wrap gap-4 mt-3">
            {user?.servingState && (
              <span className="flex items-center gap-1.5 text-xs text-foreground-secondary">
                <MapPin className="w-3.5 h-3.5" />
                {user.servingState}
              </span>
            )}
            {user?.batch && (
              <span className="flex items-center gap-1.5 text-xs text-foreground-secondary">
                <Calendar className="w-3.5 h-3.5" />
                Batch {user.batch}
              </span>
            )}
          </div>

          {/* Stats */}
          <div className="flex gap-8 mt-5 pt-4 border-t border-border">
            {[
              ['Posts', '0'],
              ['Followers', '0'],
              ['Following', '0'],
            ].map(([label, count]) => (
              <div key={label}>
                <p className="text-xl font-bold text-foreground">{count}</p>
                <p className="text-xs text-foreground-secondary">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-surface rounded-2xl border border-border shadow-card overflow-hidden divide-y divide-border">
        <button className="w-full flex items-center gap-3 px-5 py-4 hover:bg-surface-alt transition-colors text-left">
          <Settings className="w-4 h-4 text-foreground-secondary flex-shrink-0" />
          <span className="text-sm font-medium text-foreground">Account Settings</span>
        </button>
        <button
          onClick={clearAuth}
          className="w-full flex items-center gap-3 px-5 py-4 hover:bg-danger/5 transition-colors text-left"
        >
          <LogOut className="w-4 h-4 text-danger flex-shrink-0" />
          <span className="text-sm font-medium text-danger">Sign Out</span>
        </button>
      </div>
    </div>
  );
}
