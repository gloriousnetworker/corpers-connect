'use client';

import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { verifyPayment } from '@/lib/api/subscriptions';
import { useSubscriptionsStore } from '@/store/subscriptions.store';
import { useAuthStore } from '@/store/auth.store';
import { queryKeys } from '@/lib/query-keys';
import { SubscriptionTier, UserLevel } from '@/types/enums';

export default function PaymentPendingView() {
  const qc = useQueryClient();
  const { pendingReference, setView } = useSubscriptionsStore();
  const updateUser = useAuthStore((s) => s.updateUser);

  const verifyMutation = useMutation({
    mutationFn: (ref: string) => verifyPayment(ref),
    onSuccess: () => {
      // Optimistically upgrade auth store so UI reflects CORPER immediately
      updateUser({ subscriptionTier: SubscriptionTier.PREMIUM, level: UserLevel.CORPER });
      qc.invalidateQueries({ queryKey: queryKeys.subscription() });
      qc.invalidateQueries({ queryKey: queryKeys.me() });
      qc.invalidateQueries({ queryKey: queryKeys.level() });
      // Clear session storage ref
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('cc_paystack_ref');
      }
      setView('payment-success');
    },
    onError: () => {
      setView('payment-failed');
    },
  });

  useEffect(() => {
    const ref = pendingReference ?? (typeof window !== 'undefined' ? sessionStorage.getItem('cc_paystack_ref') : null);
    if (ref && !verifyMutation.isPending && !verifyMutation.isSuccess && !verifyMutation.isError) {
      verifyMutation.mutate(ref);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5 px-6 text-center">
      <Loader2 size={48} className="animate-spin text-primary" />
      <div>
        <p className="font-bold text-foreground text-lg">Confirming your payment…</p>
        <p className="text-sm text-muted-foreground mt-1">
          Please wait while we verify your transaction with Paystack.
        </p>
      </div>
    </div>
  );
}
