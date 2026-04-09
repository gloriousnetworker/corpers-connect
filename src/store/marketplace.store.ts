import { create } from 'zustand';
import type { MarketplaceListing } from '@/types/models';
import type { ListingFilters } from '@/lib/api/marketplace';

export type MarketplaceView =
  | 'home'
  | 'detail'
  | 'create'
  | 'edit'
  | 'my-listings'
  | 'seller-apply'
  | 'application-status'
  | 'seller-profile'
  | 'marketplace-conversations'
  | 'marketplace-chat';

interface MarketplaceState {
  view: MarketplaceView;
  selectedListing: MarketplaceListing | null;
  activeFilters: ListingFilters;
  selectedSellerId: string | null;
  activeMarketplaceChatId: string | null;

  setView: (view: MarketplaceView) => void;
  selectListing: (listing: MarketplaceListing) => void;
  clearListing: () => void;
  setFilters: (filters: Partial<ListingFilters>) => void;
  clearFilters: () => void;
  goBack: () => void;
  viewSellerProfile: (userId: string) => void;
  openMarketplaceConversations: () => void;
  openMarketplaceChat: (conversationId: string) => void;
}

export const useMarketplaceStore = create<MarketplaceState>((set, get) => ({
  view: 'home',
  selectedListing: null,
  activeFilters: {},
  selectedSellerId: null,
  activeMarketplaceChatId: null,

  setView: (view) => set({ view }),

  selectListing: (listing) =>
    set({ selectedListing: listing, view: 'detail' }),

  clearListing: () =>
    set({ selectedListing: null, view: 'home' }),

  setFilters: (filters) =>
    set((state) => ({ activeFilters: { ...state.activeFilters, ...filters } })),

  clearFilters: () => set({ activeFilters: {} }),

  viewSellerProfile: (userId) => set({ view: 'seller-profile', selectedSellerId: userId }),
  openMarketplaceConversations: () => set({ view: 'marketplace-conversations' }),
  openMarketplaceChat: (conversationId) => set({ view: 'marketplace-chat', activeMarketplaceChatId: conversationId }),

  goBack: () => {
    const { view } = get();
    if (view === 'detail' || view === 'create' || view === 'my-listings' ||
        view === 'seller-apply' || view === 'application-status' ||
        view === 'seller-profile' || view === 'marketplace-conversations') {
      set({ view: 'home', selectedListing: null, selectedSellerId: null, activeMarketplaceChatId: null });
    } else if (view === 'edit') {
      set({ view: 'detail' });
    } else if (view === 'marketplace-chat') {
      set({ view: 'marketplace-conversations', activeMarketplaceChatId: null });
    } else {
      set({ view: 'home' });
    }
  },
}));
