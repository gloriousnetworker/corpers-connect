'use client';

import { AlertTriangle, ArrowLeft, Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cancelSubscription, checkLevel } from '@/lib/api/subscriptions';
import { useSubscriptionsStore } from '@/store/subscriptions.store';
import { useAuthStore } from '@/store/auth.store';
import { queryKeys } from '@/lib/query-keys';
import { SubscriptionTier } from '@/types/enums';

const LOST_FEATURES = [
  'CORPER level badge (reverts to KOPA or OTONDO)',
  'Boosted profile visibility in Discover',
  'Priority ranking in search results',
  'Corper Plus badge removed from profile',
];

export default function CancelConfirmPage() {
  const qc = useQueryClient();
  const { setView } = useSubscriptionsStore();
  const updateUser = useAuthStore((s) => s.updateUser);

  const cancelMutation = useMutation({
    mutationFn: cancelSubscription,
    onSuccess: async () => {
      // Downgrade auth store immediately
      updateUser({ subscriptionTier: SubscriptionTier.FREE });
      // Re-check level after downgrade
      try {
        const levelResult = await checkLevel();
        updateUser({ level: levelResult.level });
      } catch {
        // level check is best-effort
      }
      qc.invalidateQueries({ queryKey: queryKeys.subscription() });
      qc.invalidateQueries({ queryKey: queryKeys.me() });
      qc.invalidateQueries({ queryKey: queryKeys.level() });
      toast.success('Subscription cancelled');
      setView('dashboard');
    },
    onError: () => toast.error('Failed to cancel subscription. Please try again.'),
  });

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-surface border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => setView('dashboard')} className="text-foreground hover:text-primary">
          <ArrowLeft size={22} />
        </button>
        <h1 className="font-bold text-foreground text-lg flex-1">Cancel Subscription</h1>
      </div>

      <div className="flex-1 px-4 py-6 space-y-5 max-w-lg mx-auto w-full">
        {/* Warning */}
        <div className="flex gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <AlertTriangle size={20} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-800 text-sm">Are you sure?</p>
            <p className="text-amber-700 text-xs mt-0.5">
              Your Corper Plus benefits will end immediately when you cancel.
            </p>
          </div>
        </div>

        {/* What you'll lose */}
        <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
          <p className="font-semibold text-foreground text-sm">You'll lose access to:</p>
          <ul className="space-y-2">
            {LOST_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="text-red-400 mt-0.5">✕</span>
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Actions */}
        <div className="space-y-3 pt-2">
          <button
            onClick={() => setView('dashboard')}
            disabled={cancelMutation.isPending}
            className="w-full bg-primary text-primary-foreground font-semibold py-3.5 rounded-xl hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            Keep My Subscription
          </button>
          <button
            onClick={() => cancelMutation.mutate()}
            disabled={cancelMutation.isPending}
            className="w-full text-sm font-medium text-danger hover:text-danger/80 transition-colors py-2 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {cancelMutation.isPending && <Loader2 size={14} className="animate-spin" />}
            Yes, Cancel Subscription
          </button>
        </div>
      </div>
    </div>
  );
}
