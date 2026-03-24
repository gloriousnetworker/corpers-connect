import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { STORAGE_KEYS } from '@/lib/constants';

const PUBLIC_PATHS = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/2fa',
];

const ONBOARDING_PATH = '/onboarding';
const DEFAULT_AUTH_PATH = '/';
const DEFAULT_UNAUTH_PATH = '/login';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow static files and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/icons') ||
    pathname === '/manifest.json' ||
    pathname === '/sw.js' ||
    pathname === '/workbox-*' ||
    pathname === '/health' ||
    /\.(png|jpg|jpeg|svg|ico|webp|woff2?)$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  // Check session cookie (lightweight auth check)
  const sessionCookie = request.cookies.get(STORAGE_KEYS.SESSION_FLAG);
  const hasSession = !!sessionCookie?.value;

  const isPublicPath = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  );

  // Root path — authenticated users land on dashboard, others go to login
  if (pathname === '/') {
    if (!hasSession) {
      return NextResponse.redirect(new URL(DEFAULT_UNAUTH_PATH, request.url));
    }
    return NextResponse.next(); // authenticated: serve the dashboard
  }

  // Authenticated user trying to access auth pages → redirect to feed
  if (hasSession && isPublicPath) {
    return NextResponse.redirect(new URL(DEFAULT_AUTH_PATH, request.url));
  }

  // Unauthenticated user trying to access protected pages → redirect to login
  if (!hasSession && !isPublicPath && pathname !== ONBOARDING_PATH) {
    const loginUrl = new URL(DEFAULT_UNAUTH_PATH, request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js|workbox|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)).*)',
  ],
};
