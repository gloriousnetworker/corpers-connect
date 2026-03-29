'use client';

import { ArrowLeft } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getPlans, initializePayment } from '@/lib/api/subscriptions';
import { queryKeys } from '@/lib/query-keys';
import { useSubscriptionsStore } from '@/store/subscriptions.store';
import { SubscriptionPlan } from '@/types/enums';
import PlanCard from './PlanCard';

const PREMIUM_FEATURES = [
  { icon: '👑', label: 'CORPER level badge on your profile' },
  { icon: '🔍', label: 'Boosted visibility in Discover' },
  { icon: '⭐', label: 'Priority ranking in search results' },
  { icon: '🛡️', label: 'Verified Corper Plus badge' },
  { icon: '💬', label: 'Priority support from the team' },
];

export default function PlansPage() {
  const { setView, setPendingReference } = useSubscriptionsStore();

  const { data: plans, isLoading } = useQuery({
    queryKey: queryKeys.plans(),
    queryFn: getPlans,
    staleTime: 60 * 60_000,
  });

  const initMutation = useMutation({
    mutationFn: (plan: SubscriptionPlan) =>
      initializePayment(plan, typeof window !== 'undefined' ? window.location.origin + '/' : undefined),
    onSuccess: (result) => {
      setPendingReference(result.reference);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('cc_paystack_ref', result.reference);
        window.location.href = result.authorizationUrl;
      }
    },
    onError: (err: Error) => {
      if (err.message?.includes('409') || err.message?.toLowerCase().includes('active')) {
        toast.error('You already have an active subscription');
      } else {
        toast.error('Could not start payment. Please try again.');
      }
    },
  });

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-surface border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => setView('dashboard')} className="text-foreground hover:text-primary">
          <ArrowLeft size={22} />
        </button>
        <h1 className="font-bold text-foreground text-lg flex-1">Corper Plus Plans</h1>
      </div>

      <div className="flex-1 px-4 py-5 space-y-6 max-w-lg mx-auto w-full">
        {/* Hero */}
        <div className="text-center">
          <p className="text-3xl mb-2">👑</p>
          <h2 className="font-bold text-foreground text-xl">Upgrade to Corper Plus</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Unlock the full Corpers Connect experience
          </p>
        </div>

        {/* Feature highlights */}
        <div className="bg-primary/5 rounded-2xl p-4 space-y-2">
          {PREMIUM_FEATURES.map((f) => (
            <div key={f.label} className="flex items-center gap-3 text-sm text-foreground">
              <span className="text-base flex-shrink-0">{f.icon}</span>
              {f.label}
            </div>
          ))}
        </div>

        {/* Plan cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-64 rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {/* Show annual first (best value) */}
            {[...(plans ?? [])].reverse().map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                onSelect={() => initMutation.mutate(plan.id)}
                loading={initMutation.isPending && initMutation.variables === plan.id}
              />
            ))}
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground">
          Secure payment via Paystack · Cancel anytime · NGN billing
        </p>
      </div>
    </div>
  );
}
