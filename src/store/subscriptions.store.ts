import { create } from 'zustand';
import type { SubscriptionPlan } from '@/types/enums';

export type SubscriptionsView =
  | 'dashboard'
  | 'plans'
  | 'payment-pending'
  | 'payment-success'
  | 'payment-failed'
  | 'history'
  | 'level'
  | 'cancel-confirm';

interface SubscriptionsState {
  view: SubscriptionsView;
  selectedPlan: SubscriptionPlan | null;
  pendingReference: string | null;

  setView: (view: SubscriptionsView) => void;
  selectPlan: (plan: SubscriptionPlan) => void;
  setPendingReference: (ref: string | null) => void;
  reset: () => void;
}

export const useSubscriptionsStore = create<SubscriptionsState>((set) => ({
  view: 'dashboard',
  selectedPlan: null,
  pendingReference: null,

  setView: (view) => set({ view }),
  selectPlan: (plan) => set({ selectedPlan: plan }),
  setPendingReference: (ref) => set({ pendingReference: ref }),
  reset: () => set({ view: 'dashboard', selectedPlan: null, pendingReference: null }),
}));
