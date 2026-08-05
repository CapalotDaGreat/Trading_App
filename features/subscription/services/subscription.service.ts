import Constants, { ExecutionEnvironment } from 'expo-constants';
import { doc, getDoc, type DocumentData } from 'firebase/firestore';
import { Platform } from 'react-native';
import type PurchasesType from 'react-native-purchases';
import type { CustomerInfo, PurchasesPackage } from 'react-native-purchases';

import { canUseFirestore, requireDb } from '@/firebase/config';
import {
  PREMIUM_PRODUCT_IDS,
  REVENUECAT_ENTITLEMENT_ID,
  YEARLY_TRIAL_DAYS,
  planIdFromProductId,
  type SubscriptionTier,
} from '@/shared/constants/subscription';
import { openExternalUrl } from '@/shared/utils/open-url';

import { withEffectiveAccess } from './subscription-access';
import type {
  PaywallPresentationResult,
  PurchaseResult,
  SubscriptionPlan,
  SubscriptionPlanId,
  SubscriptionRecord,
  SubscriptionService,
  SubscriptionStatus,
} from '../types/subscription.types';

const SUBSCRIPTIONS_COLLECTION = 'subscriptions';
/** Post-purchase webhook lag — keep UX optimistic via RC customerInfo when possible. */
const POLL_DELAYS_MS = [400, 800, 1_500, 2_500, 4_000, 6_000];

const DEFAULT_PLANS: SubscriptionPlan[] = [
  {
    id: 'monthly',
    productId: PREMIUM_PRODUCT_IDS.monthly,
    title: 'Monthly',
    description: 'Full Aithera Pro access, billed monthly. Cancel anytime.',
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
  {
    id: 'lifetime',
    productId: PREMIUM_PRODUCT_IDS.lifetime,
    title: 'Lifetime',
    description: 'One-time purchase. Permanent Aithera Pro access.',
    price: '$149.99',
    badge: 'Pay once',
    isLifetime: true,
  },
];

let purchasesModule: typeof PurchasesType | null | undefined;
let purchasesUiModule: typeof import('react-native-purchases-ui') | null | undefined;
let configuredUserId: string | null = null;
let logLevelConfigured = false;

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

function getPurchasesUi(): typeof import('react-native-purchases-ui') | null {
  if (purchasesUiModule !== undefined) return purchasesUiModule;
  if (
    Platform.OS === 'web' ||
    Constants.executionEnvironment === ExecutionEnvironment.StoreClient
  ) {
    purchasesUiModule = null;
    return null;
  }

  try {
    purchasesUiModule = require('react-native-purchases-ui') as typeof import('react-native-purchases-ui');
  } catch {
    purchasesUiModule = null;
  }
  return purchasesUiModule;
}

/**
 * Prefer platform-specific public SDK keys. Falls back to a shared test/public key
 * (`EXPO_PUBLIC_REVENUECAT_API_KEY`) for local sandbox wiring.
 */
function getPublicSdkKey(): string {
  const shared = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY?.trim() ?? '';
  if (Platform.OS === 'ios') {
    return process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY?.trim() || shared;
  }
  if (Platform.OS === 'android') {
    return process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY?.trim() || shared;
  }
  return shared;
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

function mapPaywallResult(result: string): PaywallPresentationResult {
  switch (result) {
    case 'PURCHASED':
      return 'purchased';
    case 'RESTORED':
      return 'restored';
    case 'CANCELLED':
      return 'cancelled';
    case 'NOT_PRESENTED':
      return 'not_presented';
    default:
      return 'error';
  }
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
          (item: PurchasesPackage) =>
            item.product.identifier === plan.productId ||
            item.identifier === plan.productId ||
            item.product.identifier.endsWith(`.${plan.productId}`),
        );
        if (!storePackage) return plan;

        const priceString = storePackage.product.priceString;
        return {
          ...plan,
          price: priceString,
          pricePerMonth:
            plan.id === 'yearly' || plan.id === 'lifetime'
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

    if (__DEV__ && !logLevelConfigured) {
      Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
      logLevelConfigured = true;
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

  async hasAitheraProEntitlement(uid: string): Promise<boolean> {
    const Purchases = getPurchases();
    if (!Purchases || !(await this.configureForUser(uid))) {
      return this.checkPremiumStatus(uid);
    }

    try {
      const customerInfo = await Purchases.getCustomerInfo();
      return Boolean(customerInfo.entitlements.active[REVENUECAT_ENTITLEMENT_ID]);
    } catch {
      return this.checkPremiumStatus(uid);
    }
  }

  private recordFromCustomerInfo(uid: string, customerInfo: CustomerInfo): SubscriptionRecord | null {
    const entitlement = customerInfo.entitlements.active[REVENUECAT_ENTITLEMENT_ID];
    if (!entitlement) return null;

    const productId = entitlement.productIdentifier ?? null;
    const planId = planIdFromProductId(productId);
    const isLifetime = planId === 'lifetime' || entitlement.expirationDate == null;

    return withEffectiveAccess({
      ...buildFreeSubscription(uid),
      tier: 'premium',
      isPremium: true,
      status: 'active',
      productId,
      planId,
      expiresAt: entitlement.expirationDate ?? null,
      willRenew: isLifetime ? false : Boolean(entitlement.willRenew),
      store: mapStore(entitlement.store),
      purchasedAt: entitlement.latestPurchaseDate ?? null,
      source: 'revenuecat',
      lastSyncedAt: new Date().toISOString(),
    });
  }

  async syncFromRevenueCat(uid: string): Promise<SubscriptionRecord> {
    const Purchases = getPurchases();
    if (Purchases && (await this.configureForUser(uid))) {
      await Purchases.invalidateCustomerInfoCache();
      const customerInfo = await Purchases.getCustomerInfo();
      const firestore = await this.getSubscription(uid);
      if (firestore?.isPremium) return firestore;
      const fromRc = this.recordFromCustomerInfo(uid, customerInfo);
      if (fromRc) return fromRc;
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

  private async finalizeAfterCustomerInfo(
    uid: string,
    customerInfo: CustomerInfo,
    previousEventId: string | null,
    successMessage: string,
  ): Promise<PurchaseResult> {
    const optimistic = this.recordFromCustomerInfo(uid, customerInfo);
    const subscription = await this.waitForServerRecord(uid, previousEventId);
    const effective =
      subscription.isPremium || !optimistic
        ? subscription
        : withEffectiveAccess({ ...optimistic, lastSyncedAt: new Date().toISOString() });

    return {
      success: effective.isPremium,
      requiresWebCheckout: false,
      message: effective.isPremium
        ? successMessage
        : 'Purchase received. Your access will update after store verification.',
      subscription: effective,
    };
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
      (item: PurchasesPackage) =>
        item.product.identifier === productId ||
        item.identifier === productId ||
        (productId != null && item.product.identifier.endsWith(`.${productId}`)),
    );
    if (!selectedPackage) {
      throw new Error('This subscription is not available from the store right now.');
    }

    try {
      const result = await Purchases.purchasePackage(selectedPackage);
      return this.finalizeAfterCustomerInfo(
        uid,
        result.customerInfo,
        before?.lastEventId ?? null,
        'Aithera Pro activated.',
      );
    } catch (error) {
      const purchaseError = error as { userCancelled?: boolean };
      if (purchaseError.userCancelled) {
        return {
          success: false,
          requiresWebCheckout: false,
          message: 'Purchase cancelled.',
          subscription: before ?? undefined,
          paywallResult: 'cancelled',
        };
      }
      throw error;
    }
  }

  async presentPaywall(uid: string): Promise<PurchaseResult> {
    const Purchases = getPurchases();
    const RevenueCatUI = getPurchasesUi()?.default;
    if (!Purchases || !RevenueCatUI || !(await this.configureForUser(uid))) {
      throw new Error('Paywalls require an EAS development or production build.');
    }

    const before = await this.getSubscription(uid);
    const result = await RevenueCatUI.presentPaywall();
    const paywallResult = mapPaywallResult(String(result));

    if (paywallResult !== 'purchased' && paywallResult !== 'restored') {
      return {
        success: false,
        requiresWebCheckout: false,
        message:
          paywallResult === 'cancelled'
            ? 'Purchase cancelled.'
            : paywallResult === 'not_presented'
              ? 'Paywall could not be presented.'
              : 'Paywall closed without a purchase.',
        subscription: before ?? undefined,
        paywallResult,
      };
    }

    const customerInfo = await Purchases.getCustomerInfo();
    const finalized = await this.finalizeAfterCustomerInfo(
      uid,
      customerInfo,
      before?.lastEventId ?? null,
      paywallResult === 'restored' ? 'Purchases restored.' : 'Aithera Pro activated.',
    );
    return { ...finalized, paywallResult };
  }

  async presentPaywallIfNeeded(uid: string): Promise<PurchaseResult> {
    const Purchases = getPurchases();
    const RevenueCatUI = getPurchasesUi()?.default;
    if (!Purchases || !RevenueCatUI || !(await this.configureForUser(uid))) {
      throw new Error('Paywalls require an EAS development or production build.');
    }

    const before = await this.getSubscription(uid);
    const result = await RevenueCatUI.presentPaywallIfNeeded({
      requiredEntitlementIdentifier: REVENUECAT_ENTITLEMENT_ID,
    });
    const paywallResult = mapPaywallResult(String(result));

    if (paywallResult === 'not_presented') {
      const alreadyPro = await this.hasAitheraProEntitlement(uid);
      return {
        success: alreadyPro,
        requiresWebCheckout: false,
        message: alreadyPro ? 'Aithera Pro is already active.' : 'Paywall was not presented.',
        subscription: before ?? undefined,
        paywallResult,
      };
    }

    if (paywallResult !== 'purchased' && paywallResult !== 'restored') {
      return {
        success: false,
        requiresWebCheckout: false,
        message: paywallResult === 'cancelled' ? 'Purchase cancelled.' : 'Paywall closed.',
        subscription: before ?? undefined,
        paywallResult,
      };
    }

    const customerInfo = await Purchases.getCustomerInfo();
    const finalized = await this.finalizeAfterCustomerInfo(
      uid,
      customerInfo,
      before?.lastEventId ?? null,
      'Aithera Pro activated.',
    );
    return { ...finalized, paywallResult };
  }

  async presentCustomerCenter(uid: string): Promise<void> {
    const RevenueCatUI = getPurchasesUi()?.default;
    if (!RevenueCatUI || !(await this.configureForUser(uid))) {
      throw new Error('Customer Center requires an EAS development or production build.');
    }

    await RevenueCatUI.presentCustomerCenter({
      callbacks: {
        onRestoreCompleted: () => {
          void this.syncFromRevenueCat(uid);
        },
      },
    });
  }

  async restorePurchases(uid: string): Promise<SubscriptionRecord> {
    const Purchases = getPurchases();
    if (!Purchases || !(await this.configureForUser(uid))) {
      throw new Error('Restore requires an EAS development or production build.');
    }
    const before = await this.getSubscription(uid);
    const customerInfo = await Purchases.restorePurchases();
    const optimistic = this.recordFromCustomerInfo(uid, customerInfo);
    const subscription = await this.waitForServerRecord(uid, before?.lastEventId ?? null);
    if (subscription.isPremium || !optimistic) return subscription;
    return withEffectiveAccess({ ...optimistic, lastSyncedAt: new Date().toISOString() });
  }

  async manageSubscription(record: SubscriptionRecord | null): Promise<void> {
    const uid = configuredUserId ?? record?.uid ?? null;
    if (uid && getPurchasesUi()?.default) {
      try {
        await this.presentCustomerCenter(uid);
        return;
      } catch {
        // Fall through to native manage / web portals.
      }
    }

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
      await openExternalUrl(
        `https://play.google.com/store/account/subscriptions?package=ai.tradevision.app${sku}`,
      );
      return;
    }
    if (record?.store === 'stripe' && process.env.EXPO_PUBLIC_SUBSCRIPTION_PORTAL_URL) {
      await openExternalUrl(process.env.EXPO_PUBLIC_SUBSCRIPTION_PORTAL_URL);
      return;
    }
    if (Platform.OS === 'android') {
      await openExternalUrl(
        'https://play.google.com/store/account/subscriptions?package=ai.tradevision.app',
      );
      return;
    }
    if (Platform.OS === 'ios') {
      await openExternalUrl('https://apps.apple.com/account/subscriptions');
      return;
    }
    if (process.env.EXPO_PUBLIC_SUBSCRIPTION_PORTAL_URL) {
      await openExternalUrl(process.env.EXPO_PUBLIC_SUBSCRIPTION_PORTAL_URL);
      return;
    }
    throw new Error('Manage subscriptions from the iOS or Android app.');
  }

  addCustomerInfoListener(
    uid: string,
    onUpdate: (record: SubscriptionRecord) => void,
  ): () => void {
    const Purchases = getPurchases();
    if (!Purchases) return () => undefined;

    const listener = (customerInfo: CustomerInfo) => {
      const record = this.recordFromCustomerInfo(uid, customerInfo);
      if (record) onUpdate(record);
      else onUpdate(buildFreeSubscription(uid));
    };

    Purchases.addCustomerInfoUpdateListener(listener);
    return () => {
      void Purchases.removeCustomerInfoUpdateListener(listener);
    };
  }
}

export const subscriptionService: SubscriptionService = new SubscriptionServiceImpl();
