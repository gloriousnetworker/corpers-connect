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
    <div className="min-h-dvh bg-surface flex items-start md:items-center justify-center overflow-y-auto p-0 md:p-4">
      <div className="w-full max-w-[420px] md:bg-white md:rounded-2xl md:shadow-lg md:border md:border-border">
        {children}
      </div>
    </div>
  );
}
