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
 *   1. Backend calls FCM with data-only payload (no notification field)
 *   2. When app is OPEN    → onMessage()           fires in the page (toast shown)
 *   3. When app is CLOSED  → onBackgroundMessage() fires here → showNotification()
 *   4. User taps the notification → notificationclick fires → opens deep-link URL
 *
 * Data-only is critical: sending a notification payload causes the browser to
 * auto-show AND onBackgroundMessage to fire — resulting in duplicate notifications.
 * With data-only, onBackgroundMessage is the single renderer on all platforms.
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
    // Backend sends data-only — all fields arrive in payload.data
    const data = payload.data ?? {};

    const title = data.title ?? 'Corpers Connect';
    const body  = data.body  ?? '';

    self.registration.showNotification(title, {
      body,
      icon:               data.icon  ?? '/icons/icon-192x192.png',
      badge:              data.badge ?? '/icons/icon-72x72.png',
      // Persist in the notification center until explicitly dismissed
      requireInteraction: true,
      // Collapse duplicate notifications from the same source
      tag:                data.tag ?? 'corpers-connect',
      // Show notification even if one with same tag already exists (e.g. new DM)
      renotify:           true,
      // Vibration pattern (ms): buzz — pause — buzz
      vibrate:            [200, 100, 200],
      // Pass the full data payload so notificationclick can route correctly
      data: {
        url:        data.url        ?? '/',
        type:       data.type       ?? '',
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

  const data     = event.notification.data ?? {};
  const deepPath = data.url || '/';
  const targetUrl = deepPath.startsWith('http')
    ? deepPath
    : self.location.origin + deepPath;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Find any open app window/tab
      const appClient = clientList.find((c) =>
        c.url.startsWith(self.location.origin)
      );

      if (appClient) {
        // App is already open — post the routing data so the in-app handler
        // can navigate without relying on URL params (which useEffect([]) won't
        // re-read after the initial mount).
        appClient.postMessage({ type: 'NOTIFICATION_CLICK', ...data });
        return 'focus' in appClient ? appClient.focus() : Promise.resolve();
      }

      // App is fully closed — open at the deep-link URL.
      // DeepLinkHandler reads ?conv= on cold start and routes correctly.
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
