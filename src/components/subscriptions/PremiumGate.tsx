'use client';

import { Lock } from 'lucide-react';
import type { ReactNode } from 'react';
import { useUIStore } from '@/store/ui.store';

interface PremiumGateProps {
  children: ReactNode;
  locked?: boolean;
  reason?: string;
}

/**
 * Wraps content behind a blur + CTA overlay when `locked` is true.
 * Usage: <PremiumGate locked={user.subscriptionTier !== 'PREMIUM'} reason="...">
 */
export default function PremiumGate({ children, locked, reason }: PremiumGateProps) {
  const setActiveSection = useUIStore((s) => s.setActiveSection);

  if (!locked) return <>{children}</>;

  return (
    <div data-testid="premium-gate" className="relative">
      {/* Blurred background content */}
      <div className="blur-sm pointer-events-none select-none" aria-hidden>
        {children}
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface/80 backdrop-blur-[2px] rounded-xl gap-3 p-6 text-center z-10">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Lock size={22} className="text-primary" />
        </div>
        <div>
          <p className="font-bold text-foreground text-sm">Corper Plus Required</p>
          {reason && <p className="text-xs text-muted-foreground mt-0.5">{reason}</p>}
        </div>
        <button
          onClick={() => setActiveSection('subscriptions')}
          className="bg-primary text-primary-foreground text-sm font-semibold px-5 py-2 rounded-xl hover:bg-primary/90 active:scale-95 transition-all"
        >
          Upgrade to Corper Plus
        </button>
      </div>
    </div>
  );
}
