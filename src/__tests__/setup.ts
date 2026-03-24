import '@testing-library/jest-dom';

// ── Step 1: Polyfill Node globals into jsdom env ─────────────────────────────
// jsdom doesn't expose TextEncoder/TextDecoder or Node fetch APIs.
// These are needed by MSW v2 before the server is initialized.
import { TextEncoder, TextDecoder } from 'util';
(global as unknown as Record<string, unknown>).TextEncoder = TextEncoder;
(global as unknown as Record<string, unknown>).TextDecoder = TextDecoder;

// Copy Node 22's native Web APIs into jsdom's global (jsdom may not include these)
// IMPORTANT: In jsdom env, `global` is the jsdom window, NOT Node's global.
// We must import Node-specific APIs via `require` rather than reading from globalThis.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const streamWeb = require('stream/web');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { BroadcastChannel } = require('worker_threads');

// These might be available on jsdom's globalThis if whatwg-fetch polyfill ran
const webGlobals: Record<string, unknown> = {
  BroadcastChannel,
  ReadableStream: streamWeb.ReadableStream,
  WritableStream: streamWeb.WritableStream,
  TransformStream: streamWeb.TransformStream,
  ReadableStreamDefaultReader: streamWeb.ReadableStreamDefaultReader,
  ReadableStreamBYOBReader: streamWeb.ReadableStreamBYOBReader,
};

// Only set if not already defined (whatwg-fetch polyfill may have already set fetch/Response/etc.)
for (const [key, val] of Object.entries(webGlobals)) {
  if (val !== undefined && typeof (global as Record<string, unknown>)[key] === 'undefined') {
    Object.defineProperty(global, key, { value: val, writable: true, configurable: true });
  }
}
// Always set BroadcastChannel (jsdom won't have it)
Object.defineProperty(global, 'BroadcastChannel', { value: BroadcastChannel, writable: true, configurable: true });

// ── Step 2: Now safe to load MSW ─────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { server } = require('./mocks/server') as { server: { listen: (o: object) => void; resetHandlers: () => void; close: () => void } };

// ── Step 3: MSW lifecycle ────────────────────────────────────────────────────
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ── Step 4: Mock Next.js navigation ──────────────────────────────────────────
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/feed',
  useSearchParams: () => new URLSearchParams(),
}));

// ── Step 5: Mock next/image ───────────────────────────────────────────────────
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: { src: string; alt: string; [key: string]: unknown }) => {
    // eslint-disable-next-line @next/next/no-img-element
    return require('react').createElement('img', { src, alt, ...props });
  },
}));

// ── Step 6: Stub Framer Motion ────────────────────────────────────────────────
jest.mock('framer-motion', () => {
  const React = require('react');
  const create = (tag: string) => ({ children, ...rest }: { children?: React.ReactNode; [key: string]: unknown }) =>
    React.createElement(tag, rest, children);
  const tags = ['div', 'span', 'p', 'section', 'article', 'aside', 'nav', 'header', 'footer', 'main', 'ul', 'li'];
  return {
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
    motion: Object.fromEntries(tags.map((t) => [t, create(t)])),
    useAnimation: () => ({ start: jest.fn(), stop: jest.fn(), set: jest.fn() }),
    useMotionValue: (initial: unknown) => ({ get: () => initial, set: jest.fn(), onChange: jest.fn() }),
    useTransform: jest.fn(),
    useSpring: jest.fn(),
    useScroll: () => ({ scrollX: { get: () => 0 }, scrollY: { get: () => 0 } }),
  };
});
