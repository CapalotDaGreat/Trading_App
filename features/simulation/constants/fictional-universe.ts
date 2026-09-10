import type { SimulationAssetType } from '../types/simulation.types';

export interface FictionalInstrument {
  symbol: string;
  name: string;
  assetType: SimulationAssetType;
  sector: string;
  basePrice: number;
  typicalBeta: number;
  liquidity: number;
  quoteCurrency?: string;
}

/**
 * Fictional names so users cannot memorize a real ticker’s history.
 * Behavior is inspired by real market tendencies, not a replay of them.
 */
export const FICTIONAL_UNIVERSE: readonly FictionalInstrument[] = [
  {
    symbol: 'BRIX',
    name: 'Broadfield Index (synthetic)',
    assetType: 'etf',
    sector: 'index',
    basePrice: 412,
    typicalBeta: 1,
    liquidity: 0.95,
    quoteCurrency: 'USD',
  },
  {
    symbol: 'NSTR',
    name: 'Northstar Robotics (synthetic)',
    assetType: 'equity',
    sector: 'technology',
    basePrice: 86,
    typicalBeta: 1.35,
    liquidity: 0.72,
    quoteCurrency: 'USD',
  },
  {
    symbol: 'ORSC',
    name: 'Orion Semiconductors (synthetic)',
    assetType: 'equity',
    sector: 'technology',
    basePrice: 54,
    typicalBeta: 1.45,
    liquidity: 0.64,
    quoteCurrency: 'USD',
  },
  {
    symbol: 'HARB',
    name: 'Harborline Logistics (synthetic)',
    assetType: 'equity',
    sector: 'industrials',
    basePrice: 41,
    typicalBeta: 1.05,
    liquidity: 0.7,
    quoteCurrency: 'USD',
  },
  {
    symbol: 'WLDF',
    name: 'Westlake Defense (synthetic)',
    assetType: 'equity',
    sector: 'industrials',
    basePrice: 118,
    typicalBeta: 0.85,
    liquidity: 0.6,
    quoteCurrency: 'USD',
  },
  {
    symbol: 'CDPN',
    name: 'Cedar & Pine Retail (synthetic)',
    assetType: 'equity',
    sector: 'consumer',
    basePrice: 33,
    typicalBeta: 1.15,
    liquidity: 0.68,
    quoteCurrency: 'USD',
  },
  {
    symbol: 'SBF',
    name: 'Silverbrook Foods (synthetic)',
    assetType: 'equity',
    sector: 'staples',
    basePrice: 62,
    typicalBeta: 0.55,
    liquidity: 0.8,
    quoteCurrency: 'USD',
  },
  {
    symbol: 'RNRK',
    name: 'Redrock Energy (synthetic)',
    assetType: 'equity',
    sector: 'energy',
    basePrice: 47,
    typicalBeta: 1.2,
    liquidity: 0.66,
    quoteCurrency: 'USD',
  },
  {
    symbol: 'VLMD',
    name: 'Vale Medical (synthetic)',
    assetType: 'equity',
    sector: 'healthcare',
    basePrice: 79,
    typicalBeta: 0.8,
    liquidity: 0.62,
    quoteCurrency: 'USD',
  },
  {
    symbol: 'MRDC',
    name: 'Meridian Credit (synthetic)',
    assetType: 'equity',
    sector: 'financials',
    basePrice: 28,
    typicalBeta: 1.1,
    liquidity: 0.74,
    quoteCurrency: 'USD',
  },
  {
    symbol: 'ATMT',
    name: 'Atlas Materials (synthetic)',
    assetType: 'equity',
    sector: 'materials',
    basePrice: 22,
    typicalBeta: 1.15,
    liquidity: 0.58,
    quoteCurrency: 'USD',
  },
  {
    symbol: 'LMGD',
    name: 'LumenGrid Utilities (synthetic)',
    assetType: 'equity',
    sector: 'utilities',
    basePrice: 51,
    typicalBeta: 0.45,
    liquidity: 0.78,
    quoteCurrency: 'USD',
  },
  {
    symbol: 'DHRT',
    name: 'Digital Harbor Token (synthetic)',
    assetType: 'crypto',
    sector: 'crypto',
    basePrice: 38,
    typicalBeta: 1.8,
    liquidity: 0.4,
    quoteCurrency: 'USD',
  },
];

export const FICTIONAL_SECTORS = [
  'technology',
  'industrials',
  'consumer',
  'staples',
  'energy',
  'healthcare',
  'financials',
  'materials',
  'utilities',
  'index',
  'crypto',
] as const;

export function fictionalBySymbol(symbol: string): FictionalInstrument | undefined {
  return FICTIONAL_UNIVERSE.find((item) => item.symbol === symbol.trim().toUpperCase());
}
