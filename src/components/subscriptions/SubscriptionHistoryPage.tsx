'use client';

import { ArrowLeft, Receipt } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getSubscriptionHistory } from '@/lib/api/subscriptions';
import { useSubscriptionsStore } from '@/store/subscriptions.store';
import { queryKeys } from '@/lib/query-keys';
import { SubscriptionStatus } from '@/types/enums';
import type { Subscription } from '@/types/models';

const STATUS_STYLE: Record<SubscriptionStatus, { label: string; cls: string }> = {
  [SubscriptionStatus.ACTIVE]:    { label: 'Active',    cls: 'bg-emerald-100 text-emerald-700' },
  [SubscriptionStatus.EXPIRED]:   { label: 'Expired',   cls: 'bg-muted text-muted-foreground'  },
  [SubscriptionStatus.CANCELLED]: { label: 'Cancelled', cls: 'bg-red-100 text-red-600'         },
};

function formatKobo(kobo: number) {
  return `₦${(kobo / 100).toLocaleString('en-NG')}`;
}

export default function SubscriptionHistoryPage() {
  const setView = useSubscriptionsStore((s) => s.setView);

  const { data: history, isLoading } = useQuery({
    queryKey: queryKeys.subscriptionHistory(),
    queryFn: getSubscriptionHistory,
    staleTime: 60_000,
  });

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-surface border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => setView('dashboard')} className="text-foreground hover:text-primary">
          <ArrowLeft size={22} />
        </button>
        <h1 className="font-bold text-foreground text-lg flex-1">Subscription History</h1>
      </div>

      <div className="flex-1 px-4 py-4 space-y-3">
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        )}

        {!isLoading && (!history || history.length === 0) && (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
            <Receipt size={48} className="text-muted-foreground/40" />
            <p className="font-semibold text-foreground">No subscription history yet</p>
            <p className="text-sm text-muted-foreground">Your past subscriptions will appear here</p>
          </div>
        )}

        {history?.map((sub: Subscription) => {
          const statusMeta = STATUS_STYLE[sub.status];
          return (
            <div key={sub.id} className="bg-surface border border-border rounded-2xl p-4 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-foreground text-sm">
                    Corper Plus {sub.plan === 'MONTHLY' ? 'Monthly' : 'Annual'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(sub.startDate).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {' → '}
                    {new Date(sub.endDate).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full flex-shrink-0 ${statusMeta.cls}`}>
                  {statusMeta.label}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/60">
                <span>{formatKobo(sub.amountKobo)}</span>
                {sub.paystackRef && (
                  <span className="font-mono opacity-60">#{sub.paystackRef.slice(-8)}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
