'use client';

import { AlertTriangle } from 'lucide-react';
import { useSubscriptionsStore } from '@/store/subscriptions.store';

export default function PaymentFailedView() {
  const setView = useSubscriptionsStore((s) => s.setView);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-6 text-center">
      {/* Error icon */}
      <div className="w-24 h-24 rounded-full bg-red-100 flex items-center justify-center">
        <AlertTriangle size={48} className="text-red-500" />
      </div>

      <div className="space-y-2">
        <h2 className="font-bold text-foreground text-xl">Payment Unsuccessful</h2>
        <p className="text-muted-foreground text-sm max-w-xs">
          We couldn't confirm your payment. This may be because the transaction was cancelled,
          declined, or the reference was invalid.
        </p>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button
          onClick={() => setView('plans')}
          className="w-full bg-primary text-primary-foreground font-semibold py-3.5 rounded-xl hover:bg-primary/90 active:scale-[0.98] transition-all"
        >
          Try Again
        </button>
        <a
          href="mailto:support@corpersconnect.com"
          className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors text-center"
        >
          Contact Support
        </a>
      </div>
    </div>
  );
}
