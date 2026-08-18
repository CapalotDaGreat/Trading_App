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

function legalEmail(localPart: string, envKey: string): string {
  const configured = process.env[envKey]?.trim();
  if (configured) {
    return configured.startsWith('mailto:') ? configured : `mailto:${configured}`;
  }
  try {
    const host = new URL(legalSiteOrigin()).hostname;
    return `mailto:${localPart}@${host}`;
  } catch {
    return `mailto:${localPart}@tradevision.ai`;
  }
}

const origin = legalSiteOrigin();

export const LEGAL_URLS = {
  privacy: `${origin}/privacy`,
  terms: `${origin}/terms`,
  risk: `${origin}/risk`,
  security: `${origin}/security`,
  support: `${origin}/support`,
  accountDeletion: `${origin}/account-deletion`,
  privacyEmail: legalEmail('privacy', 'EXPO_PUBLIC_LEGAL_PRIVACY_EMAIL'),
  securityEmail: legalEmail('security', 'EXPO_PUBLIC_LEGAL_SECURITY_EMAIL'),
} as const;

/** Bump when material legal terms change and re-consent is required. */
export const LEGAL_ACCEPTANCE_VERSION = '2026.07.24' as const;

export const LEGAL_COUNSEL_NOTICE =
  `These documents are compliance-oriented templates for ${BRAND.product} by ${BRAND.company}. ` +
  'Have qualified counsel in Switzerland, the EU/EEA/UK, and relevant U.S. states review them ' +
  '(including your registered legal entity and address) before production launch. ' +
  'Do not treat legal URLs as live until the official site is hosted and verified.';
