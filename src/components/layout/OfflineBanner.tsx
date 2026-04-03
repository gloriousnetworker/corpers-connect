'use client';

import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

/**
 * OfflineBanner — renders a slim, non-blocking banner at the top of the
 * viewport when the browser reports that the network is offline.
 * Disappears automatically when connectivity is restored.
 */
export default function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    // Sync with the current state in case the page was loaded offline
    setOffline(!navigator.onLine);

    const goOffline = () => setOffline(true);
    const goOnline = () => setOffline(false);

    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-0 inset-x-0 z-[200] flex items-center justify-center gap-2 bg-warning/90 text-warning-foreground px-4 py-2 text-sm font-medium backdrop-blur-sm"
    >
      <WifiOff className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
      <span>You&apos;re offline — some features may be unavailable</span>
    </div>
  );
}
