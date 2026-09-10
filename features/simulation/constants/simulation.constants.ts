import { DEFAULT_DISPLAY_CURRENCY } from '@/shared/constants/currency';

import { FICTIONAL_UNIVERSE } from './fictional-universe';
import type { SimulationChallengeConstraints, SimulationAssetType } from '../types/simulation.types';

/** Default paper-trading starting cash in major units. Currency is separate. */
export const DEFAULT_STARTING_BALANCE = 100_000;

/** US-first launch default. Engine accepts any supported ISO currency. */
export const DEFAULT_SIMULATION_CURRENCY = DEFAULT_DISPLAY_CURRENCY;

/** @deprecated Use DEFAULT_STARTING_BALANCE — kept for existing tests. */
export const DEFAULT_STARTING_BALANCE_CHF = DEFAULT_STARTING_BALANCE;

export const SIMULATION_FEE_RATE = 0;

export const SYNTHETIC_UNIVERSE: readonly {
  symbol: string;
  name: string;
  assetType: SimulationAssetType;
  basePrice: number;
  quoteCurrency?: string;
  baseCurrency?: string;
}[] = [
  { symbol: 'SPY', name: 'S&P 500 ETF (synthetic)', assetType: 'etf', basePrice: 510, quoteCurrency: 'USD' },
  { symbol: 'AAPL', name: 'Apple (synthetic)', assetType: 'equity', basePrice: 185, quoteCurrency: 'USD' },
  { symbol: 'MSFT', name: 'Microsoft (synthetic)', assetType: 'equity', basePrice: 410, quoteCurrency: 'USD' },
  { symbol: 'NVDA', name: 'NVIDIA (synthetic)', assetType: 'equity', basePrice: 120, quoteCurrency: 'USD' },
  { symbol: 'NESN', name: 'Nestlé (synthetic, USD-quoted sample)', assetType: 'equity', basePrice: 92, quoteCurrency: 'USD' },
  { symbol: 'BTC', name: 'Bitcoin (synthetic)', assetType: 'crypto', basePrice: 64_000, quoteCurrency: 'USD' },
  {
    symbol: 'EURUSD',
    name: 'EUR/USD (synthetic)',
    assetType: 'forex',
    basePrice: 1.08,
    baseCurrency: 'EUR',
    quoteCurrency: 'USD',
  },
  {
    symbol: 'GBPUSD',
    name: 'GBP/USD (synthetic)',
    assetType: 'forex',
    basePrice: 1.27,
    baseCurrency: 'GBP',
    quoteCurrency: 'USD',
  },
  {
    symbol: 'USDJPY',
    name: 'USD/JPY (synthetic)',
    assetType: 'forex',
    basePrice: 150,
    baseCurrency: 'USD',
    quoteCurrency: 'JPY',
  },
  {
    symbol: 'AUDUSD',
    name: 'AUD/USD (synthetic)',
    assetType: 'forex',
    basePrice: 0.66,
    baseCurrency: 'AUD',
    quoteCurrency: 'USD',
  },
  {
    symbol: 'EURGBP',
    name: 'EUR/GBP (synthetic)',
    assetType: 'forex',
    basePrice: 0.85,
    baseCurrency: 'EUR',
    quoteCurrency: 'GBP',
  },
];

export const BEGINNER_CHALLENGE: SimulationChallengeConstraints = {
  id: 'beginner-diversify',
  title: 'Build a diversified starter book',
  description:
    'Practice allocation with simulated capital. A profitable fill is not automatically a good decision.',
  maxSingleAssetExposure: 0.4,
};

export const RISK_CHALLENGE: SimulationChallengeConstraints = {
  id: 'one-percent-risk',
  title: 'Risk challenge',
  description: 'Risk no more than 1% of equity between entry and stop. Measures sizing, not return.',
  maxRiskPercentPerDecision: 0.01,
};

export const DIVERSIFY_CHALLENGE: SimulationChallengeConstraints = {
  id: 'max-concentration',
  title: 'Diversification challenge',
  description: 'No single simulated asset may exceed 20% of equity.',
  maxSingleAssetExposure: 0.2,
};

export const DRAWDOWN_CHALLENGE: SimulationChallengeConstraints = {
  id: 'survive-drawdown',
  title: 'Drawdown challenge',
  description: 'Keep maximum drawdown below 5% of peak equity. Process still grades the decision.',
  maxDrawdownMagnitude: 0.05,
};

export const DISCIPLINE_CHALLENGE: SimulationChallengeConstraints = {
  id: 'decision-discipline',
  title: 'Decision discipline',
  description: 'Every simulated buy must include a recorded thesis before the fill.',
  requireThesis: true,
};

export const CHALLENGES: readonly SimulationChallengeConstraints[] = [
  BEGINNER_CHALLENGE,
  RISK_CHALLENGE,
  DIVERSIFY_CHALLENGE,
  DRAWDOWN_CHALLENGE,
  DISCIPLINE_CHALLENGE,
];

/** Process challenges shown in the paper-trading picker (not beginner mode). */
export const SELECTABLE_CHALLENGES: readonly SimulationChallengeConstraints[] = [
  RISK_CHALLENGE,
  DIVERSIFY_CHALLENGE,
  DRAWDOWN_CHALLENGE,
  DISCIPLINE_CHALLENGE,
];

export function challengeById(id: string | undefined): SimulationChallengeConstraints | undefined {
  if (!id) return undefined;
  return CHALLENGES.find((item) => item.id === id);
}

export function isListedSimulationSymbol(symbol: string): boolean {
  const upper = symbol.trim().toUpperCase();
  return (
    SYNTHETIC_UNIVERSE.some((item) => item.symbol === upper) ||
    FICTIONAL_UNIVERSE.some((item) => item.symbol === upper)
  );
}

export function listedSimulationInstrument(symbol: string):
  | { symbol: string; name: string; assetType: SimulationAssetType; basePrice: number }
  | undefined {
  const upper = symbol.trim().toUpperCase();
  return (
    SYNTHETIC_UNIVERSE.find((item) => item.symbol === upper) ??
    FICTIONAL_UNIVERSE.find((item) => item.symbol === upper)
  );
}

export const SIMULATION_EDUCATION_LINKS = [
  {
    id: 'sizing',
    label: 'Learn position sizing',
    href: '/academy/lesson/risk-position-sizing',
  },
  {
    id: 'drawdown',
    label: 'Learn drawdown',
    href: '/academy/lesson/risk-expectancy',
  },
  {
    id: 'diversification',
    label: 'Learn diversification',
    href: '/academy/lesson/dec-portfolio-risk',
  },
  {
    id: 'fx',
    label: 'Learn currency pairs',
    href: '/academy/lesson/foundations-fx',
  },
] as const;
