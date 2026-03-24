import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { default: 'Sign In', template: '%s | Corpers Connect' },
};

/**
 * Auth layout — no bottom nav, no top bar.
 * Full-screen centered layout for auth flows.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-dvh bg-surface overflow-y-auto">
      {children}
    </div>
  );
}
