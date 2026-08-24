import { BRAND, DEFAULT_LEGAL_SITE_ORIGIN } from '@/shared/constants/brand';

/**
 * Legal / support site origin.
 * Set EXPO_PUBLIC_LEGAL_SITE_ORIGIN when the official Aithera / TradeInsight
 * legal site is hosted. Until then, defaults to the legacy origin — do not claim
 * those pages are live Aithera content until hosting is verified.
 */
function legalSiteOrigin(): string {
  const configured = process.env.EXPO_PUBLIC_LEGAL_SITE_ORIGIN?.trim();
  if (configured) {
    return configured.replace(/\/$/, '');
  }
  return DEFAULT_LEGAL_SITE_ORIGIN;
}

/**
 * Official mailboxes are env-only. Do not synthesise privacy@ / support@
 * addresses from the technical URL fallback — those are not production values.
 */
function legalEmail(envKey: string): string {
  const configured = process.env[envKey]?.trim();
  if (!configured) {
    return '';
  }
  return configured.startsWith('mailto:') ? configured : `mailto:${configured}`;
}

export function isLegalMailboxConfigured(mailto: string): boolean {
  return mailto.startsWith('mailto:') && mailto.includes('@') && !mailto.includes('[');
}

const origin = legalSiteOrigin();

export const LEGAL_URLS = {
  privacy: `${origin}/privacy`,
  terms: `${origin}/terms`,
  risk: `${origin}/risk`,
  security: `${origin}/security`,
  support: `${origin}/support`,
  accountDeletion: `${origin}/account-deletion`,
  privacyEmail: legalEmail('EXPO_PUBLIC_LEGAL_PRIVACY_EMAIL'),
  securityEmail: legalEmail('EXPO_PUBLIC_LEGAL_SECURITY_EMAIL'),
  supportEmail: legalEmail('EXPO_PUBLIC_LEGAL_SUPPORT_EMAIL'),
} as const;

/** Bump when material legal terms change and re-consent is required. */
export const LEGAL_ACCEPTANCE_VERSION = '2026.08.24' as const;

export const LEGAL_COUNSEL_NOTICE =
  `These documents are compliance-oriented templates for ${BRAND.product} by ${BRAND.company}. ` +
  'Bracketed fields (legal entity name, VAT/UID, contact emails, official domain) are not production values. ' +
  'Have qualified counsel in Switzerland, the EU/EEA/UK, and relevant U.S. states review them ' +
  'before production launch. Do not treat legal URLs as live until the official site is hosted and verified.';
