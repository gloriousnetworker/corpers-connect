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
  | 'application-status';

interface MarketplaceState {
  view: MarketplaceView;
  selectedListing: MarketplaceListing | null;
  activeFilters: ListingFilters;

  setView: (view: MarketplaceView) => void;
  selectListing: (listing: MarketplaceListing) => void;
  clearListing: () => void;
  setFilters: (filters: Partial<ListingFilters>) => void;
  clearFilters: () => void;
  goBack: () => void;
}

export const useMarketplaceStore = create<MarketplaceState>((set, get) => ({
  view: 'home',
  selectedListing: null,
  activeFilters: {},

  setView: (view) => set({ view }),

  selectListing: (listing) =>
    set({ selectedListing: listing, view: 'detail' }),

  clearListing: () =>
    set({ selectedListing: null, view: 'home' }),

  setFilters: (filters) =>
    set((state) => ({ activeFilters: { ...state.activeFilters, ...filters } })),

  clearFilters: () => set({ activeFilters: {} }),

  goBack: () => {
    const { view } = get();
    if (view === 'detail' || view === 'create' || view === 'my-listings' ||
        view === 'seller-apply' || view === 'application-status') {
      set({ view: 'home', selectedListing: null });
    } else if (view === 'edit') {
      set({ view: 'detail' });
    } else {
      set({ view: 'home' });
    }
  },
}));
