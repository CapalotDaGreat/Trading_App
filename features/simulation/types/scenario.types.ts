import type { SimulationAssetType } from './simulation.types';

/** Hidden from the user. They infer conditions from the visible tape. */
export type MarketRegime =
  | 'strong_bull'
  | 'weak_bull'
  | 'sideways'
  | 'high_vol_sideways'
  | 'bear'
  | 'panic'
  | 'recovery'
  | 'transition'
  | 'sector_rotation';

export type TapePhase =
  | 'impulse'
  | 'pullback'
  | 'consolidation'
  | 'breakout_attempt'
  | 'failed_breakout'
  | 'reversal'
  | 'momentum_burst';

/**
 * Scenario practice level. Independent of challenge rails (1% risk, diversification).
 * Influences ambiguity and information — never a forced-loss slider.
 */
export type ScenarioDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export type ScenarioEventKind =
  | 'inflation'
  | 'rate_decision'
  | 'employment'
  | 'gdp'
  | 'earnings'
  | 'guidance'
  | 'product'
  | 'regulatory'
  | 'geopolitical'
  | 'commodity_shock'
  | 'banking_stress'
  | 'sector_news'
  | 'liquidity_shock'
  | 'false_breakout'
  | 'volatility_expansion';

export type EventReactionStyle =
  | 'impulse_extend'
  | 'gap_fade'
  | 'muted'
  | 'vol_only'
  | 'delayed'
  | 'gap_reverse';

export type ScenarioFocus =
  | 'position_sizing'
  | 'false_breakouts'
  | 'uncertainty'
  | 'event_adaptation'
  | 'correlation'
  | 'thesis_discipline'
  | 'fomo_chase'
  | 'invalidation_discipline'
  | 'overconfidence';

export const ALL_SCENARIO_FOCI: readonly ScenarioFocus[] = [
  'position_sizing',
  'false_breakouts',
  'uncertainty',
  'event_adaptation',
  'correlation',
  'thesis_discipline',
  'fomo_chase',
  'invalidation_discipline',
  'overconfidence',
];

export interface ScenarioStartOptions {
  focus?: ScenarioFocus;
  preferredEventKind?: ScenarioEventKind;
  difficulty?: ScenarioDifficulty;
  /** Hide the named skill in training copy. Rationale stays generic. */
  concealConcept?: boolean;
}

export type ScenarioClockMode = 'normal' | 'accelerated' | 'paused';

export type ScenarioDecisionOption = 'wait' | 'enter' | 'reduce' | 'ignore' | 'research';

export type ScenarioDecisionKind =
  | 'breakout'
  | 'drawdown'
  | 'event_eve'
  | 'thesis_check'
  | 'vol_spike'
  | 'extended_move'
  | 'invalidation_check';

export type MacroClimate = 'easing' | 'tightening' | 'stable' | 'uncertain';
export type MarketSentiment = 'risk_on' | 'risk_off' | 'mixed' | 'complacent';
export type LiquidityClimate = 'deep' | 'normal' | 'thin';

export interface ScenarioComplexity {
  volatility: number;
  informationFriction: number;
  assetCount: number;
  eventCount: number;
  regimeUncertainty: number;
  timePressure: number;
  psychologicalPressure: number;
  incompleteInformation: number;
}

export interface ScenarioFriction {
  spreadBps: number;
  slippageBps: number;
  feeBps: number;
  gapRisk: number;
  executionUncertainty: number;
}

export interface ScenarioClimate {
  macro: MacroClimate;
  sentiment: MarketSentiment;
  liquidity: LiquidityClimate;
}

export interface RegimeSegment {
  startDay: number;
  endDay: number;
  regime: MarketRegime;
}

export interface ScenarioEvent {
  id: string;
  announceDay: number;
  resolveDay: number;
  kind: ScenarioEventKind;
  title: string;
  /** Shown before the outcome. Must not leak the result. */
  briefing: string;
  companyName?: string;
  expectedValue?: string;
  /** Hidden until resolveDay. */
  actualValue?: string;
  /** Hidden until resolveDay. −1 … 1. */
  surpriseMagnitude: number;
  marketRelevance: number;
  affectedSectors: string[];
  symbols: string[];
  volatilityEffect: number;
  sentimentEffect: number;
  /** Hidden until resolveDay. Probabilistic — not a rule. */
  reactionStyle: EventReactionStyle;
  /** Shown only after resolveDay. Educational, not a trade instruction. */
  outcome: string;
  /** Basis-point directional impulse used while generating the path. */
  shockBps: number;
}

export interface ScenarioDecisionResponse {
  option: ScenarioDecisionOption;
  reasoning?: string;
  at: string;
}

export interface ScenarioDecisionWindow {
  id: string;
  day: number;
  kind: ScenarioDecisionKind;
  prompt: string;
  options: ScenarioDecisionOption[];
  response?: ScenarioDecisionResponse;
}

export interface ScenarioAssetConfig {
  symbol: string;
  name: string;
  assetType: SimulationAssetType;
  sector: string;
  basePrice: number;
  beta: number;
  idiosyncrasy: number;
  liquidity: number;
  meanReversion: number;
  momentumBias: number;
}

export interface SimulationBar {
  day: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  /** Internal structure tag. Never show in the UI. */
  phase: TapePhase;
}

/**
 * Generated paper-market scenario.
 * `seed` is for reproducibility in tests/debug. Never render it in the UI.
 */
export interface SimulationScenario {
  id: string;
  /** Internal only — do not show to users. */
  seed: number;
  /** 2 = structured multi-factor paths stored on the scenario. */
  engineVersion: 1 | 2;
  difficulty: ScenarioDifficulty;
  regime: MarketRegime;
  segments: RegimeSegment[];
  climate: ScenarioClimate;
  complexity: ScenarioComplexity;
  friction: ScenarioFriction;
  focus?: ScenarioFocus;
  /**
   * Optional learner-facing note before a personalized book.
   * Must not name the exact “correct” behavior or leak a buy/sell instruction.
   */
  trainingRationale?: string;
  assets: ScenarioAssetConfig[];
  events: ScenarioEvent[];
  decisionWindows: ScenarioDecisionWindow[];
  paths: Record<string, SimulationBar[]>;
  marketPath: SimulationBar[];
  horizonDays: number;
  startingDay: number;
  clockDay: number;
  clockMode: ScenarioClockMode;
  createdAt: string;
  completedAt?: string;
}

/** User-facing view. No seed, no future bars, no unresolved outcomes. */
export interface PublicScenarioView {
  id: string;
  clockDay: number;
  horizonDays: number;
  clockMode: ScenarioClockMode;
  observableTape: string;
  climateHint: string;
  /** Practice level copy — not “this market will be easy/hard to profit from”. */
  practiceLevelHint: string;
  /** Generic training context only. Never a named skill or a trade instruction. */
  trainingRationale?: string;
  assets: Array<{ symbol: string; name: string; sector: string; assetType: SimulationAssetType }>;
  visibleBars: Record<string, Array<Omit<SimulationBar, 'phase'>>>;
  visibleEvents: PublicScenarioEvent[];
  pendingDecision: PublicDecisionWindow | null;
  completed: boolean;
}

export interface PublicScenarioEvent {
  id: string;
  announceDay: number;
  resolveDay: number;
  kind: ScenarioEventKind;
  title: string;
  briefing: string;
  companyName?: string;
  expectedValue?: string;
  resolved: boolean;
  actualValue?: string;
  outcome?: string;
  symbols: string[];
}

export interface PublicDecisionWindow {
  id: string;
  day: number;
  kind: ScenarioDecisionKind;
  prompt: string;
  options: ScenarioDecisionOption[];
  response?: ScenarioDecisionResponse;
}

export const DECISION_OPTION_LABELS: Record<ScenarioDecisionOption, string> = {
  wait: 'Wait',
  enter: 'Enter / add',
  reduce: 'Reduce risk',
  ignore: 'Ignore',
  research: 'Research more',
};

/** Internal labels for docs/tests — never the Home or Simulate headline. */
export const REGIME_LABELS: Record<MarketRegime, string> = {
  strong_bull: 'Strong advance (hidden)',
  weak_bull: 'Soft advance (hidden)',
  sideways: 'Range (hidden)',
  high_vol_sideways: 'Volatile range (hidden)',
  bear: 'Decline (hidden)',
  panic: 'Disorderly decline (hidden)',
  recovery: 'Recovery (hidden)',
  transition: 'Transition (hidden)',
  sector_rotation: 'Rotation (hidden)',
};
