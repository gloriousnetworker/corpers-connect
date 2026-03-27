'use client';

import { useEffect, useRef } from 'react';
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

/**
 * Manages Firebase Cloud Messaging for push notifications.
 *
 * On login  — requests permission, gets FCM token, registers it with the backend.
 * On logout — removes the token from the backend and clears localStorage.
 * Foreground — shows an in-app sonner toast for incoming push payloads.
 *
 * Call once inside SocketInitializer (authenticated shell).
 */
export function useFCM() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const incrementUnread = useUIStore((s) => s.incrementUnread);
  const setActiveSection = useUIStore((s) => s.setActiveSection);
  const setViewingUser = useUIStore((s) => s.setViewingUser);
  const setPendingConversation = useMessagesStore((s) => s.setPendingConversation);
  const registeredRef = useRef(false);

  // Cleanup on logout
  useEffect(() => {
    if (user) return;
    const storedToken = localStorage.getItem(FCM_TOKEN_KEY);
    if (storedToken) {
      removeFcmToken(storedToken).catch(() => {});
      localStorage.removeItem(FCM_TOKEN_KEY);
    }
    registeredRef.current = false;
  }, [user]);

  // Register on login
  useEffect(() => {
    if (!user || registeredRef.current) return;

    const messaging = getFirebaseMessaging();
    if (!messaging || !VAPID_KEY) return;

    let unsubscribeForeground: (() => void) | undefined;

    (async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;

        const token = await getToken(messaging, {
          vapidKey: VAPID_KEY,
          serviceWorkerRegistration: await navigator.serviceWorker.register(
            '/firebase-messaging-sw.js',
            { scope: '/firebase-cloud-messaging-push-scope' }
          ),
        });
        if (!token) return;

        const storedToken = localStorage.getItem(FCM_TOKEN_KEY);
        if (token !== storedToken) {
          await registerFcmToken(token, 'web');
          localStorage.setItem(FCM_TOKEN_KEY, token);
        }

        registeredRef.current = true;

        // Show in-app toast for foreground push messages
        unsubscribeForeground = onMessage(messaging, (payload) => {
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
    })();

    return () => {
      unsubscribeForeground?.();
    };
  }, [user, router, incrementUnread, setActiveSection, setViewingUser, setPendingConversation]);
}
