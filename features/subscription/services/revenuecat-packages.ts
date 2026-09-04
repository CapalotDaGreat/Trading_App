import {
  PREMIUM_PRODUCT_IDS,
  YEARLY_TRIAL_DAYS,
  planIdFromProductId,
} from '@/shared/constants/subscription';

import type { SubscriptionPlan, SubscriptionPlanId } from '../types/subscription.types';

export interface OfferingPackageLike {
  identifier?: string;
  packageType?: string;
  product: {
    identifier: string;
    title?: string;
    description?: string;
    priceString?: string;
  };
}

const PLAN_ORDER: SubscriptionPlanId[] = ['yearly', 'monthly', 'lifetime'];

export const FALLBACK_SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
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
    id: 'monthly',
    productId: PREMIUM_PRODUCT_IDS.monthly,
    title: 'Monthly',
    description: 'Full Aithera Pro depth, billed monthly. Cancel anytime.',
    price: '$9.99',
    pricePerMonth: '$9.99/mo',
  },
  {
    id: 'lifetime',
    productId: PREMIUM_PRODUCT_IDS.lifetime,
    title: 'Lifetime',
    description: 'One-time purchase. Full Aithera Pro depth with no renewal.',
    price: 'See store',
    badge: 'Pay once',
    isLifetime: true,
  },
];

export function planIdFromOfferingPackage(pkg: OfferingPackageLike): SubscriptionPlanId | null {
  const type = String(pkg.packageType ?? '').toUpperCase();
  if (type === 'LIFETIME') return 'lifetime';
  if (type === 'ANNUAL') return 'yearly';
  if (type === 'MONTHLY') return 'monthly';

  const blob = `${pkg.identifier ?? ''} ${pkg.product.identifier}`.toLowerCase();
  if (blob.includes('$rc_lifetime') || blob.includes('lifetime')) return 'lifetime';
  if (blob.includes('$rc_annual') || blob.includes('annual') || blob.includes('yearly')) {
    return 'yearly';
  }
  if (blob.includes('$rc_monthly') || blob.includes('monthly')) return 'monthly';
  return planIdFromProductId(pkg.product.identifier);
}

export function fallbackPlan(planId: SubscriptionPlanId): SubscriptionPlan {
  return FALLBACK_SUBSCRIPTION_PLANS.find((plan) => plan.id === planId) ?? FALLBACK_SUBSCRIPTION_PLANS[0];
}

export function planFromOfferingPackage(pkg: OfferingPackageLike): SubscriptionPlan | null {
  const id = planIdFromOfferingPackage(pkg);
  if (!id) return null;
  const base = fallbackPlan(id);
  const priceString = pkg.product.priceString?.trim();
  return {
    ...base,
    productId: pkg.product.identifier || base.productId,
    title: pkg.product.title?.trim() || base.title,
    description: pkg.product.description?.trim() || base.description,
    price: priceString || base.price,
    pricePerMonth:
      id === 'monthly' && priceString ? `${priceString}/mo` : id === 'lifetime' ? undefined : base.pricePerMonth,
  };
}

export function plansFromOfferingPackages(packages: OfferingPackageLike[]): SubscriptionPlan[] {
  const byId = new Map<SubscriptionPlanId, SubscriptionPlan>();
  for (const pkg of packages) {
    const plan = planFromOfferingPackage(pkg);
    if (plan) byId.set(plan.id, plan);
  }
  return PLAN_ORDER.map((id) => byId.get(id)).filter((plan): plan is SubscriptionPlan => Boolean(plan));
}

export function findPackageForPlan<T extends OfferingPackageLike>(
  packages: T[],
  planId: SubscriptionPlanId,
): T | undefined {
  const expectedProductId = fallbackPlan(planId).productId;
  return packages.find((pkg) => {
    if (planIdFromOfferingPackage(pkg) === planId) return true;
    const identifier = pkg.product.identifier;
    return (
      identifier === expectedProductId ||
      pkg.identifier === expectedProductId ||
      identifier.endsWith(`.${expectedProductId}`)
    );
  });
}
