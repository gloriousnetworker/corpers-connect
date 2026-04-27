'use client';

import Link from 'next/link';
import { Clock, AlertCircle, GraduationCap, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { AccountType, MarketerStatus, CorperUpgradeStatus } from '@/types/enums';

/**
 * Persistent banner shown to MARKETER accounts so they always know whether
 * they can list yet. Returns null for corpers and approved marketers
 * (the latter don't need the reminder once cleared).
 */
export default function MarketerStatusBanner() {
  const user = useAuthStore((s) => s.user);
  if (!user || user.accountType !== AccountType.MARKETER) return null;

  if (user.marketerStatus === MarketerStatus.PENDING) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 shadow-sm">
        <Clock className="h-5 w-5 text-amber-700 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-amber-900">
            Verifying your NIN
          </p>
          <p className="text-xs text-amber-900/80 mt-0.5 leading-relaxed">
            Browse the marketplace freely while we review your details. We'll
            email you the moment you're cleared to list (usually 24–48h).
          </p>
        </div>
      </div>
    );
  }

  if (user.marketerStatus === MarketerStatus.REJECTED) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 shadow-sm">
        <AlertCircle className="h-5 w-5 text-red-700 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-red-900">
            Marketer application not approved
          </p>
          {user.marketerRejectionReason ? (
            <p className="text-xs text-red-900/80 mt-0.5 leading-relaxed">
              {user.marketerRejectionReason}
            </p>
          ) : (
            <p className="text-xs text-red-900/80 mt-0.5 leading-relaxed">
              Please contact support or re-submit a clearer NIN photo.
            </p>
          )}
        </div>
      </div>
    );
  }

  // APPROVED — surface the optional Corper-upgrade entry, but only when the
  // user hasn't already requested an upgrade. Pending/approved/rejected
  // upgrades are handled inside the /become-corper page.
  if (
    user.marketerStatus === MarketerStatus.APPROVED &&
    !user.corperUpgradeStatus
  ) {
    return (
      <Link
        href="/become-corper"
        className="flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary/5 px-4 py-3 hover:bg-primary/10 transition-colors"
      >
        <GraduationCap className="h-5 w-5 text-primary flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">
            Are you a Corper too?
          </p>
          <p className="text-xs text-foreground-muted mt-0.5">
            Submit your NYSC details to unlock posts, stories, reels, and the
            Corper community alongside your Mami Market shop.
          </p>
        </div>
        <ArrowRight className="h-4 w-4 text-primary flex-shrink-0" />
      </Link>
    );
  }

  // PENDING upgrade — show a softer status nudge linking to the upgrade page.
  if (user.corperUpgradeStatus === CorperUpgradeStatus.PENDING) {
    return (
      <Link
        href="/become-corper"
        className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 hover:bg-amber-100/80 transition-colors"
      >
        <Clock className="h-5 w-5 text-amber-700 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-amber-900">
            Reviewing your Corper upgrade
          </p>
          <p className="text-xs text-amber-900/80 mt-0.5">
            We'll email you when it's done. Tap to see details.
          </p>
        </div>
      </Link>
    );
  }

  return null;
}
