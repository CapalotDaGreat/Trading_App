export const LEGAL_URLS = {
  privacy: 'https://tradevision.ai/privacy',
  terms: 'https://tradevision.ai/terms',
  risk: 'https://tradevision.ai/risk',
  security: 'https://tradevision.ai/security',
  support: 'https://tradevision.ai/support',
  accountDeletion: 'https://tradevision.ai/account-deletion',
  privacyEmail: 'mailto:privacy@tradevision.ai',
  securityEmail: 'mailto:security@tradevision.ai',
} as const;

/** Bump when material legal terms change and re-consent is required. */
export const LEGAL_ACCEPTANCE_VERSION = '2026.07.24' as const;

export const LEGAL_COUNSEL_NOTICE =
  'These documents are compliance-oriented templates for TradeVision AI. Have qualified counsel in Switzerland, the EU/EEA/UK, and relevant U.S. states review them (including your registered legal entity and address) before production launch.';
