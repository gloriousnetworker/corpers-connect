'use client';

import { useEffect, useState, useCallback } from 'react';

interface ServiceWorkerState {
  /** A new SW version is waiting to activate */
  updateAvailable: boolean;
  /** Trigger the waiting SW to take over and reload */
  applyUpdate: () => void;
}

/**
 * useServiceWorker — detects when a new service worker version is waiting.
 *
 * When `updateAvailable` is true, show the UpdateBanner and call
 * `applyUpdate()` to reload with the new version.
 */
export function useServiceWorker(): ServiceWorkerState {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const updateAvailable = !!waitingWorker;

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    const checkForWaiting = (reg: ServiceWorkerRegistration) => {
      if (reg.waiting) {
        setWaitingWorker(reg.waiting);
      }
    };

    navigator.serviceWorker.ready.then((reg) => {
      // Already has a waiting worker on load
      checkForWaiting(reg);

      // New SW installed while page is open
      reg.addEventListener('updatefound', () => {
        const installing = reg.installing;
        if (!installing) return;
        installing.addEventListener('statechange', () => {
          if (installing.state === 'installed' && navigator.serviceWorker.controller) {
            setWaitingWorker(installing);
          }
        });
      });
    });

    // If the controller changed (another tab triggered skipWaiting), reload too
    let refreshing = false;
    const handleControllerChange = () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    };
    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    };
  }, []);

  const applyUpdate = useCallback(() => {
    if (!waitingWorker) return;
    // Tell the waiting SW to take control immediately
    waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    setWaitingWorker(null);
  }, [waitingWorker]);

  return { updateAvailable, applyUpdate };
}
