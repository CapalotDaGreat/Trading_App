/**
 * TradeAcademy by Aithera — user-facing product identity.
 *
 * Technical identifiers live in FROZEN_TECHNICAL_IDS. See
 * docs/IDENTITY_MIGRATION_PHASE0.md. Do not mix in retired product names.
 */

export const BRAND = {
  /** Registered legal entity / controller */
  legalEntity: 'CML Electronics',
  /** Company / trading brand */
  company: 'Aithera',
  /** App / product name shown to users */
  product: 'TradeAcademy',
  /** Attribution line where company credit is useful */
  attribution: 'TradeAcademy by Aithera',
  /** Operator line for legal footers */
  operatorLine: 'CML Electronics, trading as Aithera',
  /** Store / marketing positioning */
  positioning: 'Learn the concepts. Read the chart. Practice the decision. Manage simulated money. Review your reasoning. Improve your process.',
  /** Short loop label for headers and empty states */
  loop: 'Learn → Practice → Replay → Simulate → Journal → Review → Improve',
  /** Always-on simulated-trading label */
  simulatedLabel: 'SIMULATED',
  paperTradingLabel: 'PAPER TRADING',
  educationalSimulationLabel: 'Educational Simulation',
  paperSimulationLabel: 'Paper Simulation',
} as const;

/**
 * Store / persistence identifiers for TradeAcademy.
 * Changing these requires a new store listing, persist migration, and App Links.
 */
export const FROZEN_TECHNICAL_IDS = {
  /** iOS bundleIdentifier + Android applicationId */
  bundleIdentifier: 'ai.tradeacademy.app',
  /** Expo / deep-link URL scheme */
  urlScheme: 'tradeacademy',
  /** Expo project slug (EAS continuity) */
  expoSlug: 'tradeacademy',
  /** npm package name (private) */
  npmPackageName: 'tradeacademy-ai',
  /**
   * AsyncStorage / Zustand persist key prefix — do not rename without a key-migration helper.
   * Full list lives in shared/services/user-data/clear-all-user-local-state.ts
   */
  persistKeyPrefix: 'tradeacademy-',
  /** RevenueCat entitlement (already Aithera-branded) */
  revenueCatEntitlement: 'Aithera Pro',
} as const;

/** Official legal and marketing site origin: https://tradeacademy.cloud */
export const DEFAULT_LEGAL_SITE_ORIGIN = 'https://tradeacademy.cloud';
