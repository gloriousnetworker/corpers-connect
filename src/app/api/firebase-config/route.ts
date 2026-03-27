/**
 * GET /api/firebase-config
 *
 * Returns the public Firebase web config as executable JavaScript so that
 * the firebase-messaging-sw.js service worker can importScripts() it.
 * Service workers have no access to process.env, so we inject the values
 * via this API route at runtime.
 *
 * These are the *public* NEXT_PUBLIC_* keys — safe to serve over HTTP.
 */
export function GET() {
  const config = {
    apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY            ?? '',
    authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN        ?? '',
    projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID         ?? '',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
    appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID             ?? '',
  };

  const js = `self.__FIREBASE_CONFIG = ${JSON.stringify(config)};`;

  return new Response(js, {
    headers: {
      'Content-Type': 'application/javascript',
      // Never cache — config may change on redeploy
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}
