'use client';

import { CheckCircle, XCircle, Trophy } from 'lucide-react';
import type { LevelInfo } from '@/lib/api/subscriptions';
import { UserLevel } from '@/types/enums';

const LEVEL_META: Record<UserLevel, { label: string; color: string; bg: string; emoji: string }> = {
  [UserLevel.OTONDO]:  { label: 'Otondo',  color: 'text-slate-600',  bg: 'bg-slate-100',   emoji: '🌱' },
  [UserLevel.KOPA]:    { label: 'Kopa',    color: 'text-amber-600',  bg: 'bg-amber-100',   emoji: '⭐' },
  [UserLevel.CORPER]:  { label: 'Corper',  color: 'text-primary',    bg: 'bg-primary/10',  emoji: '👑' },
};

interface LevelProgressCardProps {
  levelInfo: LevelInfo;
  compact?: boolean;
}

export default function LevelProgressCard({ levelInfo, compact }: LevelProgressCardProps) {
  const meta = LEVEL_META[levelInfo.currentLevel];

  return (
    <div data-testid="level-progress-card" className="rounded-2xl border border-border bg-surface p-4 space-y-3">
      {/* Current level badge */}
      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 rounded-2xl ${meta.bg} flex items-center justify-center text-2xl flex-shrink-0`}>
          {meta.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground font-medium">Current Level</p>
          <p className={`font-bold text-lg ${meta.color}`}>{meta.label}</p>
        </div>
        {levelInfo.nextLevel === null && (
          <Trophy size={20} className="text-primary flex-shrink-0" />
        )}
      </div>

      {/* Next level requirements */}
      {levelInfo.nextLevel ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            To reach {LEVEL_META[levelInfo.nextLevel.level as UserLevel]?.label ?? levelInfo.nextLevel.level}
          </p>
          {levelInfo.nextLevel.requirements.map((req) => (
            <div key={req.label} className="flex items-start gap-2">
              {req.met
                ? <CheckCircle size={15} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                : <XCircle size={15} className="text-muted-foreground flex-shrink-0 mt-0.5" />
              }
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${req.met ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {req.label}
                </p>
                {req.current != null && req.target != null && !compact && (
                  <div className="mt-1">
                    <div className="flex justify-between text-xs text-muted-foreground mb-0.5">
                      <span>{req.current} days</span>
                      <span>{req.target} days</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${Math.min(100, (req.current / req.target) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          You have reached the highest level — Corper! 🎉
        </p>
      )}
    </div>
  );
}
