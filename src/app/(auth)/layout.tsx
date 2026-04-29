import type { Metadata } from 'next';
import Image from 'next/image';
import GetTheAppBadges from '@/components/ui/GetTheAppBadges';

export const metadata: Metadata = {
  title: { default: 'Sign In', template: '%s | Corpers Connect' },
};

/**
 * Auth layout — no bottom nav, no top bar.
 * Full-screen centered layout for auth flows.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh overflow-y-auto bg-surface flex flex-col items-center">
      {/* Subtle brand watermark — fixed so it stays in place while form scrolls */}
      <div className="fixed inset-0 pointer-events-none select-none z-0" aria-hidden="true">
        <Image
          src="/corpersconnectlogo.jpg"
          alt=""
          fill
          className="object-cover opacity-[0.035]"
          priority={false}
        />
      </div>
      <div className="w-full max-w-[420px] relative z-10 flex-1">
        {children}
      </div>

      <div className="w-full max-w-[420px] relative z-10 px-4 py-8 mt-4 border-t border-border/40">
        <p className="text-xs uppercase tracking-widest text-foreground-muted text-center mb-3">
          Prefer the mobile app?
        </p>
        <div className="flex justify-center">
          <GetTheAppBadges variant="dark" />
        </div>
      </div>
    </div>
  );
}
