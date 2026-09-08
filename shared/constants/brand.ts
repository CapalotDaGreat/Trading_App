/**
 * TradeAcademy by Aithera — user-facing product identity.
 *
 * Phase 0 freezes technical identifiers that would break installs, deep links,
 * or local persistence if renamed casually. See docs/IDENTITY_MIGRATION_PHASE0.md.
 * Public brand may change without migrating those IDs.
 */

export const BRAND = {
  /** Company / legal operator brand */
  company: 'Aithera',
  /** App / product name shown to users */
  product: 'TradeAcademy',
  /** Attribution line where company credit is useful */
  attribution: 'TradeAcademy by Aithera',
  /** Store / marketing positioning */
  positioning: 'Learn the concepts. Read the chart. Practice the decision. Manage simulated money. Review your reasoning. Improve your process.',
  /** Short loop label for headers and empty states */
  loop: 'Learn → Practice → Simulate → Review → Improve',
  /** Always-on simulated-trading label */
  simulatedLabel: 'SIMULATED',
  paperTradingLabel: 'PAPER TRADING',
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
