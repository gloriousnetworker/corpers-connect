import { create } from 'zustand';
import type { Opportunity } from '@/types/models';
import type { OpportunityFilters } from '@/lib/api/opportunities';

export type OpportunitiesView =
  | 'feed'
  | 'detail'
  | 'create'
  | 'edit'
  | 'my-posts'
  | 'saved'
  | 'my-applications'
  | 'applications-viewer';    // opportunity owner seeing who applied

interface OpportunitiesState {
  view: OpportunitiesView;
  selectedOpportunity: Opportunity | null;
  activeFilters: OpportunityFilters;
  /** opportunityId whose applications are being viewed (author view) */
  viewingApplicationsFor: string | null;

  setView: (view: OpportunitiesView) => void;
  selectOpportunity: (opp: Opportunity) => void;
  clearOpportunity: () => void;
  setFilters: (filters: Partial<OpportunityFilters>) => void;
  clearFilters: () => void;
  goBack: () => void;
  viewApplicationsFor: (opportunityId: string) => void;
}

export const useOpportunitiesStore = create<OpportunitiesState>((set, get) => ({
  view: 'feed',
  selectedOpportunity: null,
  activeFilters: {},
  viewingApplicationsFor: null,

  setView: (view) => set({ view }),

  selectOpportunity: (opp) =>
    set({ selectedOpportunity: opp, view: 'detail' }),

  clearOpportunity: () =>
    set({ selectedOpportunity: null, view: 'feed' }),

  setFilters: (filters) =>
    set((state) => ({ activeFilters: { ...state.activeFilters, ...filters } })),

  clearFilters: () => set({ activeFilters: {} }),

  viewApplicationsFor: (opportunityId) =>
    set({ viewingApplicationsFor: opportunityId, view: 'applications-viewer' }),

  goBack: () => {
    const { view } = get();
    if (view === 'edit')                 return set({ view: 'detail' });
    if (view === 'applications-viewer')  return set({ view: 'detail' });
    if (view === 'detail')               return set({ selectedOpportunity: null, view: 'feed' });
    set({ view: 'feed' });
  },
}));
