'use client';

import { UserLevel } from '@/types/enums';

interface LevelBadgeProps {
  level: UserLevel;
  size?: 'sm' | 'md';
}

const CONFIG = {
  [UserLevel.OTONDO]: {
    label: 'Otondo',
    className: 'bg-gray-100 text-gray-600 border-gray-200',
  },
  [UserLevel.KOPA]: {
    label: 'Kopa',
    className: 'bg-primary/10 text-primary border-primary/20',
  },
  [UserLevel.CORPER]: {
    label: 'Corper',
    className: 'bg-accent/10 text-accent border-accent/20',
  },
};

export default function LevelBadge({ level, size = 'sm' }: LevelBadgeProps) {
  const cfg = CONFIG[level] ?? CONFIG[UserLevel.OTONDO];
  return (
    <span
      className={`inline-flex items-center border rounded-full font-semibold ${cfg.className} ${
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
      }`}
    >
      {cfg.label}
    </span>
  );
}
