'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Clock, CheckCircle2, XCircle, ShieldCheck, ShieldOff, Send, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { getMyApplication, getMySellerProfile, submitSellerAppeal, getMyAppeals } from '@/lib/api/marketplace';
import { useMarketplaceStore } from '@/store/marketplace.store';
import { SellerApplicationStatus, SellerStatus } from '@/types/enums';

export default function ApplicationStatus() {
  const { goBack, setView } = useMarketplaceStore();
  const qc = useQueryClient();

  const [appealText, setAppealText] = useState('');
  const [showAppealForm, setShowAppealForm] = useState(false);
  const [showPastAppeals, setShowPastAppeals] = useState(false);

  const { data: application, isLoading } = useQuery({
    queryKey: ['marketplace', 'my-application'],
    queryFn: getMyApplication,
  });

  const { data: sellerProfile } = useQuery({
    queryKey: ['marketplace', 'my-seller-profile'],
    queryFn: getMySellerProfile,
    enabled: application?.status === SellerApplicationStatus.APPROVED,
  });

  const { data: appeals } = useQuery({
    queryKey: ['marketplace', 'my-appeals'],
    queryFn: getMyAppeals,
    enabled: sellerProfile?.sellerStatus === SellerStatus.DEACTIVATED,
  });

  const appealMutation = useMutation({
    mutationFn: submitSellerAppeal,
    onSuccess: () => {
      toast.success('Appeal submitted. We will review it shortly.');
      setAppealText('');
      setShowAppealForm(false);
      qc.invalidateQueries({ queryKey: ['marketplace', 'my-appeals'] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to submit appeal'),
  });

  const hasPendingAppeal = appeals?.some((a) => a.status === 'PENDING') ?? false;

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

  const isPending    = application.status === SellerApplicationStatus.PENDING;
  const isApproved   = application.status === SellerApplicationStatus.APPROVED;
  const isRejected   = application.status === SellerApplicationStatus.REJECTED;
  const isDeactivated = isApproved && sellerProfile?.sellerStatus === SellerStatus.DEACTIVATED;

  return (
    <div className="flex flex-col min-h-full">
      <div className="sticky top-0 z-10 bg-surface border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={goBack} className="text-foreground hover:text-primary">
          <ArrowLeft size={22} />
        </button>
        <h1 className="font-bold text-foreground text-lg flex-1">Seller Application</h1>
      </div>

      <div className="flex flex-col items-center flex-1 px-6 py-10 text-center gap-5">
        {/* Status icon */}
        <div className={[
          'w-20 h-20 rounded-full flex items-center justify-center',
          isPending     ? 'bg-amber-100  dark:bg-amber-900/30'   : '',
          isDeactivated ? 'bg-red-100    dark:bg-red-900/30'     : '',
          isApproved && !isDeactivated ? 'bg-emerald-100 dark:bg-emerald-900/30' : '',
          isRejected    ? 'bg-red-100    dark:bg-red-900/30'     : '',
        ].join(' ')}>
          {isPending     && <Clock        size={40} className="text-amber-500" />}
          {isDeactivated && <ShieldOff    size={40} className="text-red-500" />}
          {isApproved && !isDeactivated && <CheckCircle2 size={40} className="text-emerald-500" />}
          {isRejected    && <XCircle      size={40} className="text-red-500" />}
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

        {isApproved && !isDeactivated && (
          <div>
            <p className="text-xl font-bold text-foreground">Application Approved!</p>
            <p className="text-sm text-muted-foreground mt-2 max-w-[280px]">
              Congratulations! You're now a verified seller on Mami Market.
            </p>
          </div>
        )}

        {isDeactivated && (
          <div>
            <p className="text-xl font-bold text-foreground text-red-600">Account Suspended</p>
            <p className="text-sm text-muted-foreground mt-2 max-w-[280px]">
              Your Mami Market seller account has been deactivated.
            </p>
            {sellerProfile?.deactivationReason && (
              <div className="mt-3 px-4 py-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl max-w-[300px] text-left">
                <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-1">Reason:</p>
                <p className="text-sm text-red-700 dark:text-red-300">{sellerProfile.deactivationReason}</p>
              </div>
            )}
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
              isPending     ? 'text-amber-500'   : '',
              isDeactivated ? 'text-red-500'     : '',
              isApproved && !isDeactivated ? 'text-emerald-500' : '',
              isRejected    ? 'text-red-500'     : '',
            ].join(' ')}>
              {isDeactivated ? 'SUSPENDED' : application.status}
            </span>
          </div>
        </div>

        {/* ── Appeal section (deactivated sellers) ── */}
        {isDeactivated && (
          <div className="w-full max-w-xs space-y-3">
            {hasPendingAppeal ? (
              <div className="px-4 py-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl text-sm text-amber-700 dark:text-amber-300">
                Your appeal is under review. We'll notify you when a decision is made.
              </div>
            ) : (
              <>
                {!showAppealForm ? (
                  <button
                    onClick={() => setShowAppealForm(true)}
                    className="w-full py-2.5 rounded-full border-2 border-primary text-primary text-sm font-semibold hover:bg-primary/5 transition-colors"
                  >
                    Write an Appeal
                  </button>
                ) : (
                  <div className="text-left space-y-3">
                    <p className="text-sm font-semibold text-foreground">Write your appeal</p>
                    <p className="text-xs text-muted-foreground">
                      Explain why you believe your account should be reinstated. Be honest and clear.
                    </p>
                    <textarea
                      value={appealText}
                      onChange={(e) => setAppealText(e.target.value)}
                      rows={4}
                      placeholder="Explain your situation and why your account should be reinstated..."
                      className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none bg-surface"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setShowAppealForm(false); setAppealText(''); }}
                        className="flex-1 py-2 rounded-full border border-border text-sm font-medium text-muted-foreground hover:bg-surface-alt"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => { if (appealText.trim().length >= 10) appealMutation.mutate(appealText.trim()); }}
                        disabled={appealMutation.isPending || appealText.trim().length < 10}
                        className="flex-1 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-1.5"
                      >
                        {appealMutation.isPending ? 'Sending...' : <><Send size={14} /> Send Appeal</>}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Past appeals accordion */}
            {appeals && appeals.length > 0 && (
              <div className="border border-border rounded-xl overflow-hidden">
                <button
                  onClick={() => setShowPastAppeals((v) => !v)}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-foreground hover:bg-surface-alt"
                >
                  <span>Past Appeals ({appeals.length})</span>
                  {showPastAppeals ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {showPastAppeals && (
                  <div className="divide-y divide-border">
                    {appeals.map((appeal) => (
                      <div key={appeal.id} className="px-4 py-3 text-left space-y-2">
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            appeal.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                            appeal.status === 'ACCEPTED' ? 'bg-green-100 text-green-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {appeal.status}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(appeal.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">{appeal.message}</p>
                        {appeal.adminResponse && (
                          <div className="text-xs bg-blue-50 dark:bg-blue-950/30 p-2 rounded-lg text-blue-700 dark:text-blue-300">
                            <span className="font-medium">Admin: </span>{appeal.adminResponse}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Action buttons ── */}
        {isRejected && (
          <button
            onClick={() => setView('seller-apply')}
            className="px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            Reapply
          </button>
        )}

        {isApproved && !isDeactivated && (
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
