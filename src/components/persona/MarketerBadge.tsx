import { Store } from 'lucide-react';
import { AccountType } from '@/types/enums';

interface MarketerBadgeProps {
  /** The user's accountType. Accepts enum, raw string, undefined, or null —
   *  most callsites read this from a relaxed prop type, so widening here
   *  saves ten cast-or-narrow blocks elsewhere. The badge only renders when
   *  the value equals 'MARKETER'. */
  accountType?: AccountType | string | null;
  /** Compact variant — smaller, no icon — for tight rows like comments. */
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * "B2B" pill rendered next to a marketer's display name everywhere their
 * identity surfaces (listings, marketplace chats, profiles, etc.). The pill
 * uses the same amber palette as the rest of the marketer-facing UI so the
 * persona is visually distinct from the green corper experience.
 *
 * Returns `null` for corpers and missing accountType so it can be sprinkled
 * inline next to a name without conditional wrapping at every callsite.
 */
export default function MarketerBadge({
  accountType,
  size = 'md',
  className = '',
}: MarketerBadgeProps) {
  if (accountType !== AccountType.MARKETER && accountType !== 'MARKETER') return null;

  const compact = size === 'sm';
  return (
    <span
      title="Mami Marketer — verified business account"
      className={[
        'inline-flex items-center gap-1 rounded-full font-bold uppercase tracking-wide',
        'bg-amber-100 text-amber-800 border border-amber-200',
        compact
          ? 'px-1.5 py-0.5 text-[10px] leading-none'
          : 'px-2 py-0.5 text-[11px]',
        className,
      ].join(' ')}
      aria-label="Mami Marketer (B2B)"
    >
      {!compact && <Store className="h-3 w-3" />}
      <span>B2B</span>
    </span>
  );
}
