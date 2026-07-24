import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Linking from 'expo-linking';
import { doc, getDoc, type DocumentData } from 'firebase/firestore';
import { Platform } from 'react-native';
import type PurchasesType from 'react-native-purchases';
import type { PurchasesPackage } from 'react-native-purchases';

import { canUseFirestore, requireDb } from '@/firebase/config';
import {
  PREMIUM_PRODUCT_IDS,
  REVENUECAT_ENTITLEMENT_ID,
  YEARLY_TRIAL_DAYS,
  type SubscriptionTier,
} from '@/shared/constants/subscription';

import { withEffectiveAccess } from './subscription-access';
import type {
  PurchaseResult,
  SubscriptionPlan,
  SubscriptionPlanId,
  SubscriptionRecord,
  SubscriptionService,
  SubscriptionStatus,
} from '../types/subscription.types';

const SUBSCRIPTIONS_COLLECTION = 'subscriptions';
const POLL_DELAYS_MS = [500, 1_000, 2_000, 3_000];

const DEFAULT_PLANS: SubscriptionPlan[] = [
  {
    id: 'monthly',
    productId: PREMIUM_PRODUCT_IDS.monthly,
    title: 'Monthly',
    description: 'Full access, billed monthly. Cancel anytime.',
    price: '$9.99',
    pricePerMonth: '$9.99/mo',
  },
  {
    id: 'yearly',
    productId: PREMIUM_PRODUCT_IDS.yearly,
    title: 'Yearly',
    description: 'Best value — commit to the process for a year',
    price: '$71.99',
    pricePerMonth: '$5.99/mo',
    badge: 'Save 40%',
    savingsPercent: 40,
    isPopular: true,
    trialDays: YEARLY_TRIAL_DAYS,
    trialLabel: `${YEARLY_TRIAL_DAYS}-day free trial`,
  },
];

let purchasesModule: typeof PurchasesType | null | undefined;
let configuredUserId: string | null = null;

function getPurchases(): typeof PurchasesType | null {
  if (purchasesModule !== undefined) return purchasesModule;
  if (
    Platform.OS === 'web' ||
    Constants.executionEnvironment === ExecutionEnvironment.StoreClient
  ) {
    purchasesModule = null;
    return null;
  }

  try {
    purchasesModule = (require('react-native-purchases') as { default: typeof PurchasesType })
      .default;
  } catch {
    purchasesModule = null;
  }
  return purchasesModule;
}

function getPublicSdkKey(): string {
  if (Platform.OS === 'ios') return process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY ?? '';
  if (Platform.OS === 'android') return process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY ?? '';
  return '';
}

function serializeDate(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (
    typeof value === 'object' &&
    'toDate' in value &&
    typeof (value as { toDate: () => Date }).toDate === 'function'
  ) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return null;
}

function mapStore(value: unknown): SubscriptionRecord['store'] {
  const store = String(value ?? '').toLowerCase();
  if (store === 'app_store' || store === 'play_store' || store === 'stripe') return store;
  if (store === 'promotional') return 'promotional';
  return 'unknown';
}

function toSubscriptionRecord(uid: string, data: DocumentData): SubscriptionRecord {
  const record: SubscriptionRecord = {
    uid,
    tier: (data.tier as SubscriptionTier) ?? 'free',
    isPremium: false,
    status: (data.status as SubscriptionStatus) ?? 'none',
    planId: (data.planId as SubscriptionPlanId | null) ?? null,
    productId: (data.productId as string | null) ?? null,
    entitlementId: (data.entitlementId as string) ?? REVENUECAT_ENTITLEMENT_ID,
    expiresAt: serializeDate(data.expiresAt),
    purchasedAt: serializeDate(data.purchasedAt),
    cancelledAt: serializeDate(data.cancelledAt),
    willRenew: Boolean(data.willRenew),
    store: mapStore(data.store),
    lastEventId: (data.lastEventId as string | null) ?? null,
    revenueCatAppUserId: (data.revenueCatAppUserId as string) ?? uid,
    lastSyncedAt: serializeDate(data.lastSyncedAt) ?? new Date(0).toISOString(),
    source: 'firestore',
  };
  return withEffectiveAccess(record);
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
    cancelledAt: null,
    willRenew: false,
    store: 'unknown',
    lastEventId: null,
    revenueCatAppUserId: uid,
    lastSyncedAt: new Date().toISOString(),
    source: 'local',
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class SubscriptionServiceImpl implements SubscriptionService {
  getPlans(): SubscriptionPlan[] {
    return DEFAULT_PLANS;
  }

  async getStorePlans(): Promise<SubscriptionPlan[]> {
    const Purchases = getPurchases();
    if (!Purchases || !getPublicSdkKey()) return DEFAULT_PLANS;

    try {
      const isConfigured = await Purchases.isConfigured();
      if (!isConfigured) return DEFAULT_PLANS;

      const offerings = await Purchases.getOfferings();
      const packages = offerings.current?.availablePackages ?? [];
      if (!packages.length) return DEFAULT_PLANS;

      return DEFAULT_PLANS.map((plan) => {
        const storePackage = packages.find(
          (item: PurchasesPackage) => item.product.identifier === plan.productId,
        );
        if (!storePackage) return plan;

        const priceString = storePackage.product.priceString;
        return {
          ...plan,
          price: priceString,
          pricePerMonth:
            plan.id === 'yearly'
              ? plan.pricePerMonth
              : priceString
                ? `${priceString}/mo`
                : plan.pricePerMonth,
          title: storePackage.product.title || plan.title,
          description: storePackage.product.description || plan.description,
        };
      });
    } catch {
      return DEFAULT_PLANS;
    }
  }

  isNativeBillingAvailable(): boolean {
    return Boolean(getPurchases() && getPublicSdkKey());
  }

  async configureForUser(uid: string | null): Promise<boolean> {
    const Purchases = getPurchases();
    const apiKey = getPublicSdkKey();
    if (!Purchases || !apiKey) {
      configuredUserId = null;
      return false;
    }

    const isConfigured = await Purchases.isConfigured();
    if (!isConfigured) {
      if (!uid) return false;
      Purchases.configure({ apiKey, appUserID: uid });
      configuredUserId = uid;
      return true;
    }

    if (!uid) {
      if (!(await Purchases.isAnonymous())) await Purchases.logOut();
      configuredUserId = null;
      return true;
    }
    if (configuredUserId !== uid) {
      await Purchases.logIn(uid);
      configuredUserId = uid;
    }
    return true;
  }

  async getSubscription(uid: string): Promise<SubscriptionRecord | null> {
    if (!canUseFirestore(uid)) return buildFreeSubscription(uid);
    const snapshot = await getDoc(doc(requireDb(), SUBSCRIPTIONS_COLLECTION, uid));
    return snapshot.exists() ? toSubscriptionRecord(uid, snapshot.data()) : null;
  }

  async checkPremiumStatus(uid: string): Promise<boolean> {
    return Boolean((await this.getSubscription(uid))?.isPremium);
  }

  async syncFromRevenueCat(uid: string): Promise<SubscriptionRecord> {
    const Purchases = getPurchases();
    if (Purchases && (await this.configureForUser(uid))) {
      await Purchases.invalidateCustomerInfoCache();
      await Purchases.getCustomerInfo();
    }
    return (await this.getSubscription(uid)) ?? buildFreeSubscription(uid);
  }

  private async waitForServerRecord(
    uid: string,
    previousEventId: string | null,
  ): Promise<SubscriptionRecord> {
    for (const delay of POLL_DELAYS_MS) {
      await sleep(delay);
      const record = await this.getSubscription(uid);
      if (record && record.lastEventId !== previousEventId) return record;
    }
    return (await this.getSubscription(uid)) ?? buildFreeSubscription(uid);
  }

  async purchasePlan(uid: string, planId: SubscriptionPlanId): Promise<PurchaseResult> {
    const Purchases = getPurchases();
    if (!Purchases || !(await this.configureForUser(uid))) {
      throw new Error('Purchases require an EAS development or production build.');
    }

    const before = await this.getSubscription(uid);
    const offerings = await Purchases.getOfferings();
    const productId = DEFAULT_PLANS.find((plan) => plan.id === planId)?.productId;
    const selectedPackage = offerings.current?.availablePackages.find(
      (item: PurchasesPackage) => item.product.identifier === productId,
    );
    if (!selectedPackage) {
      throw new Error('This subscription is not available from the store right now.');
    }

    try {
      await Purchases.purchasePackage(selectedPackage);
    } catch (error) {
      const purchaseError = error as { userCancelled?: boolean };
      if (purchaseError.userCancelled) {
        return {
          success: false,
          requiresWebCheckout: false,
          message: 'Purchase cancelled.',
          subscription: before ?? undefined,
        };
      }
      throw error;
    }

    const subscription = await this.waitForServerRecord(uid, before?.lastEventId ?? null);
    return {
      success: subscription.isPremium,
      requiresWebCheckout: false,
      message: subscription.isPremium
        ? 'Premium activated.'
        : 'Purchase received. Your access will update after store verification.',
      subscription,
    };
  }

  async restorePurchases(uid: string): Promise<SubscriptionRecord> {
    const Purchases = getPurchases();
    if (!Purchases || !(await this.configureForUser(uid))) {
      throw new Error('Restore requires an EAS development or production build.');
    }
    const before = await this.getSubscription(uid);
    await Purchases.restorePurchases();
    return this.waitForServerRecord(uid, before?.lastEventId ?? null);
  }

  async manageSubscription(record: SubscriptionRecord | null): Promise<void> {
    const Purchases = getPurchases();
    if (Purchases && configuredUserId) {
      try {
        await Purchases.showManageSubscriptions();
        return;
      } catch {
        // Fall through to the provider's account page.
      }
    }

    if (record?.store === 'play_store') {
      const sku = record.productId ? `&sku=${encodeURIComponent(record.productId)}` : '';
      await Linking.openURL(
        `https://play.google.com/store/account/subscriptions?package=ai.tradevision.app${sku}`,
      );
      return;
    }
    if (record?.store === 'stripe' && process.env.EXPO_PUBLIC_SUBSCRIPTION_PORTAL_URL) {
      await Linking.openURL(process.env.EXPO_PUBLIC_SUBSCRIPTION_PORTAL_URL);
      return;
    }
    if (Platform.OS === 'android') {
      await Linking.openURL(
        'https://play.google.com/store/account/subscriptions?package=ai.tradevision.app',
      );
      return;
    }
    if (Platform.OS === 'ios') {
      await Linking.openURL('https://apps.apple.com/account/subscriptions');
      return;
    }
    if (process.env.EXPO_PUBLIC_SUBSCRIPTION_PORTAL_URL) {
      await Linking.openURL(process.env.EXPO_PUBLIC_SUBSCRIPTION_PORTAL_URL);
      return;
    }
    throw new Error('Manage subscriptions from the iOS or Android app.');
  }
}

export const subscriptionService: SubscriptionService = new SubscriptionServiceImpl();
