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

export interface ExplainabilityCounterfactual {
  label: string;
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
  counterfactuals?: ExplainabilityCounterfactual[];
}

export interface ResearchChecklistItem {
  id: string;
  label: string;
  done: boolean;
}

export interface WhyNotInsight {
  symbol: string;
  reasons: string[];
  savedMinutes: number;
  summary: string;
}

export interface SetupCardData {
  id: string;
  symbol: string;
  title: string;
  bias: DecisionBias;
  status: SetupStatus;
  /**
   * Legacy field — same value as decisionQualityScore for backwards compatibility.
   * Represents process/structure fit, NOT a price prediction.
   */
  confidence: number;
  /** Research Value Score (0–100): how worth spending research time is. */
  researchValueScore?: number;
  /** Decision Quality Score (0–100): process checklist quality, not direction. */
  decisionQualityScore?: number;
  researchValueExplanation?: string;
  decisionQualityExplanation?: string;
  why: string[];
  invalidation?: string;
  risk: ImpactLevel;
  entryZone?: { low: number; high: number };
  explainability: Explainability;
  lastPrice?: number;
  changePercent?: number;
  setupTypeLabel?: string;
  researchChecklist?: ResearchChecklistItem[];
  historyNote?: string;
  whyNot?: WhyNotInsight;
  reasonsToResearch?: string[];
  reasonsNotToResearch?: string[];
  missingConfirmations?: string[];
  alternativeSymbols?: string[];
  convictionDrift?: ConvictionDriftSnapshot;
}

export interface FocusSummary {
  opportunities: number;
  risks: number;
  events: number;
}

export interface ResearchQueueItem {
  symbol: string;
  estimatedMinutes: number;
  completed: boolean;
  rankReason?: string;
  learningValue?: string;
  priority?: 'high' | 'medium' | 'low';
  portfolioRelevance?: string;
  researchValueScore?: number;
}

export interface TradingDayPlanItem {
  id: string;
  label: string;
  phase: 'before' | 'during' | 'after';
  done: boolean;
}

export interface TradingDayPlan {
  items: TradingDayPlanItem[];
  estimatedMinutes: number;
}

export interface DecisionFatigueInsight {
  shouldStop: boolean;
  reviewedToday: number;
  softCap: number;
  message: string;
}

export interface DecisionDebtSnapshot {
  score: number;
  unreviewedSetups: number;
  incompleteJournals: number;
  unfinishedReplay: number;
  unfinishedLessons: number;
  ignoredAlerts: number;
  items: { id: string; label: string; severity: ImpactLevel }[];
  encouragement: string;
}

export interface ConvictionDriftPoint {
  at: number;
  researchValue: number;
  decisionQuality: number;
  risk: ImpactLevel;
  note: string;
}

export interface ConvictionDriftSnapshot {
  symbol: string;
  points: ConvictionDriftPoint[];
  trend: 'improving' | 'stable' | 'deteriorating';
  latestChange?: string;
}

export interface PortfolioHealthSnapshot {
  healthScore: number;
  diversification: ImpactLevel;
  sectorExposure: { label: string; percent: number }[];
  cashPercent: number;
  betaEstimate: number;
  correlation: ImpactLevel;
  concentrationWarning?: string;
  stressTest: string;
  recommendations: string[];
  holdingsCount: number;
  asOf: number;
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
  startHereSymbol?: string;
  processScoreWeek?: number;
  calendarSource?: 'finnhub' | 'mock' | 'rss';
  timeBudgetPick?: string[];
  focusSummary?: FocusSummary;
  estimatedResearchMinutes?: number;
  researchQueue?: ResearchQueueItem[];
  tradingDayPlan?: TradingDayPlan;
  skipSuggestions?: WhyNotInsight[];
  decisionDebt?: DecisionDebtSnapshot;
  fatigue?: DecisionFatigueInsight;
  psychologyReminder?: string;
  recommendedFocus?: string;
  decisionQualityTrend?: number;
  timeBudgetMinutes?: number;
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

export interface TradingDna {
  styleLabel: string;
  strengths: string[];
  weaknesses: string[];
  bestConditions: string[];
  avoidConditions: string[];
  bestSetups?: string[];
  worstSetups?: string[];
  preferredRegimes?: string[];
  avgHoldHint?: string;
  riskTolerance?: string;
  psychologyPatterns?: string[];
  commonMistakes?: string[];
  bestWeekdays?: string[];
  preferredIndicators?: string[];
  mostProfitableCategories?: string[];
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
  dna?: TradingDna;
}

export interface WeeklyReviewInsight {
  decisionsMade: number;
  bestDecision: string;
  biggestMistake: string;
  aiLesson: string;
  researched: number;
  skipped: number;
  marketsStudied?: string[];
  researchHoursEstimate?: number;
  decisionQualityTrend?: number;
  journalConsistency?: string;
  mostImprovedSkill?: string;
  recommendedFocus?: string;
  celebrateDiscipline?: string;
  isSundayReview?: boolean;
}

export interface DisciplineStreak {
  days: number;
  completedToday: { morningBrief: boolean; researchPlan: boolean; journal: boolean };
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
  /** Extended portfolio health fields (Premium intelligence). */
  health?: PortfolioHealthSnapshot;
}

/** Unified context for AI + brief — never generate isolated commentary without this. */
export interface DecisionIntelligenceContext {
  assembledAt: number;
  regime?: MarketRegime;
  regimeLabel?: string;
  timeBudgetMinutes: number;
  watchlistSymbols: string[];
  portfolioSymbols: string[];
  traderMemory?: TraderMemory;
  processScoreWeek?: number;
  eventTitles: string[];
  topSetupSymbols: string[];
  psychologyReminder: string;
  recommendedFocus: string;
}
