import type { InstrumentProvider } from '@/features/markets/types/instrument.types';
import type { AssetClass, MarketType } from '@/shared/types/market';

export type HoldingSide = 'long' | 'short';

export interface Holding {
  id: string;
  symbol: string;
  name: string;
  marketType: MarketType;
  assetClass: AssetClass;
  quantity: number;
  averageCost: number;
  currentPrice: number;
  currency: string;
  side: HoldingSide;
  notes?: string;
  /** Canonical instrument identity — required on new creates. */
  instrumentId?: string;
  canonicalSymbol?: string;
  provider?: InstrumentProvider;
  providerSymbol?: string;
  exchange?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HoldingDocument {
  symbol: string;
  name: string;
  marketType: MarketType;
  assetClass: AssetClass;
  quantity: number;
  averageCost: number;
  currentPrice: number;
  currency: string;
  side: HoldingSide;
  notes?: string;
  instrumentId: string;
  canonicalSymbol: string;
  provider: InstrumentProvider;
  providerSymbol: string;
  exchange?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateHoldingInput {
  /** Resolved instrument id — never raw user search text. */
  instrumentId: string;
  symbol: string;
  canonicalSymbol: string;
  name: string;
  marketType: MarketType;
  assetClass: AssetClass;
  quantity: number;
  averageCost: number;
  currentPrice: number;
  currency?: string;
  side?: HoldingSide;
  notes?: string;
  provider: InstrumentProvider;
  providerSymbol: string;
  exchange?: string;
}

export interface UpdateHoldingInput {
  quantity?: number;
  averageCost?: number;
  currentPrice?: number;
  notes?: string;
}

export class DuplicateHoldingError extends Error {
  readonly holding: Holding;

  constructor(holding: Holding) {
    super('You already have this asset in your portfolio.');
    this.name = 'DuplicateHoldingError';
    this.holding = holding;
  }
}

export interface HoldingPnL {
  holdingId: string;
  symbol: string;
  marketValue: number;
  costBasis: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  dayChange: number;
  dayChangePercent: number;
}

export interface PortfolioSummary {
  totalValue: number;
  totalCost: number;
  totalPnL: number;
  totalPnLPercent: number;
  dayChange: number;
  dayChangePercent: number;
  holdingsCount: number;
  currency: string;
}

export interface PerformancePoint {
  date: string;
  value: number;
  pnl: number;
  pnlPercent: number;
}

export interface PortfolioPerformance {
  points: PerformancePoint[];
  period: '1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL';
}

export interface PositionSizingInput {
  accountBalance: number;
  riskPercent: number;
  entryPrice: number;
  stopLossPrice: number;
}

export interface PositionSizingResult {
  riskAmount: number;
  riskPerShare: number;
  positionSize: number;
  positionValue: number;
  maxLoss: number;
}

export interface RiskRewardInput {
  entryPrice: number;
  stopLossPrice: number;
  takeProfitPrice: number;
  positionSize: number;
}

export interface RiskRewardResult {
  riskAmount: number;
  rewardAmount: number;
  riskRewardRatio: number;
  breakEvenPrice: number;
}
