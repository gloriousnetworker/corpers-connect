'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { Tent, Sparkles, Plus, Lock, Globe, Users } from 'lucide-react';
import { queryKeys } from '@/lib/query-keys';
import { getMyCampExperience, getUserCampExperience } from '@/lib/api/camp-experience';
import { getOptimisedUrl } from '@/lib/utils';
import type { CampDayEntry, CampMood } from '@/types/models';
import CampDayEditor from './CampDayEditor';
import CampYearbookCard from './CampYearbookCard';

interface CampExperienceSectionProps {
  userId: string;
  isOwn: boolean;
}

// Map each mood to a small emoji so day tiles communicate vibe at a glance
const MOOD_EMOJI: Record<CampMood, string> = {
  HAPPY: '😊',
  TIRED: '😴',
  EXCITED: '🤩',
  HOMESICK: '🥺',
  GRATEFUL: '🙏',
  FUNNY: '😂',
  PROUD: '😎',
  STRESSED: '😰',
  BORED: '😐',
  INSPIRED: '✨',
};

export default function CampExperienceSection({ userId, isOwn }: CampExperienceSectionProps) {
  const [editingDay, setEditingDay] = useState<number | null>(null);
  const [yearbookOpen, setYearbookOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: isOwn ? queryKeys.myCamp() : queryKeys.userCamp(userId),
    queryFn: () => (isOwn ? getMyCampExperience() : getUserCampExperience(userId)),
    staleTime: 30_000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const days = data?.days ?? Array(21).fill(null);
  const completed = data?.completedCount ?? 0;
  const progressPct = Math.round((completed / 21) * 100);

  return (
    <div className="px-4 py-4">
      {/* Hero: progress + call to action */}
      <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 p-4 mb-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
            <Tent className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-foreground text-sm">My Camp Experience</h3>
            <p className="text-xs text-foreground-muted mt-0.5">
              {isOwn
                ? 'Document each day of your 21-day NYSC orientation camp. One day at a time.'
                : `${completed} of 21 days shared`}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-foreground-secondary">
              {completed} / 21 days
            </span>
            <span className="text-[11px] text-foreground-muted">{progressPct}%</span>
          </div>
          <div className="h-1.5 bg-black/8 dark:bg-white/8 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-emerald-500 transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Yearbook CTA at completion */}
        {completed >= 21 && (
          <button
            onClick={() => setYearbookOpen(true)}
            className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold shadow hover:opacity-90 active:scale-[0.98] transition"
          >
            <Sparkles className="w-4 h-4" />
            View my Camp Yearbook
          </button>
        )}
      </div>

      {/* 21-day grid */}
      <div className="grid grid-cols-3 gap-2">
        {days.map((entry, idx) => {
          const day = idx + 1;
          return (
            <DayTile
              key={day}
              day={day}
              entry={entry}
              isOwn={isOwn}
              onClick={() => {
                if (entry || isOwn) setEditingDay(day);
              }}
            />
          );
        })}
      </div>

      {/* Share-yearbook card even before completion (any progress) */}
      {isOwn && completed >= 7 && completed < 21 && (
        <button
          onClick={() => setYearbookOpen(true)}
          className="mt-4 w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-primary/30 text-primary text-xs font-semibold hover:bg-primary/5 transition"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Preview yearbook so far
        </button>
      )}

      {/* Day editor / viewer */}
      {editingDay !== null && (
        <CampDayEditor
          dayNumber={editingDay}
          userId={userId}
          existing={days[editingDay - 1] ?? null}
          readOnly={!isOwn}
          onClose={() => setEditingDay(null)}
        />
      )}

      {/* Yearbook share card */}
      {yearbookOpen && (
        <CampYearbookCard
          days={days.filter((d): d is CampDayEntry => !!d)}
          completed={completed}
          onClose={() => setYearbookOpen(false)}
        />
      )}
    </div>
  );
}

function DayTile({
  day,
  entry,
  isOwn,
  onClick,
}: {
  day: number;
  entry: CampDayEntry | null;
  isOwn: boolean;
  onClick: () => void;
}) {
  const clickable = !!entry || isOwn;
  const thumb = entry?.mediaUrls[0];

  return (
    <button
      onClick={onClick}
      disabled={!clickable}
      className={`relative aspect-square rounded-xl overflow-hidden border transition ${
        entry
          ? 'border-border'
          : 'border-dashed border-border/70 bg-surface-alt'
      } ${clickable ? 'hover:shadow-md active:scale-[0.97]' : 'opacity-40 cursor-not-allowed'}`}
    >
      {thumb ? (
        <>
          <Image
            src={getOptimisedUrl(thumb, 300)}
            alt={`Day ${day}`}
            fill
            className="object-cover"
            sizes="(max-width: 680px) 33vw, 220px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        </>
      ) : entry ? (
        <div className="w-full h-full bg-gradient-to-br from-primary/10 to-emerald-500/10" />
      ) : null}

      {/* Day label */}
      <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-sm text-[10px] font-bold text-white uppercase tracking-wide">
        Day {day}
      </div>

      {/* Mood emoji */}
      {entry?.mood && (
        <div className="absolute top-1.5 right-1.5 text-lg leading-none drop-shadow-md">
          {MOOD_EMOJI[entry.mood]}
        </div>
      )}

      {/* Title / empty hint */}
      {entry ? (
        <div className="absolute bottom-1.5 left-1.5 right-1.5">
          {entry.title && (
            <p className="text-[11px] font-semibold text-white line-clamp-2 drop-shadow">
              {entry.title}
            </p>
          )}
          <div className="flex items-center gap-1 mt-0.5">
            <VisibilityIcon visibility={entry.visibility} />
            {entry.isHighlight && (
              <Sparkles className="w-2.5 h-2.5 text-amber-300 drop-shadow" />
            )}
          </div>
        </div>
      ) : isOwn ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-foreground-muted">
          <Plus className="w-4 h-4" />
          <span className="text-[10px] font-medium">Add entry</span>
        </div>
      ) : null}
    </button>
  );
}

function VisibilityIcon({ visibility }: { visibility: CampDayEntry['visibility'] }) {
  if (visibility === 'PRIVATE') return <Lock className="w-2.5 h-2.5 text-white/70" />;
  if (visibility === 'FRIENDS') return <Users className="w-2.5 h-2.5 text-white/70" />;
  return <Globe className="w-2.5 h-2.5 text-white/70" />;
}
