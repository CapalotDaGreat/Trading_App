import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  type DocumentData,
} from 'firebase/firestore';
import * as WebBrowser from 'expo-web-browser';

import { requireDb, isFirebaseConfigured } from '@/firebase/config';
import {
  PREMIUM_PRODUCT_IDS,
  REVENUECAT_ENTITLEMENT_ID,
  type SubscriptionTier,
} from '@/shared/constants/subscription';

import type {
  PurchaseResult,
  RevenueCatSubscriberResponse,
  SubscriptionPlan,
  SubscriptionPlanId,
  SubscriptionRecord,
  SubscriptionService,
  SubscriptionStatus,
} from '../types/subscription.types';

const REVENUECAT_API_BASE = 'https://api.revenuecat.com/v1';
const SUBSCRIPTIONS_COLLECTION = 'subscriptions';

const DEFAULT_PLANS: SubscriptionPlan[] = [
  {
    id: 'monthly',
    productId: PREMIUM_PRODUCT_IDS.monthly,
    title: 'Monthly',
    description: 'Full premium access, billed monthly',
    price: '$9.99',
    pricePerMonth: '$9.99/mo',
  },
  {
    id: 'yearly',
    productId: PREMIUM_PRODUCT_IDS.yearly,
    title: 'Yearly',
    description: 'Best value for active traders',
    price: '$79.99',
    pricePerMonth: '$6.67/mo',
    badge: 'Most Popular',
    savingsPercent: 33,
    isPopular: true,
  },
  {
    id: 'lifetime',
    productId: PREMIUM_PRODUCT_IDS.lifetime,
    title: 'Lifetime',
    description: 'One-time payment, forever access',
    price: '$199.99',
    badge: 'Best Deal',
    savingsPercent: 50,
  },
];

function subscriptionDocRef(uid: string) {
  return doc(requireDb(), SUBSCRIPTIONS_COLLECTION, uid);
}

function getRevenueCatApiKey(): string {
  return process.env.EXPO_PUBLIC_REVENUECAT_API_KEY ?? '';
}

function serializeDate(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (
    value &&
    typeof value === 'object' &&
    'toDate' in value &&
    typeof (value as { toDate: () => Date }).toDate === 'function'
  ) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return null;
}

function toSubscriptionRecord(uid: string, data: DocumentData): SubscriptionRecord {
  return {
    uid,
    tier: (data.tier as SubscriptionTier) ?? 'free',
    isPremium: Boolean(data.isPremium),
    status: (data.status as SubscriptionStatus) ?? 'none',
    planId: (data.planId as SubscriptionPlanId | null) ?? null,
    productId: (data.productId as string | null) ?? null,
    entitlementId: (data.entitlementId as string) ?? REVENUECAT_ENTITLEMENT_ID,
    expiresAt: serializeDate(data.expiresAt),
    purchasedAt: serializeDate(data.purchasedAt),
    revenueCatAppUserId: (data.revenueCatAppUserId as string) ?? uid,
    lastSyncedAt: serializeDate(data.lastSyncedAt) ?? new Date().toISOString(),
    source: (data.source as SubscriptionRecord['source']) ?? 'firestore',
  };
}

function buildFreeSubscription(uid: string): SubscriptionRecord {
  return {
    uid,
    tier: 'free',
    isPremium: false,
    status: 'none',
    planId: null,
    productId: null,
    entitlementId: REVENUECAT_ENTITLEMENT_ID,
    expiresAt: null,
    purchasedAt: null,
    revenueCatAppUserId: uid,
    lastSyncedAt: new Date().toISOString(),
    source: 'local',
  };
}

function resolvePlanId(productId: string | null): SubscriptionPlanId | null {
  if (!productId) return null;
  if (productId === PREMIUM_PRODUCT_IDS.monthly) return 'monthly';
  if (productId === PREMIUM_PRODUCT_IDS.yearly) return 'yearly';
  if (productId === PREMIUM_PRODUCT_IDS.lifetime) return 'lifetime';
  return null;
}

function mapRevenueCatToRecord(
  uid: string,
  response: RevenueCatSubscriberResponse,
): SubscriptionRecord {
  const entitlement = response.subscriber.entitlements[REVENUECAT_ENTITLEMENT_ID];
  const now = Date.now();
  const expiresAt = entitlement?.expires_date ?? null;
  const isLifetime = expiresAt === null && Boolean(entitlement);
  const isExpired = expiresAt ? Date.parse(expiresAt) < now : false;
  const isPremium = Boolean(entitlement) && (isLifetime || !isExpired);
  const productId = entitlement?.product_identifier ?? null;

  let status: SubscriptionStatus = 'none';
  if (isPremium) status = 'active';
  else if (entitlement && isExpired) status = 'expired';

  return {
    uid,
    tier: isPremium ? 'premium' : 'free',
    isPremium,
    status,
    planId: resolvePlanId(productId),
    productId,
    entitlementId: REVENUECAT_ENTITLEMENT_ID,
    expiresAt,
    purchasedAt: entitlement?.purchase_date ?? null,
    revenueCatAppUserId: response.subscriber.original_app_user_id,
    lastSyncedAt: new Date().toISOString(),
    source: 'revenuecat',
  };
}

async function revenueCatRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const apiKey = getRevenueCatApiKey();
  if (!apiKey) {
    throw new Error('RevenueCat API key is not configured.');
  }

  const response = await fetch(`${REVENUECAT_API_BASE}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`RevenueCat request failed (${response.status}): ${body}`);
  }

  return (await response.json()) as T;
}

async function persistSubscription(record: SubscriptionRecord): Promise<SubscriptionRecord> {
  if (!isFirebaseConfigured()) {
    return record;
  }

  await setDoc(
    subscriptionDocRef(record.uid),
    {
      tier: record.tier,
      isPremium: record.isPremium,
      status: record.status,
      planId: record.planId,
      productId: record.productId,
      entitlementId: record.entitlementId,
      expiresAt: record.expiresAt,
      purchasedAt: record.purchasedAt,
      revenueCatAppUserId: record.revenueCatAppUserId,
      lastSyncedAt: serverTimestamp(),
      source: record.source,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  return { ...record, lastSyncedAt: new Date().toISOString(), source: 'firestore' };
}

function getWebCheckoutUrl(uid: string, planId: SubscriptionPlanId): string {
  const baseUrl =
    process.env.EXPO_PUBLIC_REVENUECAT_WEB_CHECKOUT_URL ??
    'https://pay.rev.cat/checkout';
  const productId = DEFAULT_PLANS.find((p) => p.id === planId)?.productId ?? planId;
  const params = new URLSearchParams({
    app_user_id: uid,
    product: productId,
  });
  return `${baseUrl}?${params.toString()}`;
}

class SubscriptionServiceImpl implements SubscriptionService {
  getPlans(): SubscriptionPlan[] {
    return DEFAULT_PLANS;
  }

  async getSubscription(uid: string): Promise<SubscriptionRecord | null> {
    if (!isFirebaseConfigured()) {
      return buildFreeSubscription(uid);
    }

    const snapshot = await getDoc(subscriptionDocRef(uid));
    if (!snapshot.exists()) {
      return null;
    }
    return toSubscriptionRecord(uid, snapshot.data());
  }

  async checkPremiumStatus(uid: string): Promise<boolean> {
    const record = await this.getSubscription(uid);
    if (record) {
      if (record.isPremium) {
        if (!record.expiresAt) return true;
        return Date.parse(record.expiresAt) > Date.now();
      }
      return false;
    }

    try {
      const synced = await this.syncFromRevenueCat(uid);
      return synced.isPremium;
    } catch {
      return false;
    }
  }

  async syncFromRevenueCat(uid: string): Promise<SubscriptionRecord> {
    if (!getRevenueCatApiKey()) {
      const fallback = (await this.getSubscription(uid)) ?? buildFreeSubscription(uid);
      return fallback;
    }

    const response = await revenueCatRequest<RevenueCatSubscriberResponse>(
      `/subscribers/${encodeURIComponent(uid)}`,
    );

    const record = mapRevenueCatToRecord(uid, response);
    return persistSubscription(record);
  }

  async purchasePlan(uid: string, planId: SubscriptionPlanId): Promise<PurchaseResult> {
    const checkoutUrl = getWebCheckoutUrl(uid, planId);

    try {
      await revenueCatRequest(`/subscribers/${encodeURIComponent(uid)}`, {
        method: 'POST',
        body: JSON.stringify({
          app_user_id: uid,
        }),
      });
    } catch {
      // Subscriber may already exist; continue to checkout.
    }

    const result = await WebBrowser.openBrowserAsync(checkoutUrl, {
      dismissButtonStyle: 'close',
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
    });

    let subscription: SubscriptionRecord | undefined;
    try {
      subscription = await this.syncFromRevenueCat(uid);
    } catch {
      subscription = (await this.getSubscription(uid)) ?? undefined;
    }

    const success = subscription?.isPremium ?? false;

    return {
      success,
      requiresWebCheckout: true,
      checkoutUrl,
      message: success
        ? 'Premium activated successfully.'
        : result.type === 'cancel'
          ? 'Checkout was cancelled.'
          : 'Complete purchase in the browser, then return to refresh your status.',
      subscription,
    };
  }

  async restorePurchases(uid: string): Promise<SubscriptionRecord> {
    return this.syncFromRevenueCat(uid);
  }
}

export const subscriptionService: SubscriptionService = new SubscriptionServiceImpl();
