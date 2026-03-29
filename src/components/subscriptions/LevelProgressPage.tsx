'use client';

import { ArrowLeft } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getLevel } from '@/lib/api/subscriptions';
import { useSubscriptionsStore } from '@/store/subscriptions.store';
import { queryKeys } from '@/lib/query-keys';
import LevelProgressCard from './LevelProgressCard';
import { UserLevel } from '@/types/enums';

const LEVEL_PERKS: Record<UserLevel, { emoji: string; perks: string[] }> = {
  [UserLevel.OTONDO]: {
    emoji: '🌱',
    perks: ['Access to all standard features', 'Connect with fellow corpers', 'Post and engage in the feed'],
  },
  [UserLevel.KOPA]: {
    emoji: '⭐',
    perks: ['Everything in Otondo', 'Kopa badge on profile', 'Increased trust signal from others'],
  },
  [UserLevel.CORPER]: {
    emoji: '👑',
    perks: ['Everything in Kopa', 'CORPER badge on profile', 'Boosted Discover visibility', 'Priority in search results', 'Corper Plus badge'],
  },
};

export default function LevelProgressPage() {
  const setView = useSubscriptionsStore((s) => s.setView);

  const { data: levelInfo, isLoading } = useQuery({
    queryKey: queryKeys.level(),
    queryFn: getLevel,
    staleTime: 60_000,
  });

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-surface border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => setView('dashboard')} className="text-foreground hover:text-primary">
          <ArrowLeft size={22} />
        </button>
        <h1 className="font-bold text-foreground text-lg flex-1">Level & Progression</h1>
      </div>

      <div className="flex-1 px-4 py-5 space-y-5 max-w-lg mx-auto w-full">
        {isLoading ? (
          <div className="space-y-3">
            <div className="h-32 rounded-2xl bg-muted animate-pulse" />
            <div className="h-24 rounded-2xl bg-muted animate-pulse" />
          </div>
        ) : levelInfo ? (
          <>
            <LevelProgressCard levelInfo={levelInfo} />

            {/* All levels + perks */}
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground text-sm">All Levels</h3>
              {(Object.values(UserLevel) as UserLevel[]).map((lvl) => {
                const meta = LEVEL_PERKS[lvl];
                const isCurrent = levelInfo.currentLevel === lvl;
                return (
                  <div
                    key={lvl}
                    className={[
                      'rounded-2xl border p-4 space-y-2',
                      isCurrent ? 'border-primary bg-primary/5' : 'border-border bg-surface',
                    ].join(' ')}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{meta.emoji}</span>
                      <span className="font-bold text-foreground">{lvl.charAt(0) + lvl.slice(1).toLowerCase()}</span>
                      {isCurrent && (
                        <span className="text-[11px] font-semibold bg-primary text-primary-foreground px-2 py-0.5 rounded-full ml-auto">
                          Current
                        </span>
                      )}
                    </div>
                    <ul className="space-y-1">
                      {meta.perks.map((p) => (
                        <li key={p} className="text-xs text-muted-foreground flex items-start gap-1.5">
                          <span className="text-primary mt-0.5">•</span>
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
