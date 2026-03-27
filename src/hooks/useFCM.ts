'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getToken, onMessage } from 'firebase/messaging';
import { toast } from 'sonner';
import { getFirebaseMessaging } from '@/lib/firebase';
import { registerFcmToken, removeFcmToken } from '@/lib/api/users';
import { getConversation } from '@/lib/api/conversations';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import { useMessagesStore } from '@/store/messages.store';

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
const FCM_TOKEN_KEY = 'cc_fcm_token';

export type NotificationPermission = 'default' | 'granted' | 'denied';

/**
 * Manages Firebase Cloud Messaging for push notifications.
 *
 * Returns:
 *   permissionState — current Notification.permission value
 *   requestPermission — call this (on a user gesture) to prompt for permission
 *                       and register the FCM token if granted
 */
export function useFCM() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const incrementUnread = useUIStore((s) => s.incrementUnread);
  const setActiveSection = useUIStore((s) => s.setActiveSection);
  const setViewingUser = useUIStore((s) => s.setViewingUser);
  const setPendingConversation = useMessagesStore((s) => s.setPendingConversation);
  const registeredRef = useRef(false);
  const unsubscribeRef = useRef<(() => void) | undefined>(undefined);

  const [permissionState, setPermissionState] = useState<NotificationPermission>(() => {
    if (typeof Notification === 'undefined') return 'default';
    return Notification.permission as NotificationPermission;
  });

  // Cleanup on logout
  useEffect(() => {
    if (user) return;
    const storedToken = localStorage.getItem(FCM_TOKEN_KEY);
    if (storedToken) {
      removeFcmToken(storedToken).catch(() => {});
      localStorage.removeItem(FCM_TOKEN_KEY);
    }
    unsubscribeRef.current?.();
    unsubscribeRef.current = undefined;
    registeredRef.current = false;
  }, [user]);

  // Core: get FCM token and start listening to foreground messages
  const registerAndListen = useCallback(async () => {
    if (!user || registeredRef.current) return;

    const messaging = getFirebaseMessaging();
    if (!messaging || !VAPID_KEY) return;

    try {
      const swReg = await navigator.serviceWorker.register(
        '/firebase-messaging-sw.js',
        { scope: '/firebase-cloud-messaging-push-scope' }
      );

      const token = await getToken(messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: swReg,
      });
      if (!token) return;

      const storedToken = localStorage.getItem(FCM_TOKEN_KEY);
      if (token !== storedToken) {
        await registerFcmToken(token, 'web');
        localStorage.setItem(FCM_TOKEN_KEY, token);
      }

      registeredRef.current = true;

      // Show in-app toast for foreground push messages
      unsubscribeRef.current?.();
      unsubscribeRef.current = onMessage(messaging, (payload) => {
        const title = payload.notification?.title ?? 'New notification';
        const body  = payload.notification?.body  ?? '';
        const data  = payload.data ?? {};

        const handleView = () => {
          const { type, entityType, entityId, actorId } = data;
          if (type === 'DM_RECEIVED' && entityId) {
            getConversation(entityId)
              .then((conv) => {
                setPendingConversation(conv);
                setActiveSection('messages');
              })
              .catch(() => setActiveSection('messages'));
          } else if (entityType === 'Post' && entityId) {
            router.push(`/post/${entityId}`);
          } else if (actorId) {
            setViewingUser(actorId);
          } else {
            setActiveSection('notifications');
          }
        };

        incrementUnread();
        toast(title, {
          description: body || undefined,
          action: { label: 'View', onClick: handleView },
          duration: 5000,
        });
      });
    } catch {
      // Permission denied or messaging not supported — fail silently
    }
  }, [user, router, incrementUnread, setActiveSection, setViewingUser, setPendingConversation]);

  // Request notification permission then register (call from a user-gesture handler)
  const requestPermission = useCallback(async () => {
    if (typeof Notification === 'undefined') return;
    const result = await Notification.requestPermission();
    setPermissionState(result as NotificationPermission);
    if (result === 'granted') {
      await registerAndListen();
    }
  }, [registerAndListen]);

  // Auto-register silently when permission is already granted on login
  useEffect(() => {
    if (!user) return;
    if (typeof Notification === 'undefined') return;
    const current = Notification.permission as NotificationPermission;
    setPermissionState(current);
    if (current === 'granted') {
      registerAndListen();
    }
  }, [user, registerAndListen]);

  return { permissionState, requestPermission };
}
