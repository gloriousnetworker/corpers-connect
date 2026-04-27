'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useMarketplaceStore } from '@/store/marketplace.store';
import { useAuthStore } from '@/store/auth.store';
import { getMyApplication, getMySellerProfile } from '@/lib/api/marketplace';
import { SellerApplicationStatus, SellerStatus, AccountType, MarketerStatus } from '@/types/enums';
import MarketplaceHome from './MarketplaceHome';
import ListingDetail from './ListingDetail';
import CreateListingForm from './CreateListingForm';
import EditListingForm from './EditListingForm';
import MyListings from './MyListings';
import SellerApplicationForm from './SellerApplicationForm';
import ApplicationStatus from './ApplicationStatus';
import SellerProfileView from './SellerProfile';
import MarketplaceConversations from './MarketplaceConversations';
import MarketplaceChatView from './MarketplaceChatView';

/**
 * MarketplaceSection — top-level router for the marketplace SPA section.
 * Handles: home → detail → create / edit / my-listings / seller flow
 *
 * When a non-approved user tries to create, we redirect them to the seller
 * application flow instead. Suspended sellers are sent to application-status
 * so they can submit an appeal rather than seeing the apply form.
 */
export default function MarketplaceSection() {
  const user = useAuthStore((s) => s.user);
  const { view, setView } = useMarketplaceStore();

  const isMarketer        = user?.accountType === AccountType.MARKETER;
  const isApprovedMarketer = isMarketer && user?.marketerStatus === MarketerStatus.APPROVED;

  // Corpers go through SellerApplication; marketers don't (their NIN is the
  // gating step), so we skip the application query for them.
  const { data: application, isLoading: appLoading } = useQuery({
    queryKey: ['marketplace', 'my-application'],
    queryFn: getMyApplication,
    enabled: !!user && !isMarketer,
    staleTime: 5 * 60 * 1000,
  });

  // Persona-aware approval — corper requires APPROVED SellerApplication;
  // marketer requires APPROVED marketerStatus.
  const isApprovedSeller =
    isApprovedMarketer || application?.status === SellerApplicationStatus.APPROVED;
  const hasApplication   = !isMarketer && !!application;

  // Preload seller profile to detect suspension. Approved marketers also have
  // a SellerProfile (auto-created on approval), so this query applies to them
  // too.
  const { data: sellerProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['marketplace', 'my-seller-profile'],
    queryFn: getMySellerProfile,
    enabled: isApprovedSeller,
    staleTime: 5 * 60 * 1000,
  });

  const isSuspended = isApprovedSeller && sellerProfile?.sellerStatus === SellerStatus.DEACTIVATED;
  const canSell     = isApprovedSeller && !isSuspended;

  // Wait for queries to settle before making redirect decisions. For
  // marketers we don't fetch the application, so appLoading is irrelevant.
  const isReady = (isMarketer || !appLoading) && (!isApprovedSeller || !profileLoading);

  // Guard 'create' and 'my-listings' (seller-only views) once data is ready
  useEffect(() => {
    if (!isReady) return;

    if (view === 'create') {
      if (isSuspended) {
        setView(isMarketer ? 'home' : 'application-status');
        if (isMarketer) toast.error('Your seller profile is suspended.');
        return;
      }
      if (!isApprovedSeller) {
        if (isMarketer) {
          // Marketers don't go through the corper SellerApplication flow.
          // Just bounce them home with a status note.
          setView('home');
          toast.error(
            user?.marketerStatus === MarketerStatus.PENDING
              ? "Your Marketer account is pending verification — you'll be able to list once approved."
              : 'Your Marketer application was not approved. Please contact support.',
          );
        } else {
          setView(hasApplication ? 'application-status' : 'seller-apply');
        }
      }
    }
  }, [view, isReady, canSell, isSuspended, isApprovedSeller, hasApplication, isMarketer, user?.marketerStatus, setView]);

  switch (view) {
    case 'detail':
      return <ListingDetail />;
    case 'create':
      // Shown only when isApprovedSeller (useEffect guards non-approved)
      return <CreateListingForm />;
    case 'edit':
      return <EditListingForm />;
    case 'my-listings':
      return <MyListings />;
    case 'seller-apply':
      return <SellerApplicationForm />;
    case 'application-status':
      return <ApplicationStatus />;
    case 'seller-profile':
      return <SellerProfileView />;
    case 'marketplace-conversations':
      return <MarketplaceConversations />;
    case 'marketplace-chat':
      return <MarketplaceChatView />;
    default:
      return <MarketplaceHome />;
  }
}
