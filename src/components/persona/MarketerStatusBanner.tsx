'use client';

import { Clock, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { AccountType, MarketerStatus } from '@/types/enums';

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

  // APPROVED — no banner; the user is fully cleared.
  return null;
}
