'use client';

import { CheckCircle } from 'lucide-react';
import { useSubscriptionsStore } from '@/store/subscriptions.store';
import { useUIStore } from '@/store/ui.store';

export default function PaymentSuccessView() {
  const reset = useSubscriptionsStore((s) => s.reset);
  const setActiveSection = useUIStore((s) => s.setActiveSection);

  const handleGoToProfile = () => {
    reset();
    setActiveSection('profile');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-6 text-center">
      {/* Success icon */}
      <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center">
        <CheckCircle size={52} className="text-emerald-500" />
      </div>

      <div className="space-y-2">
        <p className="text-3xl">🎉</p>
        <h2 className="font-bold text-foreground text-2xl">You're Corper Plus!</h2>
        <p className="text-muted-foreground text-sm max-w-xs">
          Welcome to the premium experience. Your CORPER badge is now active and your
          profile visibility has been boosted.
        </p>
      </div>

      {/* Level badge */}
      <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full">
        <span className="text-lg">👑</span>
        <span className="font-bold text-primary text-sm">CORPER Level Unlocked</span>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button
          onClick={handleGoToProfile}
          className="w-full bg-primary text-primary-foreground font-semibold py-3.5 rounded-xl hover:bg-primary/90 active:scale-[0.98] transition-all"
        >
          View My Profile
        </button>
        <button
          onClick={() => { reset(); }}
          className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Back to Subscriptions
        </button>
      </div>
    </div>
  );
}
