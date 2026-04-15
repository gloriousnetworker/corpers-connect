'use client';

import Image from 'next/image';
import { X, Sparkles, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth.store';
import { getOptimisedUrl } from '@/lib/utils';
import type { CampDayEntry, CampMood } from '@/types/models';

interface CampYearbookCardProps {
  days: CampDayEntry[];
  completed: number;
  onClose: () => void;
}

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

export default function CampYearbookCard({ days, completed, onClose }: CampYearbookCardProps) {
  const user = useAuthStore((s) => s.user);

  // Highlight days first, then fill with normal days sorted by dayNumber
  const highlights = days.filter((d) => d.isHighlight).sort((a, b) => a.dayNumber - b.dayNumber);
  const regular = days.filter((d) => !d.isHighlight).sort((a, b) => a.dayNumber - b.dayNumber);
  const ordered = [...highlights, ...regular];

  const campName = days.find((d) => d.campName)?.campName;

  const handleShare = async () => {
    const shareText = `My NYSC Camp Experience — ${completed} of 21 days documented on Corpers Connect 🇳🇬🏕️`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'My Camp Yearbook', text: shareText });
      } else {
        await navigator.clipboard.writeText(shareText);
        toast.success('Copied! Paste anywhere to share.');
      }
    } catch {
      /* user cancelled share */
    }
  };

  return (
    <div className="fixed inset-0 z-[160] bg-black flex flex-col">
      {/* Header */}
      <div className="sticky top-0 bg-black/80 backdrop-blur-sm px-4 py-3 flex items-center justify-between border-b border-white/10 z-10">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <h2 className="text-sm font-bold text-white">My Camp Yearbook</h2>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleShare}
            className="p-2 rounded-full text-white hover:bg-white/10"
            aria-label="Share"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-white hover:bg-white/10"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Scrollable yearbook body */}
      <div className="flex-1 overflow-y-auto">
        {/* Cover */}
        <div className="relative min-h-[60vh] flex flex-col items-center justify-center text-center px-6 py-12 bg-gradient-to-br from-primary/30 via-emerald-500/20 to-black">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.12),transparent_60%)]" />
          <Sparkles className="w-10 h-10 text-amber-300 mb-4 relative z-10" />
          <p className="text-white/70 text-xs uppercase tracking-[0.3em] font-semibold mb-2 relative z-10">
            NYSC Camp Yearbook
          </p>
          <h1 className="text-3xl font-black text-white leading-tight relative z-10">
            {user?.firstName} {user?.lastName}
          </h1>
          {campName && (
            <p className="text-white/80 text-sm mt-2 relative z-10">{campName}</p>
          )}
          <p className="text-white/60 text-xs mt-1 relative z-10">
            {user?.batch} · {user?.servingState}
          </p>
          <div className="mt-8 px-5 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 relative z-10">
            <p className="text-white text-xs font-semibold">
              {completed} / 21 days · {Math.round((completed / 21) * 100)}% documented
            </p>
          </div>
        </div>

        {/* Days */}
        <div className="px-4 py-6 space-y-4 bg-black">
          {ordered.map((day) => (
            <div
              key={day.id}
              className="rounded-2xl overflow-hidden bg-white/5 border border-white/10"
            >
              {/* Header strip */}
              <div className="flex items-center justify-between px-4 py-2 bg-white/5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-primary">
                    Day {day.dayNumber}
                  </span>
                  {day.isHighlight && (
                    <Sparkles className="w-3 h-3 text-amber-400" />
                  )}
                </div>
                {day.mood && (
                  <span className="text-lg">{MOOD_EMOJI[day.mood]}</span>
                )}
              </div>

              {/* Hero image */}
              {day.mediaUrls[0] && (
                <div className="relative w-full aspect-video">
                  <Image
                    src={getOptimisedUrl(day.mediaUrls[0], 680)}
                    alt={day.title ?? `Day ${day.dayNumber}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 680px) 100vw, 680px"
                  />
                </div>
              )}

              {/* Content */}
              <div className="p-4">
                {day.title && (
                  <h3 className="text-white font-bold text-sm mb-1.5">{day.title}</h3>
                )}
                {day.story && (
                  <p className="text-white/80 text-xs leading-relaxed whitespace-pre-wrap line-clamp-[12]">
                    {day.story}
                  </p>
                )}

                {/* Secondary thumbnails */}
                {day.mediaUrls.length > 1 && (
                  <div className="mt-3 grid grid-cols-4 gap-1.5">
                    {day.mediaUrls.slice(1, 5).map((url, idx) => (
                      <div key={idx} className="relative aspect-square rounded-md overflow-hidden">
                        <Image
                          src={getOptimisedUrl(url, 240)}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Tagged friends */}
                {day.taggedUsers && day.taggedUsers.length > 0 && (
                  <p className="mt-3 text-[11px] text-white/60">
                    With{' '}
                    {day.taggedUsers
                      .map((u) => `${u.firstName} ${u.lastName}`)
                      .slice(0, 3)
                      .join(', ')}
                    {day.taggedUsers.length > 3 && ` and ${day.taggedUsers.length - 3} more`}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-8 text-center bg-black border-t border-white/10">
          <p className="text-white/40 text-[10px] uppercase tracking-[0.3em]">
            Corpers Connect
          </p>
          <p className="text-white/60 text-xs mt-1">
            Every camp memory in one place. Forever.
          </p>
        </div>
      </div>
    </div>
  );
}
