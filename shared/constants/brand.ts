/**
 * TradeInsight by Aithera — user-facing product identity.
 *
 * Phase 0 freezes technical identifiers that would break installs, deep links,
 * or local persistence if renamed casually. See docs/IDENTITY_MIGRATION_PHASE0.md.
 */

export const BRAND = {
  /** Company / legal operator brand */
  company: 'Aithera',
  /** App / product name shown to users */
  product: 'TradeInsight',
  /** Attribution line where company credit is useful */
  attribution: 'TradeInsight by Aithera',
  /** Store / marketing positioning — not a slogan invention beyond the launch brief */
  positioning: 'Research smarter. Decide with clarity. Improve your process.',
} as const;

/**
 * Technical IDs intentionally frozen in Phase 0.
 * Changing these requires a dedicated migration project (new store listing, data migration, App Links).
 */
export const FROZEN_TECHNICAL_IDS = {
  /** iOS bundleIdentifier + Android applicationId */
  bundleIdentifier: 'ai.tradevision.app',
  /** Expo / deep-link URL scheme */
  urlScheme: 'tradevision',
  /** Expo project slug (EAS continuity) */
  expoSlug: 'traders',
  /** npm package name (private) */
  npmPackageName: 'tradevision-ai',
  /**
   * AsyncStorage / Zustand persist key prefix — do not rename without a key-migration helper.
   * Full list lives in shared/services/user-data/clear-all-user-local-state.ts
   */
  persistKeyPrefix: 'tradevision-',
  /** RevenueCat entitlement (already Aithera-branded) */
  revenueCatEntitlement: 'Aithera Pro',
} as const;

/** Fallback legal/marketing site until the official Aithera domain is hosted and verified. */
export const DEFAULT_LEGAL_SITE_ORIGIN = 'https://tradevision.ai';
