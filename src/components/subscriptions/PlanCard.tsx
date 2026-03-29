'use client';

import { Check, Loader2, Crown } from 'lucide-react';
import type { SubscriptionPlanInfo } from '@/types/models';

interface PlanCardProps {
  plan: SubscriptionPlanInfo;
  onSelect: () => void;
  isSelected?: boolean;
  loading?: boolean;
}

export default function PlanCard({ plan, onSelect, isSelected, loading }: PlanCardProps) {
  const isAnnual = plan.id === 'ANNUAL';

  return (
    <div
      data-testid="plan-card"
      className={[
        'relative flex flex-col rounded-2xl border-2 p-5 transition-all',
        isAnnual
          ? 'border-primary bg-primary/5'
          : 'border-border bg-surface hover:border-primary/40',
      ].join(' ')}
    >
      {/* Popular badge */}
      {isAnnual && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[11px] font-bold px-3 py-0.5 rounded-full whitespace-nowrap">
          Best Value
        </span>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <div className="flex items-center gap-1.5 mb-0.5">
            <Crown size={15} className={isAnnual ? 'text-primary' : 'text-amber-500'} />
            <h3 className="font-bold text-foreground text-base">
              {isAnnual ? 'Annual' : 'Monthly'}
            </h3>
          </div>
          {plan.savings && (
            <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
              {plan.savings}
            </span>
          )}
        </div>
        <div className="text-right">
          <p className="font-bold text-foreground text-xl leading-tight">{plan.priceFormatted}</p>
          <p className="text-xs text-muted-foreground">
            {isAnnual ? 'per year' : 'per month'}
          </p>
        </div>
      </div>

      {/* Features */}
      <ul className="flex-1 space-y-2 mb-5">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-foreground">
            <Check size={14} className="text-primary flex-shrink-0 mt-0.5" />
            {f}
          </li>
        ))}
      </ul>

      {/* CTA */}
      <button
        onClick={onSelect}
        disabled={loading || isSelected}
        className={[
          'w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2',
          isAnnual
            ? 'bg-primary text-primary-foreground hover:bg-primary/90'
            : 'bg-foreground text-background hover:bg-foreground/90',
          (loading || isSelected) ? 'opacity-70 cursor-not-allowed' : 'active:scale-[0.98]',
        ].join(' ')}
      >
        {loading ? (
          <><Loader2 size={15} className="animate-spin" /> Processing…</>
        ) : (
          `Get ${isAnnual ? 'Annual' : 'Monthly'} Plan`
        )}
      </button>
    </div>
  );
}
