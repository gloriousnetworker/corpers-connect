'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { ArrowLeft, FileText } from 'lucide-react';
import { getMyApplications } from '@/lib/api/opportunities';
import { useOpportunitiesStore } from '@/store/opportunities.store';
import { ApplicationStatus } from '@/types/enums';
import type { OpportunityApplication } from '@/types/models';

const STATUS_STYLE: Record<ApplicationStatus, { label: string; cls: string }> = {
  [ApplicationStatus.PENDING]:     { label: 'Pending',     cls: 'bg-muted text-muted-foreground' },
  [ApplicationStatus.REVIEWED]:    { label: 'Reviewed',    cls: 'bg-blue-100 text-blue-700'      },
  [ApplicationStatus.SHORTLISTED]: { label: 'Shortlisted', cls: 'bg-amber-100 text-amber-700'    },
  [ApplicationStatus.ACCEPTED]:    { label: 'Accepted ✓',  cls: 'bg-emerald-100 text-emerald-700'},
  [ApplicationStatus.REJECTED]:    { label: 'Rejected',    cls: 'bg-red-100 text-red-600'        },
};

export default function MyApplications() {
  const { goBack, selectOpportunity } = useOpportunitiesStore();

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
      queryKey: ['my-applications'],
      queryFn: ({ pageParam }) =>
        getMyApplications({ cursor: pageParam, limit: 20 }),
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (last) => last.hasMore ? last.nextCursor ?? undefined : undefined,
    });

  const applications = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <div className="flex flex-col min-h-full">
      <div className="sticky top-0 z-10 bg-surface border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={goBack} className="text-foreground hover:text-primary">
          <ArrowLeft size={22} />
        </button>
        <h1 className="font-bold text-foreground text-lg flex-1">My Applications</h1>
      </div>

      <div className="flex-1 px-4 py-4 space-y-3">
        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-4 rounded-xl border border-border animate-pulse flex gap-3">
                <div className="w-10 h-10 rounded-xl bg-muted flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && applications.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
            <FileText size={48} className="text-muted-foreground/40" />
            <p className="font-semibold text-foreground">No applications yet</p>
            <p className="text-sm text-muted-foreground">Browse opportunities and apply to get started</p>
          </div>
        )}

        {applications.map((app: OpportunityApplication) => {
          const status = STATUS_STYLE[app.status];
          const opp = app.opportunity;
          return (
            <div
              key={app.id}
              className="flex items-start gap-3 p-4 rounded-xl border border-border bg-surface hover:bg-muted/20 transition-colors cursor-pointer"
              onClick={() => opp && selectOpportunity(opp)}
            >
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center font-bold text-primary text-base uppercase flex-shrink-0">
                {opp?.companyName?.[0] ?? '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground text-sm line-clamp-1">
                  {opp?.title ?? 'Unknown position'}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {opp?.companyName ?? ''}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${status.cls}`}>
                    {status.label}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Applied {new Date(app.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {hasNextPage && (
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="w-full py-2.5 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:bg-muted disabled:opacity-50"
          >
            {isFetchingNextPage ? 'Loading…' : 'Load more'}
          </button>
        )}
      </div>
    </div>
  );
}
