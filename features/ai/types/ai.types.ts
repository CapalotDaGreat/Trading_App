import type { AiTrustPayload } from './ai-trust.types';

export type AiDataSource = 'cloud' | 'engine';

export interface AiCitation {
  label: string;
  value: string;
  timestamp?: number;
}

export interface AiAnalysisMetadata {
  source: AiDataSource;
  /** Output/evidence quality, never predictive probability. */
  confidence: number;
  dataAsOf: number;
  citations: AiCitation[];
  symbol?: string;
  modelVersion?: string;
  /** Phase 2 trust payload — breakdown, evidence, counterfactuals, why-changed. */
  trust?: AiTrustPayload;
}

export type AiSentiment = 'bullish' | 'bearish' | 'neutral';

export type AiAnalysisType =
  | 'daily_summary'
  | 'trade_suggestion'
  | 'risk_analysis'
  | 'pattern_explanation'
  | 'indicator_explanation'
  | 'market_recap'
  | 'psychology_coach'
  | 'portfolio_review'
  | 'news_summary';

export type AiChatRole = 'user' | 'assistant' | 'system';

export interface AiMessage {
  id: string;
  role: AiChatRole;
  content: string;
  timestamp: number;
  metadata?: {
    symbol?: string;
    analysisType?: AiAnalysisType;
    source?: AiDataSource;
    confidence?: number;
    citations?: AiCitation[];
    trust?: AiTrustPayload;
  };
}

export interface AiChatSession {
  id: string;
  messages: AiMessage[];
  createdAt: number;
  updatedAt: number;
}

export interface TradeSuggestion {
  symbol: string;
  /** Research-priority outcome; never an execution instruction. */
  action: 'research' | 'watch' | 'skip';
  /** Evidence completeness/quality, not probability of price direction. */
  confidence: number;
  reasoning: string;
  why: string[];
  /** Price band worth observing — not an order entry instruction. */
  observationZone?: { low: number; high: number };
  /** Level that would invalidate the research thesis. */
  invalidationLevel?: number;
  /** Next structural level to investigate — not a profit target. */
  nextResearchLevel?: number;
  timeframe: string;
}

export interface RiskAnalysis {
  symbol: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'extreme';
  summary: string;
  factors: { label: string; impact: 'positive' | 'negative' | 'neutral'; detail: string }[];
  positionSizing?: string;
}

export interface PatternExplanation {
  symbol: string;
  pattern: string;
  direction: AiSentiment;
  reliability: number;
  explanation: string;
  keyLevels: { label: string; price: number }[];
}

export interface IndicatorExplanation {
  symbol: string;
  indicator: string;
  value: number | string;
  signal: AiSentiment;
  explanation: string;
  interpretation: string;
}

export interface DailySummary {
  date: string;
  summary: string;
  sentiment: AiSentiment;
  highlights: string[];
  watchlist: string[];
}

export interface MarketRecap {
  period: 'daily' | 'weekly';
  summary: string;
  topMovers: { symbol: string; changePercent: number }[];
  sectorPerformance: { sector: string; changePercent: number }[];
  keyEvents: string[];
}

export interface PsychologyCoachResponse {
  topic: string;
  advice: string;
  exercises: string[];
  mindsetTips: string[];
}

export interface PortfolioReview {
  overallHealth: 'strong' | 'moderate' | 'weak';
  diversificationScore: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
}

export interface NewsSummary {
  headline: string;
  summary: string;
  sentiment: AiSentiment;
  affectedSymbols: string[];
  keyTakeaways: string[];
}

export interface AiAnalysisResult {
  type: AiAnalysisType;
  content: string;
  sentiment?: AiSentiment;
  tradeSuggestion?: TradeSuggestion;
  riskAnalysis?: RiskAnalysis;
  patternExplanation?: PatternExplanation;
  indicatorExplanation?: IndicatorExplanation;
  dailySummary?: DailySummary;
  marketRecap?: MarketRecap;
  psychologyCoach?: PsychologyCoachResponse;
  portfolioReview?: PortfolioReview;
  newsSummary?: NewsSummary;
  generatedAt: number;
  tokensUsed?: number;
  metadata?: AiAnalysisMetadata;
}

export interface AiEnrichedContext {
  symbol?: string;
  quote?: {
    price: number;
    change: number;
    changePercent: number;
    volume?: number;
    high?: number;
    low?: number;
  };
  trend?: string;
  overallBias?: AiSentiment;
  biasConfidence?: number;
  rsi?: { value: number; signal: string };
  macd?: { signal: string; histogram?: number };
  atr?: number;
  adx?: number;
  stochastic?: { k: number; d: number };
  supportLevels?: number[];
  resistanceLevels?: number[];
  detectedPatterns?: { name: string; bullish: boolean; confidence: number }[];
  availableIndicators?: string[];
  newsHeadlines?: { id: string; title: string; source: string }[];
  portfolioHoldings?: { symbol: string; quantity: number; avgCost: number; weight?: number }[];
  fearGreedIndex?: number;
  fearGreedLabel?: string;
  /** Unified Decision Intelligence — AI must not ignore this when present. */
  decisionIntelligence?: {
    psychologyReminder: string;
    recommendedFocus: string;
    regimeLabel?: string;
    processScoreWeek?: number;
    tradingStyle?: string;
    typicalMistakes?: string[];
    coachTone?: string;
    markets?: string[];
    struggles?: string[];
    researchTimeOfDay?: string;
    successDefinitions?: string[];
  };
  assembledAt: number;
}

export interface AiRequestContext {
  symbol?: string;
  indicator?: string;
  pattern?: string;
  portfolio?: { symbol: string; quantity: number; avgCost: number }[];
  newsIds?: string[];
  timeframe?: string;
  customPrompt?: string;
  enriched?: AiEnrichedContext;
}

export interface AiUsageStats {
  usedToday: number;
  limit: number;
  resetsAt: number;
  /** True when usage is ≥ 80% of the daily cap but not yet exhausted. */
  isNearLimit: boolean;
  /** True when the hard daily cap has been reached. */
  isAtLimit: boolean;
}

export interface AiChatRequest {
  message: string;
  sessionId?: string;
  context?: AiRequestContext;
  history?: Pick<AiMessage, 'role' | 'content'>[];
}

export interface AiChatResponse {
  message: AiMessage;
  sessionId: string;
  usage?: AiUsageStats;
}

export interface AiServiceError {
  code: 'RATE_LIMITED' | 'SUBSCRIPTION_REQUIRED' | 'DAILY_LIMIT_REACHED' | 'API_ERROR';
  message: string;
  retryAfterMs?: number;
}
