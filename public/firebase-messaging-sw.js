/**
 * Firebase Cloud Messaging — background push handler
 *
 * Handles push notifications when the app tab is in the background or closed.
 * Must live at /firebase-messaging-sw.js (public root).
 *
 * Firebase config is loaded at runtime via /api/firebase-config because
 * service workers cannot access process.env / NEXT_PUBLIC_* variables.
 *
 * How push delivery works:
 *   1. Backend calls FCM with notification + webpush fields
 *   2. When app is OPEN    → onMessage()           fires in the page (toast shown)
 *   3. When app is CLOSED  → onBackgroundMessage() fires here → showNotification()
 *   4. User taps the notification → notificationclick fires → opens deep-link URL
 */

importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// Load Firebase config injected by the Next.js API route.
// self.__FIREBASE_CONFIG is set as a side-effect of this script.
try {
  importScripts('/api/firebase-config');
} catch (e) {
  console.warn('[FCM SW] Could not load firebase config:', e);
}

const firebaseConfig = (typeof self.__FIREBASE_CONFIG !== 'undefined')
  ? self.__FIREBASE_CONFIG
  : {};

// Only initialise if we have a valid projectId
if (firebaseConfig.projectId) {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  /**
   * onBackgroundMessage fires when:
   *   - The app tab is not focused OR the app is completely closed
   *   - A push message arrives from FCM
   *
   * We ALWAYS call showNotification() here so the OS notification center
   * receives the notification regardless of whether the browser auto-shows it.
   *
   * The webpush.notification payload from the backend provides:
   *   title, body, icon, badge, requireInteraction, tag, renotify, vibrate, data
   */
  messaging.onBackgroundMessage((payload) => {
    const n    = payload.notification ?? {};
    const data = payload.data ?? {};

    // Prefer the rich webpush notification fields; fall back to root notification
    const title = n.title ?? 'Corpers Connect';
    const body  = n.body  ?? '';

    self.registration.showNotification(title, {
      body,
      icon:               '/icons/icon-192x192.png',
      badge:              '/icons/icon-72x72.png',
      // Persist in the notification center until explicitly dismissed
      requireInteraction: true,
      // Collapse duplicate notifications from the same source
      tag:                data.type && data.entityId
                            ? `cc-${data.type}-${data.entityId}`
                            : 'corpers-connect',
      // Show notification even if one with same tag already exists (e.g. new DM)
      renotify:           true,
      // Vibration pattern (ms): buzz — pause — buzz
      vibrate:            [200, 100, 200],
      // Pass the full data payload so notificationclick can route correctly
      data:               {
        url:        data.url  ?? '/',
        type:       data.type ?? '',
        entityType: data.entityType ?? '',
        entityId:   data.entityId   ?? '',
        actorId:    data.actorId    ?? '',
      },
    });
  });
}

// ---------------------------------------------------------------------------
// notificationclick — fires when the user taps the notification
// ---------------------------------------------------------------------------
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data      = event.notification.data ?? {};
  const deepPath  = data.url || '/';
  const targetUrl = deepPath.startsWith('http')
    ? deepPath
    : self.location.origin + deepPath;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // 1. If there is already a tab open at the exact target URL, focus it
      for (const client of clientList) {
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      // 2. If any app tab is open, navigate it to the target URL
      for (const client of clientList) {
        if (client.url.startsWith(self.location.origin) && 'navigate' in client) {
          return client.navigate(targetUrl).then((c) => c && c.focus());
        }
      }
      // 3. App is fully closed — open a new window at the target URL
      return clients.openWindow(targetUrl);
    })
  );
});

// ---------------------------------------------------------------------------
// notificationclose — optional: track dismissed notifications
// ---------------------------------------------------------------------------
self.addEventListener('notificationclose', () => {
  // Could send analytics here if needed
});
