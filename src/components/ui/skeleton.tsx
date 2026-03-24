import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  rounded?: 'sm' | 'md' | 'lg' | 'full';
}

function Skeleton({ className, rounded = 'md', ...props }: SkeletonProps) {
  const roundedMap = {
    sm: 'rounded',
    md: 'rounded-lg',
    lg: 'rounded-xl',
    full: 'rounded-full',
  };
  return (
    <div
      className={cn('skeleton', roundedMap[rounded], className)}
      aria-hidden="true"
      {...props}
    />
  );
}

// Post card skeleton
function PostCardSkeleton() {
  return (
    <div className="bg-surface p-4 space-y-3 border-b border-border">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10" rounded="full" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-48 w-full" rounded="lg" />
      <div className="flex gap-4">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  );
}

function AvatarSkeleton({ size = 40 }: { size?: number }) {
  return (
    <Skeleton
      rounded="full"
      style={{ width: size, height: size, flexShrink: 0 }}
    />
  );
}

function TextSkeleton({ lines = 2, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn('h-4', i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full')}
        />
      ))}
    </div>
  );
}

export { Skeleton, PostCardSkeleton, AvatarSkeleton, TextSkeleton };
