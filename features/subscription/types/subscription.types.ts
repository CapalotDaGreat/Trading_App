import type { SubscriptionTier } from '@/shared/constants/subscription';

export type SubscriptionPlanId = 'monthly' | 'yearly' | 'lifetime';

export type SubscriptionStatus = 'active' | 'expired' | 'cancelled' | 'grace_period' | 'none';

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
  revenueCatAppUserId: string;
  lastSyncedAt: string;
  source: 'firestore' | 'revenuecat' | 'local';
}

export interface PurchaseResult {
  success: boolean;
  requiresWebCheckout: boolean;
  checkoutUrl?: string;
  message: string;
  subscription?: SubscriptionRecord;
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
  getSubscription(uid: string): Promise<SubscriptionRecord | null>;
  checkPremiumStatus(uid: string): Promise<boolean>;
  syncFromRevenueCat(uid: string): Promise<SubscriptionRecord>;
  purchasePlan(uid: string, planId: SubscriptionPlanId): Promise<PurchaseResult>;
  restorePurchases(uid: string): Promise<SubscriptionRecord>;
}
