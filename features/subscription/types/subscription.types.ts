import type { SubscriptionTier } from '@/shared/constants/subscription';

export type SubscriptionPlanId = 'monthly' | 'yearly' | 'lifetime';

export type SubscriptionStatus =
  | 'active'
  | 'expired'
  | 'cancelled'
  | 'grace_period'
  | 'billing_issue'
  | 'refunded'
  | 'none';

export type PaywallPresentationResult =
  | 'purchased'
  | 'restored'
  | 'cancelled'
  | 'not_presented'
  | 'error';

export interface SubscriptionPlan {
  id: SubscriptionPlanId;
  productId: string;
  title: string;
  description: string;
  price: string;
  pricePerMonth?: string;
  badge?: string;
  savingsPercent?: number;
  isPopular?: boolean;
  /** One-time purchase — never renews. */
  isLifetime?: boolean;
  /** Intro free-trial days (configure matching offer in RevenueCat / store consoles). */
  trialDays?: number;
  trialLabel?: string;
}

export interface SubscriptionEntitlement {
  identifier: string;
  isActive: boolean;
  productIdentifier: string | null;
  expiresAt: string | null;
  willRenew: boolean;
  store: 'app_store' | 'play_store' | 'stripe' | 'promotional' | 'unknown';
}

export interface SubscriptionRecord {
  uid: string;
  tier: SubscriptionTier;
  isPremium: boolean;
  status: SubscriptionStatus;
  planId: SubscriptionPlanId | null;
  productId: string | null;
  entitlementId: string;
  expiresAt: string | null;
  purchasedAt: string | null;
  cancelledAt: string | null;
  willRenew: boolean;
  store: SubscriptionEntitlement['store'];
  lastEventId: string | null;
  revenueCatAppUserId: string;
  lastSyncedAt: string;
  source: 'firestore' | 'revenuecat' | 'local';
}

export interface PurchaseResult {
  success: boolean;
  requiresWebCheckout: false;
  message: string;
  subscription?: SubscriptionRecord;
  paywallResult?: PaywallPresentationResult;
}

export interface RevenueCatSubscriberResponse {
  request_date: string;
  subscriber: {
    entitlements: Record<
      string,
      {
        expires_date: string | null;
        product_identifier: string;
        purchase_date: string;
      }
    >;
    subscriptions: Record<
      string,
      {
        expires_date: string | null;
        purchase_date: string;
        store: string;
        unsubscribe_detected_at: string | null;
        billing_issues_detected_at: string | null;
      }
    >;
    original_app_user_id: string;
  };
}

export interface SubscriptionService {
  getPlans(): SubscriptionPlan[];
  /** Prefer StoreKit/Play Billing localized price strings when offerings are available. */
  getStorePlans(): Promise<SubscriptionPlan[]>;
  getSubscription(uid: string): Promise<SubscriptionRecord | null>;
  checkPremiumStatus(uid: string): Promise<boolean>;
  hasAitheraProEntitlement(uid: string): Promise<boolean>;
  syncFromRevenueCat(uid: string): Promise<SubscriptionRecord>;
  purchasePlan(uid: string, planId: SubscriptionPlanId): Promise<PurchaseResult>;
  presentPaywall(uid: string): Promise<PurchaseResult>;
  presentPaywallIfNeeded(uid: string): Promise<PurchaseResult>;
  presentCustomerCenter(uid: string): Promise<void>;
  restorePurchases(uid: string): Promise<SubscriptionRecord>;
  configureForUser(uid: string | null): Promise<boolean>;
  manageSubscription(record: SubscriptionRecord | null): Promise<void>;
  isNativeBillingAvailable(): boolean;
  addCustomerInfoListener(
    uid: string,
    onUpdate: (record: SubscriptionRecord) => void,
  ): () => void;
}
