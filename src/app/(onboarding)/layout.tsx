import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Welcome | Corpers Connect',
};

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-surface md:bg-gradient-to-br md:from-primary/5 md:via-surface md:to-surface flex flex-col md:items-center md:justify-center md:p-6">
      <div className="w-full flex-1 flex flex-col md:flex-none md:max-w-md md:bg-surface md:rounded-2xl md:shadow-xl md:border md:border-border/50 md:overflow-hidden">
        {children}
      </div>
    </div>
  );
}
