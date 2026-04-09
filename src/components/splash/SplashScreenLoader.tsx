'use client';

import dynamic from 'next/dynamic';

// ssr:false must live inside a Client Component — not allowed in Server Components.
// SplashScreen uses Audio, sessionStorage, and Framer Motion transforms that
// serialise differently server vs client, so we skip SSR entirely.
const SplashScreen = dynamic(() => import('./SplashScreen'), { ssr: false });

export default function SplashScreenLoader() {
  return <SplashScreen />;
}
