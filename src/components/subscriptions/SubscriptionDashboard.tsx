'use client';

import { Crown, History, TrendingUp, XCircle, Calendar, CheckCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getCurrentSubscription, getLevel } from '@/lib/api/subscriptions';
import { useSubscriptionsStore } from '@/store/subscriptions.store';
import { useAuthStore } from '@/store/auth.store';
import { queryKeys } from '@/lib/query-keys';
import { SubscriptionTier } from '@/types/enums';
import LevelProgressCard from './LevelProgressCard';

const PREMIUM_BULLETS = [
  '👑 CORPER level badge',
  '🔍 Boosted Discover visibility',
  '⭐ Priority in search results',
  '🛡️ Verified Corper Plus badge',
];

function daysRemaining(endDate: string) {
  const diff = new Date(endDate).getTime() - Date.now();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

export default function SubscriptionDashboard() {
  const { setView } = useSubscriptionsStore();
  const user = useAuthStore((s) => s.user);
  const isPremium = user?.subscriptionTier === SubscriptionTier.PREMIUM;

  const { data: subscription, isLoading: subLoading } = useQuery({
    queryKey: queryKeys.subscription(),
    queryFn: getCurrentSubscription,
    staleTime: 60_000,
  });

  const { data: levelInfo, isLoading: levelLoading } = useQuery({
    queryKey: queryKeys.level(),
    queryFn: getLevel,
    staleTime: 60_000,
  });

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-surface border-b border-border px-4 py-3">
        <h1 className="font-bold text-foreground text-lg">Corper Plus</h1>
      </div>

      <div className="flex-1 px-4 py-5 space-y-4 max-w-lg mx-auto w-full">
        {/* ── FREE USER ── */}
        {!isPremium && (
          <>
            {/* Upgrade pitch */}
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl border border-primary/20 p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-primary/15 flex items-center justify-center">
                  <Crown size={26} className="text-primary" />
                </div>
                <div>
                  <p className="font-bold text-foreground">Upgrade to Corper Plus</p>
                  <p className="text-xs text-muted-foreground">Unlock the full experience</p>
                </div>
              </div>
              <ul className="space-y-1.5">
                {PREMIUM_BULLETS.map((b) => (
                  <li key={b} className="text-sm text-foreground">{b}</li>
                ))}
              </ul>
              <button
                onClick={() => setView('plans')}
                className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl hover:bg-primary/90 active:scale-[0.98] transition-all text-sm"
              >
                See Plans & Pricing
              </button>
            </div>

            {/* Level card */}
            {levelLoading ? (
              <div className="h-28 rounded-2xl bg-muted animate-pulse" />
            ) : levelInfo ? (
              <LevelProgressCard levelInfo={levelInfo} />
            ) : null}

            <button
              onClick={() => setView('level')}
              className="w-full text-sm text-primary font-medium hover:underline text-center"
            >
              View level details →
            </button>
          </>
        )}

        {/* ── PREMIUM USER ── */}
        {isPremium && (
          <>
            {/* Active subscription card */}
            {subLoading ? (
              <div className="h-36 rounded-2xl bg-muted animate-pulse" />
            ) : subscription ? (
              <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Crown size={22} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-foreground text-sm">
                      Corper Plus {subscription.plan === 'MONTHLY' ? 'Monthly' : 'Annual'}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <CheckCircle size={12} className="text-emerald-500" />
                      <p className="text-xs text-emerald-600 font-medium">Active</p>
                    </div>
                  </div>
                </div>

                {/* End date + days remaining */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar size={14} />
                  <span>
                    Expires {new Date(subscription.endDate).toLocaleDateString('en-NG', {
                      day: 'numeric', month: 'long', year: 'numeric',
                    })}
                  </span>
                  <span className="ml-auto text-xs font-semibold text-primary">
                    {daysRemaining(subscription.endDate)} days left
                  </span>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{
                        width: `${Math.min(100, (daysRemaining(subscription.endDate) / (subscription.plan === 'MONTHLY' ? 30 : 365)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-700">
                Your subscription has expired. Subscribe again to keep your Corper Plus benefits.
                <button onClick={() => setView('plans')} className="block mt-2 font-semibold underline">
                  Re-subscribe →
                </button>
              </div>
            )}

            {/* Level progress */}
            {levelLoading ? (
              <div className="h-28 rounded-2xl bg-muted animate-pulse" />
            ) : levelInfo ? (
              <LevelProgressCard levelInfo={levelInfo} compact />
            ) : null}

            {/* Action links */}
            <div className="bg-surface border border-border rounded-2xl divide-y divide-border/60">
              <button
                onClick={() => setView('history')}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/40 transition-colors text-left"
              >
                <History size={18} className="text-muted-foreground flex-shrink-0" />
                <span className="text-sm font-medium text-foreground">Subscription History</span>
              </button>
              <button
                onClick={() => setView('level')}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/40 transition-colors text-left"
              >
                <TrendingUp size={18} className="text-muted-foreground flex-shrink-0" />
                <span className="text-sm font-medium text-foreground">Level & Progression</span>
              </button>
              {subscription && (
                <button
                  onClick={() => setView('cancel-confirm')}
                  className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-red-50 transition-colors text-left"
                >
                  <XCircle size={18} className="text-danger flex-shrink-0" />
                  <span className="text-sm font-medium text-danger">Cancel Subscription</span>
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
