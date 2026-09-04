import { DEFAULT_LEGAL_SITE_ORIGIN, FROZEN_TECHNICAL_IDS } from '@/shared/constants/brand';

import { type LegalRouteId } from '@/shared/legal/routes';

const SCHEME = FROZEN_TECHNICAL_IDS.urlScheme;

const SLUG_ALIASES: Record<string, LegalRouteId> = {
  terms: 'terms',
  tos: 'terms',
  'terms-of-service': 'terms',
  terms_of_service: 'terms',
  privacy: 'privacy',
  'privacy-policy': 'privacy',
  privacy_policy: 'privacy',
  risk: 'risk',
  'risk-disclaimer': 'risk',
  support: 'support',
  security: 'security',
  accountdeletion: 'accountDeletion',
  'account-deletion': 'accountDeletion',
  account_deletion: 'accountDeletion',
};

function legalRouteFromSlug(raw: string | undefined): LegalRouteId | null {
  if (!raw) return null;
  const key = raw.trim().replace(/^\//, '').toLowerCase();
  return SLUG_ALIASES[key] ?? null;
}

function hostsMatchLegalSite(hostname: string): boolean {
  const host = hostname.replace(/^www\./, '').toLowerCase();
  try {
    const originHost = new URL(DEFAULT_LEGAL_SITE_ORIGIN).hostname.replace(/^www\./, '').toLowerCase();
    if (host === originHost) return true;
  } catch {
    // Ignore malformed fallback origin.
  }
  return host === 'tradevision.ai';
}

/**
 * Custom-scheme URLs for RevenueCat Paywall / Customer Center buttons.
 * These open the in-app legal reader instead of Safari.
 */
export const IN_APP_LEGAL_URLS: Record<LegalRouteId, string> = {
  terms: `${SCHEME}://legal/terms`,
  privacy: `${SCHEME}://legal/privacy`,
  risk: `${SCHEME}://legal/risk`,
  support: `${SCHEME}://legal/support`,
  security: `${SCHEME}://legal/security`,
  accountDeletion: `${SCHEME}://legal/accountDeletion`,
};

export function inAppLegalUrl(id: LegalRouteId): string {
  return IN_APP_LEGAL_URLS[id];
}

/**
 * Map an incoming deep link (custom scheme or hosted HTTPS path) to `/legal/:doc`.
 * Handles `tradevision://legal/terms`, `tradevision:///legal/terms`, and
 * `https://tradevision.ai/privacy` (plus privacy_policy aliases used by RevenueCat).
 */
export function parseInAppLegalPath(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('/legal/')) {
    const slug = legalRouteFromSlug(trimmed.slice('/legal/'.length).split(/[/?#]/)[0]);
    return slug ? `/legal/${slug}` : null;
  }

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    try {
      url = new URL(trimmed, `${SCHEME}://app`);
    } catch {
      return null;
    }
  }

  const protocol = url.protocol.replace(':', '').toLowerCase();
  const host = url.hostname.toLowerCase();
  const pathParts = url.pathname.split('/').filter(Boolean);
  const first = pathParts[0];
  const second = pathParts[1];

  if (protocol === SCHEME) {
    if (host === 'legal') {
      const slug = legalRouteFromSlug(first);
      return slug ? `/legal/${slug}` : null;
    }
    if (!host && first === 'legal') {
      const slug = legalRouteFromSlug(second);
      return slug ? `/legal/${slug}` : null;
    }
    if (first === 'legal') {
      const slug = legalRouteFromSlug(second);
      return slug ? `/legal/${slug}` : null;
    }
  }

  if ((protocol === 'https' || protocol === 'http') && hostsMatchLegalSite(host)) {
    const slug = legalRouteFromSlug(first);
    return slug ? `/legal/${slug}` : null;
  }

  return null;
}

/** Used by Expo Router `+native-intent` to rewrite third-party / paywall URLs. */
export function rewriteIncomingLegalPath(path: string): string | null {
  return parseInAppLegalPath(path);
}
