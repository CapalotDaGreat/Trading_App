import { Platform } from 'react-native';

import { PREMIUM_PRODUCT_IDS } from '@/shared/constants/subscription';

/**
 * Apple "Monthly with a 12-Month Commitment" (StoreKit billing plan on a 1-year
 * auto-renewable subscription). Customer OS: 26.4+ (except watchOS). Apps must be
 * built with Xcode / SDK 26.5+. Unavailable in United States and Singapore storefronts.
 *
 * @see https://developer.apple.com/news/?id=agq42lxe
 */
export const APPLE_12M_COMMITMENT_MIN_OS = { major: 26, minor: 4 } as const;

/** App-layer merchandising / RevenueCat custom package product id (preferred). */
export const APPLE_12M_COMMITMENT_PRODUCT_ID =
  PREMIUM_PRODUCT_IDS.monthly_12m_commitment;

/**
 * Apple often keeps the yearly product id and adds a monthly billing plan on it.
 * After purchase, StoreKit/RevenueCat may still report the yearly product identifier.
 */
export const APPLE_12M_COMMITMENT_UNDERLYING_YEARLY_PRODUCT_ID = PREMIUM_PRODUCT_IDS.yearly;

export function parseOsVersion(
  version: string | number | undefined,
): { major: number; minor: number } | null {
  if (version == null) return null;
  const raw = String(version).trim();
  const match = /^(\d+)(?:\.(\d+))?/.exec(raw);
  if (!match) return null;
  return {
    major: Number(match[1]),
    minor: Number(match[2] ?? 0),
  };
}

export function isApple12mCommitmentOsSupported(
  osVersion: string | number | undefined = Platform.Version,
): boolean {
  const parsed = parseOsVersion(osVersion);
  if (!parsed) return false;
  if (parsed.major > APPLE_12M_COMMITMENT_MIN_OS.major) return true;
  if (parsed.major < APPLE_12M_COMMITMENT_MIN_OS.major) return false;
  return parsed.minor >= APPLE_12M_COMMITMENT_MIN_OS.minor;
}

/** Platform gate only — still require Store/RevenueCat package availability before purchase. */
export function isApple12mCommitmentPlatformEligible(
  platform: typeof Platform.OS = Platform.OS,
  osVersion: string | number | undefined = Platform.Version,
): boolean {
  return platform === 'ios' && isApple12mCommitmentOsSupported(osVersion);
}

export function isCommitmentProductIdentifier(productId: string | null | undefined): boolean {
  if (!productId) return false;
  const id = productId.toLowerCase();
  if (productId === APPLE_12M_COMMITMENT_PRODUCT_ID) return true;
  return (
    id.includes('12m_commitment') ||
    id.includes('12m-commitment') ||
    id.includes('monthly_12m') ||
    (id.includes('commitment') && id.includes('month'))
  );
}

/**
 * react-native-purchases 10.4.x does not expose StoreKit `billingPlanType(.monthly)`.
 * Until RC/SDK support lands, the commitment plan is only purchasable when a distinct
 * offering package for {@link APPLE_12M_COMMITMENT_PRODUCT_ID} is present.
 */
export const APPLE_12M_COMMITMENT_STOREKIT_BILLING_PLAN_SUPPORTED_IN_RC = false;
