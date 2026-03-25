'use client';

import { MapPin } from 'lucide-react';

interface CorperTagBadgeProps {
  label?: string | null;
  servingState: string;
}

/** Small chip shown on profile indicating where the corper is serving */
export default function CorperTagBadge({ label, servingState }: CorperTagBadgeProps) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">
      <MapPin className="w-3 h-3 flex-shrink-0" />
      {label ?? servingState}
    </span>
  );
}
