/**
 * Firebase Cloud Messaging — background push handler
 *
 * This service worker handles push notifications when the app is in the
 * background or closed.  It must live at /firebase-messaging-sw.js (public root).
 *
 * IMPORTANT: Replace the placeholder values below with your real Firebase
 * config once you have the credentials from the Firebase console.
 * These are public-facing keys; it is safe to commit them.
 */

importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// ---------------------------------------------------------------------------
// Firebase config — must match NEXT_PUBLIC_FIREBASE_* env vars in your app
// ---------------------------------------------------------------------------
firebase.initializeApp({
  apiKey:            self.FIREBASE_API_KEY            || '',
  authDomain:        self.FIREBASE_AUTH_DOMAIN        || '',
  projectId:         self.FIREBASE_PROJECT_ID         || '',
  messagingSenderId: self.FIREBASE_MESSAGING_SENDER_ID || '',
  appId:             self.FIREBASE_APP_ID             || '',
});

const messaging = firebase.messaging();

// ---------------------------------------------------------------------------
// Background message handler
// Called when a push arrives and the app tab is not focused / is closed.
// ---------------------------------------------------------------------------
messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title ?? 'Corpers Connect';
  const body  = payload.notification?.body  ?? '';

  self.registration.showNotification(title, {
    body,
    icon:  '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    data:  payload.data ?? {},
    // Open (or focus) the app when the notification is tapped
    tag: 'corpers-connect-notification',
  });
});

// ---------------------------------------------------------------------------
// Tap handler — bring the app to focus when user taps a notification
// ---------------------------------------------------------------------------
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      const appUrl = self.location.origin;
      for (const client of clientList) {
        if (client.url.startsWith(appUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow(appUrl);
    })
  );
});
