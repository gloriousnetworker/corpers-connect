import withPWA from '@ducanh2912/next-pwa';

const RAILWAY_URL = 'https://corpers-connect-server-production.up.railway.app';

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
    // Explicit sizes so Next.js generates a tight srcset covering common mobile
    // screens (390–430px) and desktop feed widths (680px).
    // Without this, Next.js defaults generate 640/750/828/1080/1200… wasting
    // bandwidth on images that will never be that large in the feed.
    deviceSizes: [390, 430, 680, 828, 1080],
    imageSizes: [40, 80, 160, 320, 480],
    // 31-day browser cache for optimised images (Cloudinary CDN handles freshness)
    minimumCacheTTL: 60 * 60 * 24 * 31,
    // Serve AVIF where supported — better compression than WebP
    formats: ['image/avif', 'image/webp'],
  },
  reactStrictMode: true,

  // ── Security Headers ────────────────────────────────────────────────────────
  async headers() {
    // Build the connect-src list from the runtime env so staging/prod Railway
    // URLs are picked up automatically without hardcoding.
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? RAILWAY_URL;

    const csp = [
      // Only load scripts from the same origin. Next.js requires 'unsafe-eval'
      // in development (fast refresh) and 'unsafe-inline' for its runtime
      // chunk loading. In production only 'self' + nonces would be ideal, but
      // Next.js App Router does not yet support nonce-based CSP out of the box.
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",

      // Styles from same origin + Google Fonts stylesheet
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",

      // Fonts: same origin + Google Fonts CDN
      "font-src 'self' https://fonts.gstatic.com",

      // Images: same origin, data URIs (base64 placeholders), blob (canvas),
      // Cloudinary (user avatars / listing images), Google user profile pics
      "img-src 'self' data: blob: https://res.cloudinary.com https://*.cloudinary.com https://lh3.googleusercontent.com",

      // XHR/fetch/WebSocket: same origin, Railway API (http + ws), Firebase, Agora RTC
      `connect-src 'self' ${apiUrl} wss://${new URL(RAILWAY_URL).host} https://*.googleapis.com https://fcmregistrations.googleapis.com https://*.firebaseio.com https://*.firebaseapp.com https://*.agora.io wss://*.agora.io https://*.sd-rtn.com wss://*.sd-rtn.com`,

      // Frames: no embedding allowed (clickjacking protection)
      "frame-src 'none'",
      "frame-ancestors 'none'",

      // Only load workers from same origin (PWA service worker + Firebase SW)
      "worker-src 'self' blob:",

      // Manifests from same origin
      "manifest-src 'self'",

      // Media (audio/video for reels, calls): same origin + Cloudinary
      "media-src 'self' blob: https://res.cloudinary.com https://*.cloudinary.com",
    ].join('; ');

    const securityHeaders = [
      { key: 'Content-Security-Policy', value: csp },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(self), microphone=(self), geolocation=()' },
    ];

    return [{ source: '/(.*)', headers: securityHeaders }];
  },

  // Dev-only proxy: routes /api/proxy/* → Railway backend to avoid CORS in local dev.
  // In production NEXT_PUBLIC_API_URL points directly to Railway so this path is never used.
  async rewrites() {
    if (process.env.NODE_ENV !== 'development') return [];
    return [
      {
        source: '/api/proxy/:path*',
        destination: `${RAILWAY_URL}/:path*`,
      },
    ];
  },
};

export default withPWA({
  dest: 'public',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === 'development',
  // Serve /offline when navigation fails with no cached response
  fallbacks: {
    document: '/offline',
  },
  workboxOptions: {
    disableDevLogs: true,
    // Never precache the Firebase messaging SW — it must always be fetched
    // fresh from the network so the /api/firebase-config importScripts works
    // with the latest config, and so workbox never serves a stale version.
    exclude: [/firebase-messaging-sw\.js$/],
    runtimeCaching: [
      // Always fetch the FCM service worker and its config from the network
      {
        urlPattern: /\/firebase-messaging-sw\.js$/,
        handler: 'NetworkOnly',
      },
      {
        urlPattern: /\/api\/firebase-config/,
        handler: 'NetworkOnly',
      },
      {
        urlPattern: /^https:\/\/corpers-connect-server-production\.up\.railway\.app\/api\//,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'api-cache',
          expiration: { maxEntries: 200, maxAgeSeconds: 5 * 60 },
          networkTimeoutSeconds: 10,
        },
      },
      {
        urlPattern: /^https:\/\/res\.cloudinary\.com\//,
        handler: 'CacheFirst',
        options: {
          cacheName: 'cloudinary-cache',
          expiration: { maxEntries: 500, maxAgeSeconds: 7 * 24 * 60 * 60 },
        },
      },
    ],
  },
})(nextConfig);
