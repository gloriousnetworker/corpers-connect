import api from './client';
import type { ApiResponse } from '@/types/api';
import type { Subscription, SubscriptionPlanInfo } from '@/types/models';
import type { SubscriptionPlan, SubscriptionTier, UserLevel } from '@/types/enums';

// ── Local types ────────────────────────────────────────────────────────────────

export interface InitializePaymentResult {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
  plan: string;
  amountKobo: number;
  amountNaira: number;
}

export interface LevelRequirement {
  label: string;
  met: boolean;
  current?: number;
  target?: number;
}

export interface LevelInfo {
  currentLevel: UserLevel;
  subscriptionTier: SubscriptionTier;
  accountAgeDays: number;
  nextLevel: {
    level: UserLevel;
    requirements: LevelRequirement[];
  } | null;
}

// Features surfaced client-side per plan (backend only stores price/duration)
const PLAN_FEATURES = {
  MONTHLY: [
    'CORPER level badge',
    'Boosted profile visibility',
    'Priority in Discover',
    'Corper Plus support',
    'Cancel anytime',
  ],
  ANNUAL: [
    'Everything in Monthly',
    'Save 22% vs monthly',
    '1 year of Corper Plus',
    'Priority support',
  ],
};

// ── Plans ──────────────────────────────────────────────────────────────────────

export async function getPlans(): Promise<SubscriptionPlanInfo[]> {
  const { data } = await api.get<ApiResponse<{ key: string; label: string; amountKobo: number; amountNaira: number; durationDays: number }[]>>(
    '/subscriptions/plans'
  );

  return data.data.map((p) => ({
    id: p.key as SubscriptionPlan,
    name: p.label,
    price: p.amountKobo,
    priceFormatted: `₦${(p.amountNaira).toLocaleString('en-NG')}`,
    currency: 'NGN',
    durationDays: p.durationDays,
    features: PLAN_FEATURES[p.key as keyof typeof PLAN_FEATURES] ?? [],
    savings: p.key === 'ANNUAL' ? 'Save 22%' : undefined,
  }));
}

// ── Payment ────────────────────────────────────────────────────────────────────

export async function initializePayment(
  plan: SubscriptionPlan,
  callbackUrl?: string
): Promise<InitializePaymentResult> {
  const { data } = await api.post<ApiResponse<InitializePaymentResult>>(
    '/subscriptions/initialize',
    { plan, callbackUrl }
  );
  return data.data;
}

export async function verifyPayment(reference: string): Promise<Subscription> {
  const { data } = await api.get<ApiResponse<Subscription>>(
    '/subscriptions/verify',
    { params: { reference } }
  );
  return data.data;
}

// ── Subscription management ────────────────────────────────────────────────────

export async function getCurrentSubscription(): Promise<Subscription | null> {
  try {
    const { data } = await api.get<ApiResponse<Subscription | null>>('/subscriptions/me');
    return data.data;
  } catch {
    return null;
  }
}

export async function getSubscriptionHistory(): Promise<Subscription[]> {
  const { data } = await api.get<ApiResponse<Subscription[]>>('/subscriptions/history');
  return data.data;
}

export async function cancelSubscription(): Promise<Subscription> {
  const { data } = await api.post<ApiResponse<Subscription>>('/subscriptions/cancel');
  return data.data;
}

// ── Level ──────────────────────────────────────────────────────────────────────

export async function getLevel(): Promise<LevelInfo> {
  const { data } = await api.get<ApiResponse<LevelInfo>>('/subscriptions/level');
  return data.data;
}

export async function checkLevel(): Promise<{ id: string; level: UserLevel; subscriptionTier: SubscriptionTier }> {
  const { data } = await api.post<ApiResponse<{ id: string; level: UserLevel; subscriptionTier: SubscriptionTier }>>(
    '/subscriptions/level/check'
  );
  return data.data;
}
