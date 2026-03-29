'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSubscriptionsStore } from '@/store/subscriptions.store';
import SubscriptionDashboard from './SubscriptionDashboard';
import PlansPage from './PlansPage';
import PaymentPendingView from './PaymentPendingView';
import PaymentSuccessView from './PaymentSuccessView';
import PaymentFailedView from './PaymentFailedView';
import SubscriptionHistoryPage from './SubscriptionHistoryPage';
import LevelProgressPage from './LevelProgressPage';
import CancelConfirmPage from './CancelConfirmPage';

/**
 * Handles Paystack redirect — reads ?reference= from the URL after the
 * user returns from the Paystack-hosted payment page, sets pendingReference,
 * cleans the URL, and switches to the payment-pending view for verification.
 */
function PaystackCallbackHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setView, setPendingReference } = useSubscriptionsStore();

  useEffect(() => {
    // Paystack appends ?reference=... and ?trxref=... on redirect
    const ref = searchParams.get('reference') ?? searchParams.get('trxref');
    if (ref) {
      setPendingReference(ref);
      router.replace('/');
      setView('payment-pending');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

export default function SubscriptionsSection() {
  const view = useSubscriptionsStore((s) => s.view);

  return (
    <>
      <Suspense><PaystackCallbackHandler /></Suspense>

      {view === 'plans'            && <PlansPage />}
      {view === 'payment-pending'  && <PaymentPendingView />}
      {view === 'payment-success'  && <PaymentSuccessView />}
      {view === 'payment-failed'   && <PaymentFailedView />}
      {view === 'history'          && <SubscriptionHistoryPage />}
      {view === 'level'            && <LevelProgressPage />}
      {view === 'cancel-confirm'   && <CancelConfirmPage />}
      {(view === 'dashboard' || !view) && <SubscriptionDashboard />}
    </>
  );
}
