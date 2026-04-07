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
    <div className="min-h-dvh bg-surface flex flex-col items-center overflow-y-auto">
      <div className="w-full flex flex-col md:max-w-md flex-1">
        {children}
      </div>
    </div>
  );
}
