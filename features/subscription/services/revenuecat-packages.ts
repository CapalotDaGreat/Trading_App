import {
  PREMIUM_PRODUCT_IDS,
  YEARLY_TRIAL_DAYS,
  planIdFromProductId,
} from '@/shared/constants/subscription';

import {
  isApple12mCommitmentPlatformEligible,
  isCommitmentProductIdentifier,
} from './apple-12m-commitment';
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

const PLAN_ORDER: SubscriptionPlanId[] = [
  'yearly',
  'monthly_12m_commitment',
  'monthly',
  'lifetime',
];

export const FALLBACK_SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'yearly',
    productId: PREMIUM_PRODUCT_IDS.yearly,
    title: 'Yearly',
    description: 'Best value — billed once per year. Cancel renewal anytime before renews.',
    price: '$71.99',
    pricePerMonth: '$5.99/mo',
    badge: 'Save 40%',
    savingsPercent: 40,
    isPopular: true,
    trialDays: YEARLY_TRIAL_DAYS,
    trialLabel: `${YEARLY_TRIAL_DAYS}-day free trial`,
    isFallbackPrice: true,
  },
  {
    id: 'monthly_12m_commitment',
    productId: PREMIUM_PRODUCT_IDS.monthly_12m_commitment,
    title: 'Monthly · 12-mo commitment',
    description:
      'Pay monthly for 12 months. Cancelling stops renewal after the commitment; remaining committed payments still apply.',
    price: 'See store',
    pricePerMonth: undefined,
    badge: '12-mo commit',
    isApple12mCommitment: true,
    commitmentMonths: 12,
    isFallbackPrice: true,
  },
  {
    id: 'monthly',
    productId: PREMIUM_PRODUCT_IDS.monthly,
    title: 'Monthly',
    description: 'Full Aithera Pro depth, billed monthly. Cancel renewal anytime.',
    price: '$9.99',
    pricePerMonth: '$9.99/mo',
    isFallbackPrice: true,
  },
  {
    id: 'lifetime',
    productId: PREMIUM_PRODUCT_IDS.lifetime,
    title: 'Lifetime',
    description: 'One-time purchase. Full Aithera Pro depth with no renewal.',
    price: 'See store',
    badge: 'Pay once',
    isLifetime: true,
    isFallbackPrice: true,
  },
];

export function planIdFromOfferingPackage(pkg: OfferingPackageLike): SubscriptionPlanId | null {
  const productId = pkg.product.identifier;
  if (isCommitmentProductIdentifier(productId) || isCommitmentProductIdentifier(pkg.identifier)) {
    return 'monthly_12m_commitment';
  }

  const type = String(pkg.packageType ?? '').toUpperCase();
  if (type === 'LIFETIME') return 'lifetime';
  if (type === 'ANNUAL') return 'yearly';
  if (type === 'MONTHLY') {
    // Custom packages for the commitment plan may still report MONTHLY.
    if (isCommitmentProductIdentifier(`${pkg.identifier ?? ''} ${productId}`)) {
      return 'monthly_12m_commitment';
    }
    return 'monthly';
  }

  const blob = `${pkg.identifier ?? ''} ${productId}`.toLowerCase();
  if (blob.includes('12m') && blob.includes('commitment')) return 'monthly_12m_commitment';
  if (blob.includes('$rc_lifetime') || blob.includes('lifetime')) return 'lifetime';
  if (blob.includes('$rc_annual') || blob.includes('annual') || blob.includes('yearly')) {
    return 'yearly';
  }
  if (blob.includes('$rc_monthly') || blob.includes('monthly')) return 'monthly';
  return planIdFromProductId(productId);
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
    isFallbackPrice: !priceString,
    pricePerMonth:
      (id === 'monthly' || id === 'monthly_12m_commitment') && priceString
        ? `${priceString}/mo`
        : id === 'lifetime'
          ? undefined
          : base.pricePerMonth,
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

/** Drop Apple commitment plan on unsupported platforms / OS versions. */
export function filterPlansForRuntime(
  plans: SubscriptionPlan[],
  options?: { platformEligible?: boolean },
): SubscriptionPlan[] {
  const eligible =
    options?.platformEligible ?? isApple12mCommitmentPlatformEligible();
  return plans.filter((plan) => {
    if (!plan.isApple12mCommitment && plan.id !== 'monthly_12m_commitment') return true;
    return eligible;
  });
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
