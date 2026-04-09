import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import dynamic from 'next/dynamic';
import Providers from '@/providers/Providers';

// SplashScreen must be client-only: it uses Audio, sessionStorage, and Framer Motion
// transforms that serialize differently on server vs client (causing hydration mismatches).
const SplashScreen = dynamic(() => import('@/components/splash/SplashScreen'), { ssr: false });
// InstallPrompt removed — was showing on every screen refresh. Users can
// install via the browser's native "Add to Home Screen" option instead.

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Corpers Connect',
    template: '%s | Corpers Connect',
  },
  description: "The social platform for Nigerian NYSC corps members — connect, chat, and thrive.",
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Corpers Connect',
    startupImage: [
      { url: '/icons/apple-touch-icon.png' },
    ],
  },
  formatDetection: { telephone: false },
  openGraph: {
    title: 'Corpers Connect',
    description: "Nigeria's social network for NYSC corps members",
    type: 'website',
    siteName: 'Corpers Connect',
  },
  icons: {
    icon: [
      { url: '/icons/icon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-96x96.png', sizes: '96x96', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180' }],
  },
};

export const viewport: Viewport = {
  themeColor: '#008751',
  width: 'device-width',
  initialScale: 1,
  // NOTE: We do NOT set maximumScale or userScalable here.
  // The no-zoom fix is handled purely via font-size: 16px on inputs (see globals.css).
  // Setting user-scalable=no breaks accessibility (WCAG 1.4.4).
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* iOS splash screens */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="CorpersCC" />
        {/* Preconnect to API and Cloudinary */}
        <link rel="preconnect" href="https://corpers-connect-server-production.up.railway.app" />
        <link rel="preconnect" href="https://res.cloudinary.com" />
      </head>
      <body className={`${plusJakartaSans.variable} antialiased`}>
        <Providers>
          <SplashScreen />
          {children}
        </Providers>
        {/* Portal root — all modals/sheets/overlays render here to escape stacking contexts */}
        <div id="modal-root" />
      </body>
    </html>
  );
}
