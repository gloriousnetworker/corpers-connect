'use client';

import { useEffect, useState, useCallback } from 'react';
import { isIOS, isPWAInstalled, safeLocalStorage } from '@/lib/utils';

const DISMISSED_KEY = 'cc_install_dismissed';
const COOLDOWN_DAYS = 7;

interface UsePWAInstallReturn {
  canInstall: boolean;
  isIosDevice: boolean;
  showPrompt: boolean;
  install: () => Promise<boolean>;
  dismiss: () => void;
}

// Extend the Window interface for the beforeinstallprompt event
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function usePWAInstall(): UsePWAInstallReturn {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const isIosDevice = isIOS();

  useEffect(() => {
    if (isPWAInstalled()) return;

    // Check cooldown
    const dismissed = safeLocalStorage().get(DISMISSED_KEY);
    if (dismissed) {
      const dismissedAt = parseInt(dismissed, 10);
      const cooldownMs = COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
      if (Date.now() - dismissedAt < cooldownMs) return;
    }

    // iOS: show custom instructions (no native prompt available)
    if (isIosDevice) {
      const timer = setTimeout(() => setShowPrompt(true), 3000);
      return () => clearTimeout(timer);
    }

    // Android/Desktop: capture native prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShowPrompt(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [isIosDevice]);

  const install = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setShowPrompt(false);
    return outcome === 'accepted';
  }, [deferredPrompt]);

  const dismiss = useCallback(() => {
    safeLocalStorage().set(DISMISSED_KEY, String(Date.now()));
    setShowPrompt(false);
  }, []);

  return {
    canInstall: !!deferredPrompt || isIosDevice,
    isIosDevice,
    showPrompt,
    install,
    dismiss,
  };
}
