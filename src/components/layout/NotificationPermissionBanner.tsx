'use client';

import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { useFCM } from '@/hooks/useFCM';
import { useAuthStore } from '@/store/auth.store';

const DISMISSED_KEY = 'cc_notif_banner_dismissed';

/**
 * WhatsApp-style bottom banner that nudges the user to enable push notifications.
 *
 * Shows when:
 *   - User is logged in
 *   - Notification.permission is 'default' (not yet decided)
 *   - User hasn't previously dismissed the banner
 *
 * Hidden when:
 *   - Already granted (silently registers FCM token via useFCM)
 *   - Already denied (can't re-request — browser enforces this)
 *   - Dismissed by the user (stored in localStorage)
 */
export default function NotificationPermissionBanner() {
  const user = useAuthStore((s) => s.user);
  const { permissionState, requestPermission } = useFCM();
  const [dismissed, setDismissed] = useState(true); // start hidden, reveal after mount

  useEffect(() => {
    // Check localStorage only client-side
    const alreadyDismissed = localStorage.getItem(DISMISSED_KEY) === '1';
    setDismissed(alreadyDismissed);
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, '1');
    setDismissed(true);
  };

  const handleEnable = async () => {
    await requestPermission();
    setDismissed(true); // hide banner after responding
  };

  // Only show to logged-in users who haven't decided yet and haven't dismissed
  if (!user || permissionState !== 'default' || dismissed) return null;

  return (
    <div className="fixed bottom-[calc(var(--bottom-nav-height,56px)+env(safe-area-inset-bottom,0px)+8px)] left-0 right-0 z-50 px-3 pointer-events-none">
      <div className="max-w-lg mx-auto pointer-events-auto">
        <div className="flex items-center gap-3 bg-surface border border-border rounded-2xl shadow-xl px-4 py-3">
          {/* Icon */}
          <div className="flex-shrink-0 w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
            <Bell className="w-4.5 h-4.5 text-primary" />
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground leading-tight">
              Enable notifications
            </p>
            <p className="text-xs text-foreground-muted mt-0.5 leading-tight">
              Get notified about messages, likes &amp; replies
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleEnable}
              className="text-xs font-bold text-white bg-primary rounded-full px-3 py-1.5 active:opacity-80 transition-opacity"
            >
              Enable
            </button>
            <button
              onClick={handleDismiss}
              className="text-foreground-muted hover:text-foreground transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
