/**
 * Firebase Cloud Messaging — background push handler
 *
 * Handles push notifications when the app tab is in the background or closed.
 * Must live at /firebase-messaging-sw.js (public root).
 *
 * Firebase config is loaded at runtime via /api/firebase-config because
 * service workers cannot access process.env / NEXT_PUBLIC_* variables.
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

const firebaseConfig = self.__FIREBASE_CONFIG || {};

// Only initialise if we have a valid config (projectId at minimum)
if (firebaseConfig.projectId) {
  firebase.initializeApp(firebaseConfig);

  const messaging = firebase.messaging();

  // ---------------------------------------------------------------------------
  // Background message handler
  // Called when a push arrives and the app tab is not focused / is closed.
  // ---------------------------------------------------------------------------
  messaging.onBackgroundMessage((payload) => {
    const title = payload.notification?.title ?? 'Corpers Connect';
    const body  = payload.notification?.body  ?? '';
    const data  = payload.data ?? {};

    self.registration.showNotification(title, {
      body,
      icon:  '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      data,
      // Collapse duplicate notifications from the same conversation/post
      tag:    data.entityId ? `cc-${data.type}-${data.entityId}` : 'corpers-connect',
      // Keep the notification visible until the user interacts
      requireInteraction: true,
      // Actions shown on Android / desktop — "Open" is always available
      actions: [
        { action: 'open', title: 'Open' },
      ],
    });
  });
}

// ---------------------------------------------------------------------------
// Tap handler — open the deep-link URL when the user taps a notification
// ---------------------------------------------------------------------------
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data       = event.notification.data ?? {};
  const deepPath   = data.url || '/';
  const targetUrl  = deepPath.startsWith('http')
    ? deepPath
    : self.location.origin + deepPath;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If there is already an open tab at exactly the target URL, focus it
      for (const client of clientList) {
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      // If any open app tab exists, navigate it to the target URL
      for (const client of clientList) {
        if (client.url.startsWith(self.location.origin) && 'navigate' in client) {
          return client.navigate(targetUrl).then((c) => c && c.focus());
        }
      }
      // Otherwise open a new window/tab
      return clients.openWindow(targetUrl);
    })
  );
});
