import { BRAND, DEFAULT_LEGAL_SITE_ORIGIN } from '@/shared/constants/brand';

/**
 * Legal / support site origin.
 * Official host: https://tradeacademy.cloud
 * Override with EXPO_PUBLIC_LEGAL_SITE_ORIGIN only if the legal site moves.
 */
function legalSiteOrigin(): string {
  const configured = process.env.EXPO_PUBLIC_LEGAL_SITE_ORIGIN?.trim();
  if (configured) {
    return configured.replace(/\/$/, '');
  }
  return DEFAULT_LEGAL_SITE_ORIGIN;
}

const DEFAULT_LEGAL_MAILBOXES = {
  EXPO_PUBLIC_LEGAL_PRIVACY_EMAIL: 'privacy@tradeacademy.cloud',
  EXPO_PUBLIC_LEGAL_SECURITY_EMAIL: 'security@tradeacademy.cloud',
  EXPO_PUBLIC_LEGAL_SUPPORT_EMAIL: 'support@tradeacademy.cloud',
} as const;

/**
 * Official mailboxes for CML Electronics / TradeAcademy.
 * Env overrides win; otherwise defaults to @tradeacademy.cloud addresses.
 */
function legalEmail(envKey: keyof typeof DEFAULT_LEGAL_MAILBOXES): string {
  const configured = process.env[envKey]?.trim() || DEFAULT_LEGAL_MAILBOXES[envKey];
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
export const LEGAL_ACCEPTANCE_VERSION = '2026.09.15' as const;

export const LEGAL_COUNSEL_NOTICE =
  `${BRAND.product} by ${BRAND.company} is operated by ${BRAND.legalEntity}. ` +
  'These documents describe shipped product behaviour for Swiss nFADP, EU/UK GDPR, and relevant U.S. state privacy laws. ' +
  'Have qualified counsel review jurisdiction-specific adaptations before relying on them as legal advice. ' +
  `Official site: ${DEFAULT_LEGAL_SITE_ORIGIN}.`;
