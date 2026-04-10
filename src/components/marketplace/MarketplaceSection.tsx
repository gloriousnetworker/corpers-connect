'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useMarketplaceStore } from '@/store/marketplace.store';
import { useAuthStore } from '@/store/auth.store';
import { getMyApplication, getMySellerProfile } from '@/lib/api/marketplace';
import { SellerApplicationStatus, SellerStatus } from '@/types/enums';
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

  // Preload application status
  const { data: application, isLoading: appLoading } = useQuery({
    queryKey: ['marketplace', 'my-application'],
    queryFn: getMyApplication,
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const isApprovedSeller = application?.status === SellerApplicationStatus.APPROVED;
  const hasApplication   = !!application;

  // Preload seller profile to detect suspension
  const { data: sellerProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['marketplace', 'my-seller-profile'],
    queryFn: getMySellerProfile,
    enabled: isApprovedSeller,
    staleTime: 5 * 60 * 1000,
  });

  const isSuspended = isApprovedSeller && sellerProfile?.sellerStatus === SellerStatus.DEACTIVATED;
  const canSell     = isApprovedSeller && !isSuspended;

  // Wait for both queries to settle before making redirect decisions
  const isReady = !appLoading && (!isApprovedSeller || !profileLoading);

  // Guard 'create' and 'my-listings' (seller-only views) once data is ready
  useEffect(() => {
    if (!isReady) return;

    if (view === 'create') {
      if (isSuspended) {
        setView('application-status');
      } else if (!isApprovedSeller) {
        setView(hasApplication ? 'application-status' : 'seller-apply');
      }
    }
  }, [view, isReady, canSell, isSuspended, isApprovedSeller, hasApplication, setView]);

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
