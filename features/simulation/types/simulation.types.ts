import type { SimulationScenario } from './scenario.types';

/** ISO 4217. Default product currency is USD — do not assume it in the engine. */
export type IsoCurrencyCode = string;

export type SimulationMode = 'beginner' | 'standard' | 'challenge';

export type SimulationStatus = 'active' | 'archived' | 'challenge_failed';

export type SimulationSide = 'buy' | 'sell';

export type SimulationAssetType = 'equity' | 'etf' | 'crypto' | 'forex';

/** Market fills today. Limit / stop / take-profit are reserved for later. */
export type SimulationOrderType = 'market' | 'limit' | 'stop' | 'take_profit';

export type SimulationOrderStatus = 'filled' | 'rejected' | 'pending' | 'cancelled';

export type SimulationErrorCode =
  | 'insufficient_cash'
  | 'insufficient_quantity'
  | 'invalid_quantity'
  | 'invalid_price'
  | 'invalid_stop'
  | 'invalid_symbol'
  | 'invalid_account'
  | 'challenge_violation'
  | 'account_inactive';

export type SimulationResult<T> =
  | { ok: true; value: T }
  | { ok: false; code: SimulationErrorCode; message: string };

export interface SimulationPosition {
  symbol: string;
  assetType: SimulationAssetType;
  quantity: number;
  averageEntryPrice: number;
  currentPrice: number;
  marketValue: number;
  unrealizedPnL: number;
  realizedPnL: number;
  portfolioWeight: number;
}

export interface SimulationTransaction {
  id: string;
  accountId: string;
  timestamp: string;
  symbol: string;
  assetType: SimulationAssetType;
  side: SimulationSide;
  quantity: number;
  executionPrice: number;
  grossValue: number;
  fees: number;
  netValue: number;
  resultingCashBalance: number;
  resultingPositionQuantity: number;
  decisionId?: string;
  journalEntryId?: string;
  orderId?: string;
  reason?: string;
}

export interface SimulationOrder {
  id: string;
  accountId: string;
  type: SimulationOrderType;
  side: SimulationSide;
  symbol: string;
  assetType: SimulationAssetType;
  quantity: number;
  status: SimulationOrderStatus;
  createdAt: string;
  filledAt?: string;
  filledTransactionId?: string;
  limitPrice?: number;
  stopPrice?: number;
  rejectReason?: string;
}

export interface SimulationDecision {
  id: string;
  accountId: string;
  symbol: string;
  thesis: string;
  setup?: string;
  evidence?: string;
  confidence?: 'low' | 'medium' | 'high';
  invalidation?: string;
  expectedRisk?: string;
  intendedPositionSize?: string;
  reasonForEntry?: string;
  createdAt: string;
  closedAt?: string;
  closeReview?: SimulationCloseReview;
}

export interface SimulationCloseReview {
  whatHappened?: string;
  behavedAsExpected?: string;
  thesisCorrect?: string;
  riskAppropriate?: string;
  wouldChange?: string;
}

export interface SimulationChallengeConstraints {
  id: string;
  title: string;
  description: string;
  /** Fraction of equity, e.g. 0.01 = 1% */
  maxRiskPercentPerDecision?: number;
  /** Fraction of equity in a single symbol */
  maxSingleAssetExposure?: number;
  /** Peak-to-trough magnitude that fails the challenge, e.g. 0.05 = 5% */
  maxDrawdownMagnitude?: number;
  requireThesis?: boolean;
}

export interface SimulationAccount {
  id: string;
  /** Alias of `id` — kept for persist/Firestore path compatibility. */
  accountId: string;
  userId: string;
  currency: IsoCurrencyCode;
  mode: SimulationMode;
  startingBalance: number;
  cashBalance: number;
  investedAmount: number;
  equity: number;
  buyingPower: number;
  positions: SimulationPosition[];
  transactions: SimulationTransaction[];
  orders: SimulationOrder[];
  decisions: SimulationDecision[];
  realizedPnL: number;
  unrealizedPnL: number;
  totalReturn: number;
  peakEquity: number;
  /** (equity − peak) / peak. Zero or negative. */
  currentDrawdown: number;
  /** Most negative currentDrawdown observed. */
  maxDrawdown: number;
  /** Positive magnitude of currentDrawdown — for calm UI copy. */
  drawdown: number;
  createdAt: string;
  updatedAt: string;
  resetAt?: string;
  status: SimulationStatus;
  challengeId?: string;
  lastChallengeViolation?: string;
  /** Unique generated market. Seed is stored for audit, never shown. */
  scenario?: SimulationScenario;
}

export interface SimulationTradeInput {
  symbol: string;
  quantity: number;
  price: number;
  fees?: number;
  reason?: string;
  thesis?: string;
  setup?: string;
  evidence?: string;
  confidence?: SimulationDecision['confidence'];
  invalidation?: string;
  expectedRisk?: string;
  intendedPositionSize?: string;
  stopPrice?: number;
  targetPrice?: number;
  assetType?: SimulationAssetType;
  decisionId?: string;
  journalEntryId?: string;
  now?: string;
}

export interface SimulationTradePreview {
  side: SimulationSide;
  symbol: string;
  assetType: SimulationAssetType;
  quantity: number;
  executionPrice: number;
  estimatedPositionValue: number;
  fees: number;
  cashBefore: number;
  cashAfter: number;
  portfolioWeightAfter: number;
  estimatedRealizedPnL?: number;
  remainingQuantity?: number;
  riskPercent?: number;
  simulationWarning: string;
}

export interface SimulationQuote {
  symbol: string;
  price: number;
  currency: IsoCurrencyCode;
  asOf: string;
  kind: 'sample';
  provider: 'synthetic' | 'licensed-historical';
  label: 'SIMULATED';
  baseCurrency?: string;
  quoteCurrency?: string;
}

export interface SimulationPriceProvider {
  getQuote(symbol: string, nowMs?: number): SimulationQuote | null;
  getQuotes(symbols: string[], nowMs?: number): SimulationQuote[];
}

export interface SimulationResetSnapshot {
  startingBalance: number;
  equity: number;
  totalReturn: number;
  tradeCount: number;
  maxDrawdown: number;
  currency: IsoCurrencyCode;
}
