/**
 * Jest polyfills — loaded via `setupFiles`, runs BEFORE the test environment is created.
 * But since jsdom wipes out globals, we use this to re-polyfill from Node 22's native globals.
 */

// whatwg-fetch polyfill adds fetch, Request, Response, Headers to global
require('whatwg-fetch');
