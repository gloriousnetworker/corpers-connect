import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Welcome | Corpers Connect',
};

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-dvh bg-surface">
      {children}
    </div>
  );
}
