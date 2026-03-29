'use client';

import { useEffect, useState } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import Logo from '@/components/shared/Logo';

export default function OfflinePage() {
  const [retrying, setRetrying] = useState(false);
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  // Auto-redirect when connection is restored
  useEffect(() => {
    if (isOnline) {
      window.location.href = '/';
    }
  }, [isOnline]);

  const handleRetry = async () => {
    setRetrying(true);
    try {
      const res = await fetch('/', { method: 'HEAD', cache: 'no-store' });
      if (res.ok) {
        window.location.href = '/';
        return;
      }
    } catch {
      // still offline
    }
    setRetrying(false);
  };

  return (
    <div className="min-h-dvh bg-background flex flex-col items-center justify-center px-6 text-center">
      <div className="max-w-sm w-full space-y-8">
        {/* Logo */}
        <div className="flex justify-center">
          <Logo size="md" variant="mark" />
        </div>

        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-surface-alt flex items-center justify-center">
            <WifiOff className="w-9 h-9 text-foreground-muted" />
          </div>
        </div>

        {/* Text */}
        <div className="space-y-2">
          <h1 className="text-xl font-bold text-foreground">You're offline</h1>
          <p className="text-sm text-foreground-secondary leading-relaxed">
            No internet connection detected. Some content may still be available from your last visit.
          </p>
        </div>

        {/* Retry button */}
        <button
          onClick={handleRetry}
          disabled={retrying}
          className="w-full h-12 bg-primary text-white font-semibold rounded-2xl flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-60 transition-colors"
          aria-label="Retry connection"
        >
          <RefreshCw className={`w-4 h-4 ${retrying ? 'animate-spin' : ''}`} />
          {retrying ? 'Checking connection…' : 'Try again'}
        </button>

        {/* Tips */}
        <div className="bg-surface border border-border rounded-2xl p-4 text-left space-y-2">
          <p className="text-xs font-semibold text-foreground-muted uppercase tracking-wide">While you wait</p>
          <ul className="space-y-1.5 text-sm text-foreground-secondary">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              Check your Wi-Fi or mobile data
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              Your previously loaded feed is still cached
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              Sent messages will be delivered when you reconnect
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
