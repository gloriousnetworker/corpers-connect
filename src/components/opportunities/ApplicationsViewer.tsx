'use client';

import { useState } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Users, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';
import { getOpportunityApplications, updateApplicationStatus } from '@/lib/api/opportunities';
import { useOpportunitiesStore } from '@/store/opportunities.store';
import { ApplicationStatus } from '@/types/enums';
import { getAvatarUrl } from '@/lib/utils';
import type { OpportunityApplication } from '@/types/models';

const STATUS_OPTS: { value: ApplicationStatus; label: string }[] = [
  { value: ApplicationStatus.PENDING,     label: 'Pending'     },
  { value: ApplicationStatus.REVIEWED,    label: 'Reviewed'    },
  { value: ApplicationStatus.SHORTLISTED, label: 'Shortlisted' },
  { value: ApplicationStatus.ACCEPTED,    label: 'Accepted'    },
  { value: ApplicationStatus.REJECTED,    label: 'Rejected'    },
];

const STATUS_STYLE: Record<ApplicationStatus, string> = {
  [ApplicationStatus.PENDING]:     'bg-muted text-muted-foreground',
  [ApplicationStatus.REVIEWED]:    'bg-blue-100 text-blue-700',
  [ApplicationStatus.SHORTLISTED]: 'bg-amber-100 text-amber-700',
  [ApplicationStatus.ACCEPTED]:    'bg-emerald-100 text-emerald-700',
  [ApplicationStatus.REJECTED]:    'bg-red-100 text-red-600',
};

export default function ApplicationsViewer() {
  const qc = useQueryClient();
  const { goBack, viewingApplicationsFor } = useOpportunitiesStore();
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'ALL'>('ALL');

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
      queryKey: ['opportunity', viewingApplicationsFor, 'applications', statusFilter],
      queryFn: ({ pageParam }) =>
        getOpportunityApplications(viewingApplicationsFor!, {
          cursor: pageParam,
          limit: 20,
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
        }),
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (last) => last.hasMore ? last.nextCursor ?? undefined : undefined,
      enabled: !!viewingApplicationsFor,
    });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ApplicationStatus }) =>
      updateApplicationStatus(id, status),
    onSuccess: () => {
      toast.success('Status updated');
      qc.invalidateQueries({ queryKey: ['opportunity', viewingApplicationsFor, 'applications'] });
    },
    onError: () => toast.error('Failed to update status'),
  });

  const applications = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <div className="flex flex-col min-h-full">
      <div className="sticky top-0 z-10 bg-surface border-b border-border px-4 py-3 space-y-3">
        <div className="flex items-center gap-3">
          <button onClick={goBack} className="text-foreground hover:text-primary">
            <ArrowLeft size={22} />
          </button>
          <h1 className="font-bold text-foreground text-lg flex-1">Applications</h1>
        </div>
        {/* Status filter chips */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5">
          {(['ALL', ...STATUS_OPTS.map((s) => s.value)] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s as ApplicationStatus | 'ALL')}
              className={[
                'flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium border transition-colors',
                statusFilter === s
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-transparent text-muted-foreground border-border hover:bg-muted',
              ].join(' ')}
            >
              {s === 'ALL' ? 'All' : STATUS_OPTS.find((o) => o.value === s)?.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 px-4 py-4 space-y-3">
        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-4 rounded-xl border border-border animate-pulse flex gap-3">
                <div className="w-10 h-10 rounded-full bg-muted flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-muted rounded w-1/2" />
                  <div className="h-3 bg-muted rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && applications.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
            <Users size={48} className="text-muted-foreground/40" />
            <p className="font-semibold text-foreground">No applications yet</p>
            <p className="text-sm text-muted-foreground">Share this opportunity to get more applicants</p>
          </div>
        )}

        {applications.map((app: OpportunityApplication) => (
          <div key={app.id} className="p-4 rounded-xl border border-border bg-surface space-y-3">
            {/* Applicant row */}
            <div className="flex items-center gap-3">
              {app.applicant?.profilePicture ? (
                <Image
                  src={getAvatarUrl(app.applicant.profilePicture, 80)}
                  alt={app.applicant.firstName}
                  width={40}
                  height={40}
                  className="rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold flex-shrink-0">
                  {app.applicant?.firstName?.[0] ?? '?'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground text-sm">
                  {app.applicant?.firstName} {app.applicant?.lastName}
                </p>
                <p className="text-xs text-muted-foreground">
                  Applied {new Date(app.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${STATUS_STYLE[app.status]}`}>
                {app.status}
              </span>
            </div>

            {/* Cover letter */}
            {app.coverLetter && (
              <div className="bg-muted/40 rounded-lg px-3 py-2.5">
                <p className="text-xs font-semibold text-foreground mb-1">Cover Letter</p>
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-4">
                  {app.coverLetter}
                </p>
              </div>
            )}

            {/* CV link */}
            {app.cvUrl && (
              <a
                href={app.cvUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
              >
                📄 View CV / Resume
              </a>
            )}

            {/* Status update */}
            <div className="flex gap-2 flex-wrap">
              {STATUS_OPTS.filter((s) => s.value !== app.status).map((s) => (
                <button
                  key={s.value}
                  onClick={() => statusMutation.mutate({ id: app.id, status: s.value })}
                  disabled={statusMutation.isPending}
                  className="text-[11px] px-2.5 py-1 rounded-lg border border-border text-foreground hover:bg-muted disabled:opacity-50 transition-colors flex items-center gap-1"
                >
                  {statusMutation.isPending && statusMutation.variables?.id === app.id && (
                    <Loader2 size={9} className="animate-spin" />
                  )}
                  → {s.label}
                </button>
              ))}
            </div>
          </div>
        ))}

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
