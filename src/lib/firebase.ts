import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getMessaging, type Messaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp;

function getFirebaseApp(): FirebaseApp {
  if (!app) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  }
  return app;
}

/**
 * Returns the Firebase Messaging instance, or null when:
 * - Running server-side (SSR)
 * - Browser doesn't support service workers
 * - Firebase config is missing
 */
export function getFirebaseMessaging(): Messaging | null {
  if (typeof window === 'undefined') return null;
  if (!('serviceWorker' in navigator)) return null;
  if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) return null;
  try {
    return getMessaging(getFirebaseApp());
  } catch {
    return null;
  }
}
