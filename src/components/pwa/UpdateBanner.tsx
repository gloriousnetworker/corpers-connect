'use client';

import { RefreshCw } from 'lucide-react';
import { useServiceWorker } from '@/hooks/useServiceWorker';

/**
 * UpdateBanner — shown when a new app version is available.
 * Sits at the top of the page and prompts the user to reload.
 */
export default function UpdateBanner() {
  const { updateAvailable, applyUpdate } = useServiceWorker();

  if (!updateAvailable) return null;

  return (
    <div
      data-testid="update-banner"
      role="status"
      aria-live="polite"
      className="fixed top-0 left-0 right-0 z-[9999] flex items-center justify-between gap-2 px-4 py-2 bg-primary text-white text-sm font-medium shadow-lg"
    >
      <span className="truncate">A new version is available</span>
      <button
        onClick={applyUpdate}
        className="flex items-center gap-1.5 flex-shrink-0 bg-white/20 hover:bg-white/30 active:bg-white/40 px-3 py-1 rounded-full text-xs font-semibold transition-colors"
        aria-label="Update app to latest version"
      >
        <RefreshCw className="w-3 h-3" />
        Update
      </button>
    </div>
  );
}
