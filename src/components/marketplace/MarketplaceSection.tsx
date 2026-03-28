'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useMarketplaceStore } from '@/store/marketplace.store';
import { useAuthStore } from '@/store/auth.store';
import { getMyApplication } from '@/lib/api/marketplace';
import { SellerApplicationStatus } from '@/types/enums';
import MarketplaceHome from './MarketplaceHome';
import ListingDetail from './ListingDetail';
import CreateListingForm from './CreateListingForm';
import EditListingForm from './EditListingForm';
import MyListings from './MyListings';
import SellerApplicationForm from './SellerApplicationForm';
import ApplicationStatus from './ApplicationStatus';

/**
 * MarketplaceSection — top-level router for the marketplace SPA section.
 * Handles: home → detail → create / edit / my-listings / seller flow
 *
 * When a non-approved user tries to create, we redirect them to the seller
 * application flow instead.
 */
export default function MarketplaceSection() {
  const user = useAuthStore((s) => s.user);
  const { view, setView } = useMarketplaceStore();

  // Preload application status
  const { data: application } = useQuery({
    queryKey: ['marketplace', 'my-application'],
    queryFn: getMyApplication,
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 min
  });

  const isApprovedSeller = application?.status === SellerApplicationStatus.APPROVED;
  const hasApplication   = !!application;

  // If user navigates to 'create' but isn't approved → redirect to seller flow
  useEffect(() => {
    if (view === 'create' && !isApprovedSeller) {
      setView(hasApplication ? 'application-status' : 'seller-apply');
    }
  }, [view, isApprovedSeller, hasApplication, setView]);

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
    default:
      return <MarketplaceHome />;
  }
}
