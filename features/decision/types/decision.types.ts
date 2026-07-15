export type DecisionBias = 'bullish' | 'bearish' | 'neutral';
export type ImpactLevel = 'low' | 'medium' | 'high';
export type SetupStatus = 'watching' | 'forming' | 'confirmed' | 'invalidated';
export type MarketRegime =
  | 'risk_on'
  | 'risk_off'
  | 'ranging'
  | 'high_volatility'
  | 'trending';

export interface ExplainabilityFactor {
  label: string;
  agrees: boolean;
  detail: string;
}

export interface Explainability {
  confidence: number;
  factors: ExplainabilityFactor[];
  agrees: number;
  disagrees: number;
  dataAsOf: number;
  freshness: 'live' | 'recent' | 'stale' | 'unknown';
  reasoning: string;
}

export interface SetupCardData {
  id: string;
  symbol: string;
  title: string;
  bias: DecisionBias;
  status: SetupStatus;
  confidence: number;
  why: string[];
  invalidation?: string;
  risk: ImpactLevel;
  entryZone?: { low: number; high: number };
  explainability: Explainability;
  lastPrice?: number;
  changePercent?: number;
}

export interface NewsDecisionCardData {
  id: string;
  symbol?: string;
  headline: string;
  summary: string;
  impact: ImpactLevel;
  historicalNote?: string;
  explainability: Explainability;
}

export interface DecisionBrief {
  greeting: string;
  generatedAt: number;
  regime: MarketRegime;
  regimeLabel: string;
  portfolioChangePercent?: number;
  highImpactEvents: { id: string; title: string; at: number; impact: ImpactLevel }[];
  setupCount: number;
  topSetups: SetupCardData[];
  watchFocus: string[];
  headline: string;
  summary: string;
  suggestResearch: string[];
  explainability: Explainability;
  quotesFetchedAt: number;
}

export interface MtfFrameBias {
  interval: string;
  bias: DecisionBias;
  confidence: number;
}

export interface MtfConsensus {
  symbol: string;
  frames: MtfFrameBias[];
  consensus: DecisionBias;
  consensusScore: number;
  explanation: string;
  asOf: number;
}

export interface RegimeSnapshot {
  regime: MarketRegime;
  label: string;
  volatility: ImpactLevel;
  trend: DecisionBias;
  liquidity: ImpactLevel;
  bestStrategies: string[];
  avoidStrategies: string[];
  fearGreed?: number;
  asOf: number;
  explainability: Explainability;
}

export interface TraderMemory {
  favoriteAssets: string[];
  tradingStyle: string;
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  avgHoldHint: string;
  typicalMistakes: string[];
  favoriteIndicators: string[];
  bestSetups: string[];
  weakestSetups: string[];
  notes: string[];
  updatedAt: number;
}

export interface JournalCoachInsight {
  winRate: number;
  avgRr: number;
  mostCommonMistake: string;
  bestWeekday: string;
  worstCondition: string;
  bestIndicator: string;
  psychology: string;
  edge: string;
  avoid: string;
  recommendation: string;
  processScore: number;
  explainability: Explainability;
}

export interface RiskCenterSnapshot {
  riskScore: number;
  sectorExposure: { label: string; percent: number }[];
  cashPercent: number;
  betaEstimate: number;
  correlation: ImpactLevel;
  recommendation: string;
  holdingsCount: number;
  concentrationWarning?: string;
  asOf: number;
}
