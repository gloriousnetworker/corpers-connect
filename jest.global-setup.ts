// Polyfill Web APIs for Jest (needed by MSW v2 in jsdom environment)
// Node 18+ has these built-in but jsdom test env doesn't expose them globally
export default async function globalSetup() {
  // Nothing needed here — polyfills are in jest.setup.ts
}
