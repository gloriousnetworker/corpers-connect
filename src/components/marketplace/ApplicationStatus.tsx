'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Clock, CheckCircle2, XCircle, ShieldCheck } from 'lucide-react';
import { getMyApplication } from '@/lib/api/marketplace';
import { useMarketplaceStore } from '@/store/marketplace.store';
import { SellerApplicationStatus } from '@/types/enums';

export default function ApplicationStatus() {
  const { goBack, setView } = useMarketplaceStore();

  const { data: application, isLoading } = useQuery({
    queryKey: ['marketplace', 'my-application'],
    queryFn: getMyApplication,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-full">
        <div className="sticky top-0 z-10 bg-surface border-b border-border px-4 py-3 flex items-center gap-3">
          <button onClick={goBack}><ArrowLeft size={22} /></button>
          <h1 className="font-bold text-foreground text-lg">Seller Application</h1>
        </div>
        <div className="flex flex-col items-center justify-center flex-1 gap-3">
          <div className="w-12 h-12 rounded-full bg-muted animate-pulse" />
          <div className="h-4 bg-muted rounded w-48 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="flex flex-col min-h-full">
        <div className="sticky top-0 z-10 bg-surface border-b border-border px-4 py-3 flex items-center gap-3">
          <button onClick={goBack}><ArrowLeft size={22} /></button>
          <h1 className="font-bold text-foreground text-lg">Seller Application</h1>
        </div>
        <div className="flex flex-col items-center justify-center flex-1 px-6 text-center gap-4">
          <ShieldCheck size={52} className="text-muted-foreground/30" />
          <div>
            <p className="font-semibold text-foreground">No application found</p>
            <p className="text-sm text-muted-foreground mt-1">Apply to become a verified seller in Mami Market.</p>
          </div>
          <button
            onClick={() => setView('seller-apply')}
            className="px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            Apply Now
          </button>
        </div>
      </div>
    );
  }

  const isPending  = application.status === SellerApplicationStatus.PENDING;
  const isApproved = application.status === SellerApplicationStatus.APPROVED;
  const isRejected = application.status === SellerApplicationStatus.REJECTED;

  return (
    <div className="flex flex-col min-h-full">
      <div className="sticky top-0 z-10 bg-surface border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={goBack} className="text-foreground hover:text-primary">
          <ArrowLeft size={22} />
        </button>
        <h1 className="font-bold text-foreground text-lg flex-1">Seller Application</h1>
      </div>

      <div className="flex flex-col items-center justify-center flex-1 px-6 py-10 text-center gap-5">
        {/* Status icon */}
        <div className={[
          'w-20 h-20 rounded-full flex items-center justify-center',
          isPending  ? 'bg-amber-100  dark:bg-amber-900/30'  : '',
          isApproved ? 'bg-emerald-100 dark:bg-emerald-900/30' : '',
          isRejected ? 'bg-red-100    dark:bg-red-900/30'    : '',
        ].join(' ')}>
          {isPending  && <Clock       size={40} className="text-amber-500" />}
          {isApproved && <CheckCircle2 size={40} className="text-emerald-500" />}
          {isRejected && <XCircle      size={40} className="text-red-500" />}
        </div>

        {/* Status text */}
        {isPending && (
          <div>
            <p className="text-xl font-bold text-foreground">Under Review</p>
            <p className="text-sm text-muted-foreground mt-2 max-w-[280px]">
              Your application is being reviewed. We'll notify you within 24–48 hours.
            </p>
          </div>
        )}

        {isApproved && (
          <div>
            <p className="text-xl font-bold text-foreground">Application Approved!</p>
            <p className="text-sm text-muted-foreground mt-2 max-w-[280px]">
              Congratulations! You're now a verified seller on Mami Market.
            </p>
          </div>
        )}

        {isRejected && (
          <div>
            <p className="text-xl font-bold text-foreground">Application Rejected</p>
            {application.reviewNote && (
              <p className="text-sm text-muted-foreground mt-2 max-w-[280px]">
                Reason: {application.reviewNote}
              </p>
            )}
            <p className="text-sm text-muted-foreground mt-1 max-w-[280px]">
              You may reapply with a clearer document.
            </p>
          </div>
        )}

        {/* Metadata */}
        <div className="w-full max-w-xs rounded-xl border border-border bg-muted/30 p-4 text-left space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Submitted</span>
            <span className="font-medium text-foreground">
              {new Date(application.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
          {application.reviewedAt && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Reviewed</span>
              <span className="font-medium text-foreground">
                {new Date(application.reviewedAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Status</span>
            <span className={[
              'font-semibold',
              isPending  ? 'text-amber-500'   : '',
              isApproved ? 'text-emerald-500' : '',
              isRejected ? 'text-red-500'     : '',
            ].join(' ')}>
              {application.status}
            </span>
          </div>
        </div>

        {/* Re-apply option if rejected */}
        {isRejected && (
          <button
            onClick={() => setView('seller-apply')}
            className="px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            Reapply
          </button>
        )}

        {isApproved && (
          <button
            onClick={() => setView('create')}
            className="px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            Create a listing
          </button>
        )}
      </div>
    </div>
  );
}
