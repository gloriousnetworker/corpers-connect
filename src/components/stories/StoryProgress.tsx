'use client';

interface StoryProgressProps {
  /** Total number of stories in this group */
  count: number;
  /** Index of the currently active story */
  activeIndex: number;
  /** 0–1 fill amount for the active story's bar */
  progress: number;
}

export default function StoryProgress({ count, activeIndex, progress }: StoryProgressProps) {
  return (
    <div className="flex items-center gap-1 w-full px-2" role="progressbar" aria-valuenow={activeIndex + 1} aria-valuemax={count}>
      {Array.from({ length: count }).map((_, i) => {
        const isCompleted = i < activeIndex;
        const isActive = i === activeIndex;
        const fill = isCompleted ? 1 : isActive ? progress : 0;

        return (
          <div
            key={i}
            className="flex-1 h-0.5 rounded-full bg-white/40 overflow-hidden"
          >
            <div
              className="h-full bg-white rounded-full transition-none"
              style={{ width: `${fill * 100}%` }}
            />
          </div>
        );
      })}
    </div>
  );
}
