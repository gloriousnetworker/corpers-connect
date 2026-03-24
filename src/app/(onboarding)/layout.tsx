import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Welcome | Corpers Connect',
};

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-surface flex flex-col">
      <div className="w-full flex-1 flex flex-col md:max-w-md md:mx-auto">
        {children}
      </div>
    </div>
  );
}
