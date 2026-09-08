/**
 * Product default: labelled synthetic/sample data.
 * Vendor adapters remain for licensed later use — opt in with EXPO_PUBLIC_MARKET_DATA_MODE=vendor.
 */
export type MarketDataRuntimeMode = 'synthetic' | 'vendor';

export function getMarketDataRuntimeMode(): MarketDataRuntimeMode {
  return process.env.EXPO_PUBLIC_MARKET_DATA_MODE === 'vendor' ? 'vendor' : 'synthetic';
}

export const SYNTHETIC_MARKET_DISCLOSURE =
  'Prices and charts in this build are simulated or sample data unless a licensed vendor mode is enabled. They are not live brokerage quotes.';
